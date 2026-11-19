#![no_std]
//! CarePass pass vault — one contract per family member.
//!
//! The contract itself holds the USDC. Nobody (not even CarePass) can move it except through the rules below:
//!  * the BENEFICIARY can only `pay` a merchant that is on the registry whitelist, whose care type is allowed,
//!    and only while the pass is not frozen and the vault holds enough unlocked money;
//!  * the SPONSOR can change the rules, freeze/unfreeze, and take unspent funds back.
//! Anyone can top the vault up by sending the token to the contract address.
//!
//! CARE PLANS (escrow). The sponsor can open a plan: a list of steps, each with a verified provider and an amount.
//! The money for every step is locked in the vault the moment the plan opens (it can't be paid elsewhere or withdrawn).
//! A step is released only when BOTH the provider and the patient sign `confirm_step`, and only in order. The sponsor's
//! plan IS the limit: providers and amounts are fixed when it opens, and the plan is fully funded up front.
//! The sponsor can cancel a plan to unlock whatever has not been released.

use soroban_sdk::{
    contract, contractclient, contracterror, contractevent, contractimpl, contracttype, token, Address, Env, Vec,
};

const DAY: u32 = 17_280; // ledgers per day (~5s)
const TTL_THRESHOLD: u32 = 30 * DAY;
const TTL_EXTEND: u32 = 180 * DAY;

