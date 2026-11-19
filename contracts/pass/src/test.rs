extern crate std;

use super::*;
use carepass_registry::{Registry, RegistryClient as RegClient};
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    String,
};

const HOSPITAL: u32 = 0;
const PHARMACY: u32 = 2;
const DENTAL: u32 = 3;
const ONE: i128 = 10_000_000; // 1 USDC at 7 decimals

struct Fx<'a> {
    env: Env,
    sponsor: Address,
    beneficiary: Address,
    hospital: Address,
    dental: Address,
    unlisted: Address,
    pass: PassClient<'a>,
    token: TokenClient<'a>,
    registry: RegClient<'a>,
}

/// Pass: $300/month, $150/payment, hospital + pharmacy allowed, funded with $200.
fn setup<'a>() -> Fx<'a> {
    let env = Env::default();
    env.mock_all_auths();
    let sponsor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let issuer = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(issuer);
    let token = TokenClient::new(&env, &sac.address());
    let registry_id = env.register(Registry, (Address::generate(&env),));
    let registry = RegClient::new(&env, &registry_id);

    let hospital = Address::generate(&env);
    let dental = Address::generate(&env);
    registry.add_merchant(&hospital, &String::from_str(&env, "Lagoon Hospital"), &HOSPITAL);
    registry.add_merchant(&dental, &String::from_str(&env, "Smile Dental"), &DENTAL);

    let mask: u32 = (1 << HOSPITAL) | (1 << PHARMACY);
    let pass_id = env.register(
        Pass,
        (&sponsor, &beneficiary, &sac.address(), &registry_id, mask),
    );
    StellarAssetClient::new(&env, &sac.address()).mint(&pass_id, &(200 * ONE));
    let pass = PassClient::new(&env, &pass_id);
    Fx { unlisted: Address::generate(&env), env, sponsor, beneficiary, hospital, dental, pass, token, registry }
}

#[test]
fn pays_verified_merchant() {
    let f = setup();
    f.pass.pay(&f.hospital, &(50 * ONE));
    assert_eq!(f.token.balance(&f.hospital), 50 * ONE);
    assert_eq!(f.pass.balance(), 150 * ONE);
}

#[test]
fn blocks_personal_wallet_and_moves_nothing() {
    let f = setup();
    assert_eq!(f.pass.try_pay(&f.unlisted, &(50 * ONE)), Err(Ok(Error::NotWhitelisted)));
    assert_eq!(f.token.balance(&f.unlisted), 0);
    assert_eq!(f.pass.balance(), 200 * ONE);
}

#[test]
fn blocks_disallowed_care_type() {
    let f = setup();
    assert_eq!(f.pass.try_pay(&f.dental, &(10 * ONE)), Err(Ok(Error::CategoryNotAllowed)));
}

#[test]
fn blocks_when_balance_too_low() {
    let f = setup();
    f.pass.pay(&f.hospital, &(150 * ONE));
    assert_eq!(f.pass.try_pay(&f.hospital, &(60 * ONE)), Err(Ok(Error::InsufficientBalance)));
}

#[test]
fn frozen_pass_blocks_until_unfrozen() {
    let f = setup();
    f.pass.set_frozen(&true);
    assert!(f.pass.is_frozen());
    assert_eq!(f.pass.try_pay(&f.hospital, &(10 * ONE)), Err(Ok(Error::Frozen)));
    f.pass.set_frozen(&false);
    f.pass.pay(&f.hospital, &(10 * ONE));
}

#[test]
fn removed_merchant_is_blocked() {
    let f = setup();
    f.registry.remove_merchant(&f.hospital);
    assert_eq!(f.pass.try_pay(&f.hospital, &(10 * ONE)), Err(Ok(Error::NotWhitelisted)));
}

#[test]
fn rejects_zero_or_negative_amount() {
    let f = setup();
    assert_eq!(f.pass.try_pay(&f.hospital, &0), Err(Ok(Error::InvalidAmount)));
    assert_eq!(f.pass.try_pay(&f.hospital, &-5), Err(Ok(Error::InvalidAmount)));
}

#[test]
fn check_payment_matches_pay_without_moving_funds() {
    let f = setup();
    assert_eq!(f.pass.try_check_payment(&f.hospital, &(50 * ONE)), Ok(Ok(())));
    assert_eq!(f.pass.try_check_payment(&f.unlisted, &(50 * ONE)), Err(Ok(Error::NotWhitelisted)));
    assert_eq!(f.pass.balance(), 200 * ONE);
}

#[test]
fn sponsor_can_change_rules() {
    let f = setup();
    f.pass.set_rules(&((1 << HOSPITAL) | (1 << DENTAL)));
    f.pass.pay(&f.dental, &(80 * ONE)); // dental now allowed
    assert_eq!(f.pass.try_set_rules(&0), Err(Ok(Error::InvalidRules)));
}

