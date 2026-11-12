//! CareEscrow: holds a sponsor's funds for one care package and releases
//! them to the provider one step at a time.
//!
//! SKETCH. Not compiled, not tested, not audited. Testnet use only.
#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, Vec,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Count,
    Episode(u64),
}

#[contracttype]
#[derive(Clone)]
pub struct Episode {
    pub sponsor: Address,
    pub provider: Address,
    /// Platform key that signs a release after verifying the visit code.
    pub confirmer: Address,
    /// Token contract (USDC on testnet).
    pub token: Address,
    /// Payout per step, in token base units. Fixed at creation.
    pub steps: Vec<i128>,
    /// Number of steps already paid out.
    pub released: u32,
    pub cancelled: bool,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotFound = 1,
    AllReleased = 2,
    Cancelled = 3,
    BadAmount = 4,
}

#[contract]
pub struct CareEscrow;

fn load(env: &Env, id: u64) -> Result<Episode, Error> {
    env.storage().persistent().get(&DataKey::Episode(id)).ok_or(Error::NotFound)
}

fn save(env: &Env, id: u64, e: &Episode) {
    env.storage().persistent().set(&DataKey::Episode(id), e);
    // TODO: extend_ttl so long-running packages do not expire.
}

#[contractimpl]
impl CareEscrow {
    /// Sponsor deposits the full amount; returns the episode id.
    pub fn create(
        env: Env,
        sponsor: Address,
        provider: Address,
        confirmer: Address,
        token: Address,
        steps: Vec<i128>,
    ) -> Result<u64, Error> {
        sponsor.require_auth();
        let mut total: i128 = 0;
        for s in steps.iter() {
            if s <= 0 {
                return Err(Error::BadAmount);
            }
            total += s;
        }
        token::Client::new(&env, &token).transfer(&sponsor, &env.current_contract_address(), &total);

        let id: u64 = env.storage().persistent().get(&DataKey::Count).unwrap_or(0u64) + 1;
        env.storage().persistent().set(&DataKey::Count, &id);
        save(&env, id, &Episode { sponsor, provider, confirmer, token, steps, released: 0, cancelled: false });
        Ok(id)
    }

    /// Pays the next step to the provider. Signed by the confirmer.
    pub fn release_step(env: Env, id: u64) -> Result<(), Error> {
        let mut e = load(&env, id)?;
        e.confirmer.require_auth();
        if e.cancelled {
            return Err(Error::Cancelled);
        }
        let amount = e.steps.get(e.released).ok_or(Error::AllReleased)?;
        token::Client::new(&env, &e.token).transfer(&env.current_contract_address(), &e.provider, &amount);
        e.released += 1;
        save(&env, id, &e);
        env.events().publish((symbol_short!("released"), id), e.released);
        Ok(())
    }

    /// Sponsor reclaims everything not yet released.
    pub fn cancel(env: Env, id: u64) -> Result<i128, Error> {
        let mut e = load(&env, id)?;
        e.sponsor.require_auth();
        if e.cancelled {
            return Err(Error::Cancelled);
        }
        let mut refund: i128 = 0;
        for i in e.released..e.steps.len() {
            refund += e.steps.get(i).unwrap();
        }
        if refund > 0 {
            token::Client::new(&env, &e.token).transfer(&env.current_contract_address(), &e.sponsor, &refund);
        }
        e.cancelled = true;
        save(&env, id, &e);
        Ok(refund)
    }

    pub fn get(env: Env, id: u64) -> Result<Episode, Error> {
        load(&env, id)
    }
}