/// Minimal interface of the registry contract (kept local so this crate doesn't depend on its code at runtime).
#[contractclient(name = "RegistryClient")]
pub trait RegistryInterface {
    fn category_of(env: Env, merchant: Address) -> Option<u32>;
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Config {
    pub sponsor: Address,
    pub beneficiary: Address,
    pub token: Address,
    pub registry: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Rules {
    /// Bit `n` set = care category `n` allowed (0 hospital, 1 lab, 2 pharmacy, 3 dental, 4 optical).
    pub allowed_mask: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct State {
    pub frozen: bool,
    /// Money locked for care-plan steps that have not been released yet.
    pub reserved: i128,
}

/// What the sponsor asks for when opening a plan.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StepSpec {
    pub merchant: Address,
    pub amount: i128,
}

pub const STEP_PENDING: u32 = 0;
pub const STEP_DONE: u32 = 1;
pub const STEP_CANCELLED: u32 = 2;
pub const MAX_STEPS: u32 = 12;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Step {
    pub merchant: Address,
    pub amount: i128,
    pub status: u32,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Config,
    Rules,
    State,
    NextPlan,
    Plan(u64),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    InvalidAmount = 1,
    Frozen = 2,
    NotWhitelisted = 3,
    CategoryNotAllowed = 4,
    InsufficientBalance = 7,
    InvalidRules = 8,
    PlanNotFound = 9,
    StepNotFound = 10,
    StepNotPending = 11,
    OutOfOrder = 12,
    BadPlan = 13,
}

#[contractevent]
pub struct Paid {
    #[topic]
    pub merchant: Address,
    pub amount: i128,
}

#[contractevent]
pub struct FrozenChanged {
    pub frozen: bool,
}

#[contractevent]
pub struct RulesChanged {
    pub allowed_mask: u32,
}

#[contractevent]
pub struct PlanOpened {
    #[topic]
    pub plan_id: u64,
    pub total: i128,
}

#[contractevent]
pub struct StepConfirmed {
    #[topic]
    pub plan_id: u64,
    pub index: u32,
    pub merchant: Address,
    pub amount: i128,
}

#[contractevent]
pub struct PlanCancelled {
    #[topic]
    pub plan_id: u64,
    pub released_back: i128,
}

#[contractevent]
pub struct Withdrawn {
    pub amount: i128,
}

#[contract]
pub struct Pass;

#[contractimpl]
impl Pass {
    pub fn __constructor(
        env: Env,
        sponsor: Address,
        beneficiary: Address,
        token: Address,
        registry: Address,
        allowed_mask: u32,
    ) -> Result<(), Error> {
        let rules = Rules { allowed_mask };
        Self::validate(&rules)?;
        let s = env.storage().instance();
        s.set(&DataKey::Config, &Config { sponsor, beneficiary, token, registry });
        s.set(&DataKey::Rules, &rules);
        s.set(&DataKey::State, &State { frozen: false, reserved: 0 });
        Ok(())
    }

    // ---------------------------------------------------------------- beneficiary

    /// Pay a verified merchant. Fails — and moves nothing — if any guardrail rule is broken.
    pub fn pay(env: Env, merchant: Address, amount: i128) -> Result<(), Error> {
        let cfg = Self::config(&env);
        cfg.beneficiary.require_auth();
        Self::evaluate(&env, &merchant, amount)?;

        env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND);

        token::Client::new(&env, &cfg.token).transfer(&env.current_contract_address(), &merchant, &amount);
        Paid { merchant, amount }.publish(&env);
        Ok(())
    }

    /// Read-only dry run of `pay`. The app uses this to show exactly why a payment would be blocked.
    pub fn check_payment(env: Env, merchant: Address, amount: i128) -> Result<(), Error> {
        Self::evaluate(&env, &merchant, amount)
    }

    // ---------------------------------------------------------------- sponsor

    pub fn set_rules(env: Env, allowed_mask: u32) -> Result<(), Error> {
        Self::config(&env).sponsor.require_auth();
        let rules = Rules { allowed_mask };
        Self::validate(&rules)?;
        env.storage().instance().set(&DataKey::Rules, &rules);
        RulesChanged { allowed_mask }.publish(&env);
        Ok(())
    }

    pub fn set_frozen(env: Env, frozen: bool) {
        Self::config(&env).sponsor.require_auth();
        let mut st = Self::state(&env);
        st.frozen = frozen;
        env.storage().instance().set(&DataKey::State, &st);
        FrozenChanged { frozen }.publish(&env);
    }

    /// Take unspent funds back to the sponsor. This is what keeps the design non-custodial.
    pub fn withdraw(env: Env, amount: i128) -> Result<(), Error> {
        let cfg = Self::config(&env);
        cfg.sponsor.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let t = token::Client::new(&env, &cfg.token);
        if t.balance(&env.current_contract_address()) - Self::state(&env).reserved < amount {
            return Err(Error::InsufficientBalance);
        }
        t.transfer(&env.current_contract_address(), &cfg.sponsor, &amount);
        Withdrawn { amount }.publish(&env);
        Ok(())
    }

    // ---------------------------------------------------------------- care plans

    /// Opens a care plan and locks the money for every step. Returns the plan's number.
    pub fn open_plan(env: Env, steps: Vec<StepSpec>) -> Result<u64, Error> {
        let cfg = Self::config(&env);
        cfg.sponsor.require_auth();
        if steps.is_empty() || steps.len() > MAX_STEPS {
            return Err(Error::BadPlan);
        }
        let mut st = Self::state(&env);
        if st.frozen {
            return Err(Error::Frozen);
        }
        let rules: Rules = env.storage().instance().get(&DataKey::Rules).unwrap();
        let registry = RegistryClient::new(&env, &cfg.registry);
        let mut total: i128 = 0;
        let mut out: Vec<Step> = Vec::new(&env);
        for s in steps.iter() {
            if s.amount <= 0 {
                return Err(Error::InvalidAmount);
            }
            let category = registry.category_of(&s.merchant).ok_or(Error::NotWhitelisted)?;
            if category >= 32 || rules.allowed_mask & (1u32 << category) == 0 {
                return Err(Error::CategoryNotAllowed);
            }
            total += s.amount;
            out.push_back(Step { merchant: s.merchant, amount: s.amount, status: STEP_PENDING });
        }
        let held = token::Client::new(&env, &cfg.token).balance(&env.current_contract_address());
        if held - st.reserved < total {
            return Err(Error::InsufficientBalance);
        }
        st.reserved += total;
        env.storage().instance().set(&DataKey::State, &st);
        let id: u64 = env.storage().instance().get(&DataKey::NextPlan).unwrap_or(1);
        env.storage().instance().set(&DataKey::NextPlan, &(id + 1));
        env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND);
        env.storage().persistent().set(&DataKey::Plan(id), &out);
        env.storage().persistent().extend_ttl(&DataKey::Plan(id), TTL_THRESHOLD, TTL_EXTEND);
        PlanOpened { plan_id: id, total }.publish(&env);
        Ok(id)
    }