#[test]
fn sponsor_can_withdraw_unspent_funds() {
    let f = setup();
    f.pass.pay(&f.hospital, &(50 * ONE));
    f.pass.withdraw(&(150 * ONE));
    assert_eq!(f.token.balance(&f.sponsor), 150 * ONE);
    assert_eq!(f.pass.balance(), 0);
    assert_eq!(f.pass.try_withdraw(&ONE), Err(Ok(Error::InsufficientBalance)));
}

#[test]
fn only_the_right_people_can_act() {
    // No mock_all_auths here: every require_auth is really enforced.
    let env = Env::default();
    let (sponsor, beneficiary, stranger) = (Address::generate(&env), Address::generate(&env), Address::generate(&env));
    let sac = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let reg = env.register(Registry, (Address::generate(&env),));
    let pass_id = env.register(Pass, (&sponsor, &beneficiary, &sac.address(), &reg, 1u32));
    let pass = PassClient::new(&env, &pass_id);
    assert!(pass.try_set_frozen(&true).is_err());
    assert!(pass.try_set_rules(&1).is_err());
    assert!(pass.try_withdraw(&ONE).is_err());
    assert!(pass.try_pay(&stranger, &ONE).is_err());
}

#[test]
#[should_panic]
fn constructor_rejects_invalid_rules() {
    let env = Env::default();
    env.mock_all_auths();
    let a = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(Address::generate(&env));
    // no care type allowed
    env.register(Pass, (&a, &a, &sac.address(), &a, 0u32));
}

impl<'a> Fx<'a> {
    /// Top the vault up with `usdc` test dollars (anyone may do this — it is just a token transfer).
    fn token_mint_for_test(&self, usdc: i128) {
        StellarAssetClient::new(&self.env, &self.token.address).mint(&self.pass.address, &(usdc * ONE));
    }
}

// ------------------------------------------------------------------ care plans (escrow)

fn spec(f: &Fx, merchant: &Address, usdc: i128) -> StepSpec {
    let _ = f;
    StepSpec { merchant: merchant.clone(), amount: usdc * ONE }
}

#[test]
fn open_plan_locks_money_for_the_steps() {
    let f = setup();
    let id = f.pass.open_plan(&soroban_sdk::vec![&f.env, spec(&f, &f.hospital, 40), spec(&f, &f.hospital, 30)]);
    assert_eq!(id, 1);
    assert_eq!(f.pass.reserved(), 70 * ONE);
    assert_eq!(f.pass.available(), 130 * ONE);
    assert_eq!(f.pass.balance(), 200 * ONE); // still in the vault
    // Locked money can't be spent on anything else or taken back
    assert_eq!(f.pass.try_pay(&f.hospital, &(140 * ONE)), Err(Ok(Error::InsufficientBalance)));
    f.pass.pay(&f.hospital, &(130 * ONE));
    assert_eq!(f.pass.try_withdraw(&ONE), Err(Ok(Error::InsufficientBalance)));
    assert_eq!(f.pass.plan(&id).len(), 2);
    // Plans get their own numbers
    f.token_mint_for_test(100);
    assert_eq!(f.pass.open_plan(&soroban_sdk::vec![&f.env, spec(&f, &f.hospital, 10)]), 2);
}

#[test]
fn a_step_is_released_only_when_provider_and_patient_both_sign() {
    let f = setup();
    let id = f.pass.open_plan(&soroban_sdk::vec![&f.env, spec(&f, &f.hospital, 40), spec(&f, &f.hospital, 30)]);
    f.pass.confirm_step(&id, &0);
    let signers: std::vec::Vec<Address> = f.env.auths().into_iter().map(|(a, _)| a).collect();
    assert!(signers.contains(&f.hospital), "the provider must sign");
    assert!(signers.contains(&f.beneficiary), "the patient must sign");
    assert!(!signers.contains(&f.sponsor), "the sponsor is not needed to release a step");
    assert_eq!(f.token.balance(&f.hospital), 40 * ONE);
    assert_eq!(f.pass.reserved(), 30 * ONE);
    assert_eq!(f.pass.try_confirm_step(&id, &0), Err(Ok(Error::StepNotPending))); // no double release
    f.pass.confirm_step(&id, &1);
    assert_eq!(f.token.balance(&f.hospital), 70 * ONE);
    assert_eq!(f.pass.reserved(), 0);
}

