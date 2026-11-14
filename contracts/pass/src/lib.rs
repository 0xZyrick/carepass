#![no_std]
//! CarePass pass vault — one contract per family member.
//!
//! The contract itself holds the USDC. Nobody (not even CarePass) can move it except through the rules below:
//!  * the BENEFICIARY can only `pay` a merchant that is on the registry whitelist, whose care type is allowed,
//!    within the per-payment cap and the rolling 30-day limit, and only while the pass is not frozen;
//!  * the SPONSOR can change the rules, freeze/unfreeze, and take unspent funds back.
//! Anyone can top the vault up by sending the token to the contract address.

use soroban_sdk::{
    contract, contractclient, contracterror, contractevent, contractimpl, contracttype, token, Address, Env,
};

const DAY: u32 = 17_280; // ledgers per day (~5s)
const TTL_THRESHOLD: u32 = 30 * DAY;
const TTL_EXTEND: u32 = 180 * DAY;
/// Length of the spending window, in seconds (30 days).
pub const WINDOW_SECS: u64 = 30 * 24 * 60 * 60;

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
    pub monthly_limit: i128,
    pub per_tx_limit: i128,
    /// Bit `n` set = care category `n` allowed (0 hospital, 1 lab, 2 pharmacy, 3 dental, 4 optical).
    pub allowed_mask: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct State {
    pub frozen: bool,
    pub window_start: u64,
    pub spent: i128,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Config,
    Rules,
    State,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    InvalidAmount = 1,
    Frozen = 2,
    NotWhitelisted = 3,
    CategoryNotAllowed = 4,
    OverPaymentCap = 5,
    OverMonthlyLimit = 6,
    InsufficientBalance = 7,
    InvalidRules = 8,
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
    pub monthly_limit: i128,
    pub per_tx_limit: i128,
    pub allowed_mask: u32,
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
        monthly_limit: i128,
        per_tx_limit: i128,
        allowed_mask: u32,
    ) -> Result<(), Error> {
        let rules = Rules { monthly_limit, per_tx_limit, allowed_mask };
        Self::validate(&rules)?;
        let s = env.storage().instance();
        s.set(&DataKey::Config, &Config { sponsor, beneficiary, token, registry });
        s.set(&DataKey::Rules, &rules);
        s.set(&DataKey::State, &State { frozen: false, window_start: 0, spent: 0 });
        Ok(())
    }

    // ---------------------------------------------------------------- beneficiary

    /// Pay a verified merchant. Fails — and moves nothing — if any guardrail rule is broken.
    pub fn pay(env: Env, merchant: Address, amount: i128) -> Result<(), Error> {
        let cfg = Self::config(&env);
        cfg.beneficiary.require_auth();
        Self::evaluate(&env, &merchant, amount)?;

        let mut st = Self::state(&env);
        let (start, spent) = Self::window(&env, &st);
        st.window_start = start;
        st.spent = spent + amount;
        env.storage().instance().set(&DataKey::State, &st);
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

    pub fn set_rules(env: Env, monthly_limit: i128, per_tx_limit: i128, allowed_mask: u32) -> Result<(), Error> {
        Self::config(&env).sponsor.require_auth();
        let rules = Rules { monthly_limit, per_tx_limit, allowed_mask };
        Self::validate(&rules)?;
        env.storage().instance().set(&DataKey::Rules, &rules);
        RulesChanged { monthly_limit, per_tx_limit, allowed_mask }.publish(&env);
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
        if t.balance(&env.current_contract_address()) < amount {
            return Err(Error::InsufficientBalance);
        }
        t.transfer(&env.current_contract_address(), &cfg.sponsor, &amount);
        Withdrawn { amount }.publish(&env);
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
    pub fn spent_in_window(env: Env) -> i128 {
        let st = Self::state(&env);
        Self::window(&env, &st).1
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
        if r.monthly_limit <= 0 || r.per_tx_limit <= 0 || r.per_tx_limit > r.monthly_limit || r.allowed_mask == 0 || r.allowed_mask >= 1 << 5 {
            return Err(Error::InvalidRules);
        }
        Ok(())
    }
    /// Effective (window_start, spent) now: a fresh window opens once 30 days have passed.
    fn window(env: &Env, st: &State) -> (u64, i128) {
        let now = env.ledger().timestamp();
        if now >= st.window_start.saturating_add(WINDOW_SECS) {
            (now, 0)
        } else {
            (st.window_start, st.spent)
        }
    }
    /// Rule order mirrors the app's guardrail lab: pass → merchant → care type → cap → monthly → balance.
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
        if amount > rules.per_tx_limit {
            return Err(Error::OverPaymentCap);
        }
        let (_, spent) = Self::window(env, &st);
        if spent + amount > rules.monthly_limit {
            return Err(Error::OverMonthlyLimit);
        }
        if token::Client::new(env, &cfg.token).balance(&env.current_contract_address()) < amount {
            return Err(Error::InsufficientBalance);
        }
        Ok(())
    }
}

#[cfg(test)]
mod test;