    /// Releases one step to its provider. The provider AND the patient must both sign, and earlier steps must be done.
    pub fn confirm_step(env: Env, plan_id: u64, index: u32) -> Result<(), Error> {
        let cfg = Self::config(&env);
        let key = DataKey::Plan(plan_id);
        let mut steps: Vec<Step> = env.storage().persistent().get(&key).ok_or(Error::PlanNotFound)?;
        let mut step = steps.get(index).ok_or(Error::StepNotFound)?;
        step.merchant.require_auth();
        cfg.beneficiary.require_auth();
        if step.status != STEP_PENDING {
            return Err(Error::StepNotPending);
        }
        for i in 0..index {
            if steps.get(i).unwrap().status == STEP_PENDING {
                return Err(Error::OutOfOrder);
            }
        }
        let mut st = Self::state(&env);
        if st.frozen {
            return Err(Error::Frozen);
        }
        let registry = RegistryClient::new(&env, &cfg.registry);
        if registry.category_of(&step.merchant).is_none() {
            return Err(Error::NotWhitelisted);
        }
        st.reserved -= step.amount;
        env.storage().instance().set(&DataKey::State, &st);
        step.status = STEP_DONE;
        steps.set(index, step.clone());
        env.storage().persistent().set(&key, &steps);
        env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        token::Client::new(&env, &cfg.token).transfer(&env.current_contract_address(), &step.merchant, &step.amount);
        StepConfirmed { plan_id, index, merchant: step.merchant, amount: step.amount }.publish(&env);
        Ok(())
    }

    /// Cancels the steps that haven't been released and unlocks their money.
    pub fn cancel_plan(env: Env, plan_id: u64) -> Result<(), Error> {
        let cfg = Self::config(&env);
        cfg.sponsor.require_auth();
        let key = DataKey::Plan(plan_id);
        let mut steps: Vec<Step> = env.storage().persistent().get(&key).ok_or(Error::PlanNotFound)?;
        let mut back: i128 = 0;
        for i in 0..steps.len() {
            let mut s = steps.get(i).unwrap();
            if s.status == STEP_PENDING {
                back += s.amount;
                s.status = STEP_CANCELLED;
                steps.set(i, s);
            }
        }
        let mut st = Self::state(&env);
        st.reserved -= back;
        env.storage().instance().set(&DataKey::State, &st);
        env.storage().persistent().set(&key, &steps);
        PlanCancelled { plan_id, released_back: back }.publish(&env);
        Ok(())
    }

    // ---------------------------------------------------------------- views

    pub fn config_view(env: Env) -> Config {
        Self::config(&env)
    }
    pub fn rules(env: Env) -> Rules {
        env.storage().instance().get(&DataKey::Rules).unwrap()
    }
    pub fn is_frozen(env: Env) -> bool {
        Self::state(&env).frozen
    }
    /// Money locked for care-plan steps that haven't been released.
    pub fn reserved(env: Env) -> i128 {
        Self::state(&env).reserved
    }
    /// What the vault holds that is not locked for a plan.
    pub fn available(env: Env) -> i128 {
        let cfg = Self::config(&env);
        token::Client::new(&env, &cfg.token).balance(&env.current_contract_address()) - Self::state(&env).reserved
    }
    pub fn plan(env: Env, plan_id: u64) -> Result<Vec<Step>, Error> {
        env.storage().persistent().get(&DataKey::Plan(plan_id)).ok_or(Error::PlanNotFound)
    }
    pub fn balance(env: Env) -> i128 {
        token::Client::new(&env, &Self::config(&env).token).balance(&env.current_contract_address())
    }

    // ---------------------------------------------------------------- internals

    fn config(env: &Env) -> Config {
        env.storage().instance().get(&DataKey::Config).unwrap()
    }
    fn state(env: &Env) -> State {
        env.storage().instance().get(&DataKey::State).unwrap()
    }
    fn validate(r: &Rules) -> Result<(), Error> {
        if r.allowed_mask == 0 || r.allowed_mask >= 1 << 5 {
            return Err(Error::InvalidRules);
        }
        Ok(())
    }
    /// Rule order mirrors the app: pass → merchant → care type → balance.
    fn evaluate(env: &Env, merchant: &Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let cfg = Self::config(env);
        let st = Self::state(env);
        if st.frozen {
            return Err(Error::Frozen);
        }
        let category = RegistryClient::new(env, &cfg.registry)
            .category_of(merchant)
            .ok_or(Error::NotWhitelisted)?;
        let rules: Rules = env.storage().instance().get(&DataKey::Rules).unwrap();
        if category >= 32 || rules.allowed_mask & (1u32 << category) == 0 {
            return Err(Error::CategoryNotAllowed);
        }
        if token::Client::new(env, &cfg.token).balance(&env.current_contract_address()) - st.reserved < amount {
            return Err(Error::InsufficientBalance);
        }
        Ok(())
    }
}

#[cfg(test)]
mod test;