#[test]
fn steps_must_be_confirmed_in_order() {
    let f = setup();
    let id = f.pass.open_plan(&soroban_sdk::vec![&f.env, spec(&f, &f.hospital, 40), spec(&f, &f.hospital, 30)]);
    assert_eq!(f.pass.try_confirm_step(&id, &1), Err(Ok(Error::OutOfOrder)));
    assert_eq!(f.pass.try_confirm_step(&id, &5), Err(Ok(Error::StepNotFound)));
    assert_eq!(f.pass.try_confirm_step(&99, &0), Err(Ok(Error::PlanNotFound)));
    assert_eq!(f.token.balance(&f.hospital), 0);
}

#[test]
fn a_plan_must_follow_the_pass_rules_when_it_opens() {
    let f = setup();
    let unlisted = f.unlisted.clone();
    assert_eq!(f.pass.try_open_plan(&soroban_sdk::vec![&f.env, spec(&f, &unlisted, 10)]), Err(Ok(Error::NotWhitelisted)));
    assert_eq!(f.pass.try_open_plan(&soroban_sdk::vec![&f.env, spec(&f, &f.dental, 10)]), Err(Ok(Error::CategoryNotAllowed)));
    assert_eq!(f.pass.try_open_plan(&soroban_sdk::vec![&f.env, spec(&f, &f.hospital, 0)]), Err(Ok(Error::InvalidAmount)));
    assert_eq!(f.pass.try_open_plan(&soroban_sdk::vec![&f.env, spec(&f, &f.hospital, 120), spec(&f, &f.hospital, 120)]), Err(Ok(Error::InsufficientBalance)));
    assert_eq!(f.pass.try_open_plan(&soroban_sdk::vec![&f.env]), Err(Ok(Error::BadPlan)));
    let mut many = soroban_sdk::Vec::new(&f.env);
    for _ in 0..13 { many.push_back(spec(&f, &f.hospital, 1)); }
    assert_eq!(f.pass.try_open_plan(&many), Err(Ok(Error::BadPlan)));
    assert_eq!(f.pass.reserved(), 0); // nothing was locked by the failures
    f.pass.set_frozen(&true);
    assert_eq!(f.pass.try_open_plan(&soroban_sdk::vec![&f.env, spec(&f, &f.hospital, 10)]), Err(Ok(Error::Frozen)));
}

#[test]
fn cancelling_a_plan_unlocks_the_unreleased_money() {
    let f = setup();
    let id = f.pass.open_plan(&soroban_sdk::vec![&f.env, spec(&f, &f.hospital, 40), spec(&f, &f.hospital, 30)]);
    f.pass.confirm_step(&id, &0);
    f.pass.cancel_plan(&id);
    assert_eq!(f.pass.reserved(), 0);
    let steps = f.pass.plan(&id);
    assert_eq!(steps.get(0).unwrap().status, STEP_DONE);
    assert_eq!(steps.get(1).unwrap().status, STEP_CANCELLED);
    assert_eq!(f.pass.try_confirm_step(&id, &1), Err(Ok(Error::StepNotPending)));
    f.pass.withdraw(&(160 * ONE)); // everything not already paid is the sponsor's again
    assert_eq!(f.token.balance(&f.sponsor), 160 * ONE);
}

#[test]
fn a_frozen_pass_holds_released_steps() {
    let f = setup();
    let id = f.pass.open_plan(&soroban_sdk::vec![&f.env, spec(&f, &f.hospital, 40)]);
    f.pass.set_frozen(&true);
    assert_eq!(f.pass.try_confirm_step(&id, &0), Err(Ok(Error::Frozen)));
    f.pass.set_frozen(&false);
    f.pass.confirm_step(&id, &0);
}

#[test]
fn a_provider_removed_from_the_registry_cannot_be_paid_and_the_sponsor_can_recover() {
    let f = setup();
    let id = f.pass.open_plan(&soroban_sdk::vec![&f.env, spec(&f, &f.hospital, 40)]);
    f.registry.remove_merchant(&f.hospital);
    assert_eq!(f.pass.try_confirm_step(&id, &0), Err(Ok(Error::NotWhitelisted)));
    f.pass.cancel_plan(&id);
    f.pass.withdraw(&(200 * ONE));
}

#[test]
fn only_the_right_people_can_run_a_plan() {
    // Real auth checks: nothing is mocked.
    let env = Env::default();
    let (sponsor, beneficiary, clinic) = (Address::generate(&env), Address::generate(&env), Address::generate(&env));
    let sac = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let reg = env.register(Registry, (Address::generate(&env),));
    let pass_id = env.register(Pass, (&sponsor, &beneficiary, &sac.address(), &reg, 1u32));
    let pass = PassClient::new(&env, &pass_id);
    let steps = soroban_sdk::vec![&env, StepSpec { merchant: clinic, amount: ONE }];
    assert!(pass.try_open_plan(&steps).is_err());
    assert!(pass.try_cancel_plan(&1).is_err());
    assert!(pass.try_confirm_step(&1, &0).is_err());
}
