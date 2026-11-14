#![no_std]
//! CarePass merchant registry.
//!
//! The list of verified care providers. Only the registry admin (in production a multisig run by
//! the verification body) can add or remove merchants. Pass contracts query it before every payment.

use soroban_sdk::{contract, contracterror, contractevent, contractimpl, contracttype, Address, Env, String};

pub const CATEGORY_COUNT: u32 = 5; // 0 hospital, 1 lab, 2 pharmacy, 3 dental, 4 optical
const DAY: u32 = 17_280; // ledgers per day (~5s)
const TTL_THRESHOLD: u32 = 30 * DAY;
const TTL_EXTEND: u32 = 180 * DAY;

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    Merchant(Address),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Merchant {
    pub name: String,
    pub category: u32,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    InvalidCategory = 1,
    NotFound = 2,
}

#[contractevent]
pub struct MerchantAdded {
    #[topic]
    pub merchant: Address,
    pub category: u32,
}

#[contractevent]
pub struct MerchantRemoved {
    #[topic]
    pub merchant: Address,
}

#[contract]
pub struct Registry;

#[contractimpl]
impl Registry {
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn add_merchant(env: Env, merchant: Address, name: String, category: u32) -> Result<(), Error> {
        Self::admin(env.clone()).require_auth();
        if category >= CATEGORY_COUNT {
            return Err(Error::InvalidCategory);
        }
        let key = DataKey::Merchant(merchant.clone());
        env.storage().persistent().set(&key, &Merchant { name, category });
        env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        MerchantAdded { merchant, category }.publish(&env);
        Ok(())
    }

    pub fn remove_merchant(env: Env, merchant: Address) -> Result<(), Error> {
        Self::admin(env.clone()).require_auth();
        let key = DataKey::Merchant(merchant.clone());
        if !env.storage().persistent().has(&key) {
            return Err(Error::NotFound);
        }
        env.storage().persistent().remove(&key);
        MerchantRemoved { merchant }.publish(&env);
        Ok(())
    }

    /// Category of an active merchant, or `None` if the address is not on the whitelist.
    pub fn category_of(env: Env, merchant: Address) -> Option<u32> {
        env.storage()
            .persistent()
            .get::<_, Merchant>(&DataKey::Merchant(merchant))
            .map(|m| m.category)
    }

    pub fn get_merchant(env: Env, merchant: Address) -> Option<Merchant> {
        env.storage().persistent().get(&DataKey::Merchant(merchant))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn admin_manages_whitelist() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let id = env.register(Registry, (admin.clone(),));
        let c = RegistryClient::new(&env, &id);
        let clinic = Address::generate(&env);

        assert_eq!(c.category_of(&clinic), None);
        c.add_merchant(&clinic, &String::from_str(&env, "Lagoon Hospital"), &0);
        assert_eq!(c.category_of(&clinic), Some(0));
        assert_eq!(c.get_merchant(&clinic).unwrap().name, String::from_str(&env, "Lagoon Hospital"));
        c.remove_merchant(&clinic);
        assert_eq!(c.category_of(&clinic), None);
    }

    #[test]
    fn rejects_bad_category_and_unknown_removal() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register(Registry, (Address::generate(&env),));
        let c = RegistryClient::new(&env, &id);
        let clinic = Address::generate(&env);
        assert_eq!(c.try_add_merchant(&clinic, &String::from_str(&env, "x"), &9), Err(Ok(Error::InvalidCategory)));
        assert_eq!(c.try_remove_merchant(&clinic), Err(Ok(Error::NotFound)));
    }

    #[test]
    fn only_admin_can_add() {
        let env = Env::default(); // no mock_all_auths: auth is really checked
        let admin = Address::generate(&env);
        let id = env.register(Registry, (admin,));
        let c = RegistryClient::new(&env, &id);
        let clinic = Address::generate(&env);
        assert!(c.try_add_merchant(&clinic, &String::from_str(&env, "x"), &0).is_err());
    }
}
