extern crate std;

use super::*;
use carepass_registry::{Registry, RegistryClient as RegClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
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
        (&sponsor, &beneficiary, &sac.address(), &registry_id, 300 * ONE, 150 * ONE, mask),
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
    assert_eq!(f.pass.spent_in_window(), 50 * ONE);
}

#[test]
fn blocks_personal_wallet_and_moves_nothing() {
    let f = setup();
    assert_eq!(f.pass.try_pay(&f.unlisted, &(50 * ONE)), Err(Ok(Error::NotWhitelisted)));
    assert_eq!(f.token.balance(&f.unlisted), 0);
    assert_eq!(f.pass.balance(), 200 * ONE);
    assert_eq!(f.pass.spent_in_window(), 0);
}

#[test]
fn blocks_disallowed_care_type() {
    let f = setup();
    assert_eq!(f.pass.try_pay(&f.dental, &(10 * ONE)), Err(Ok(Error::CategoryNotAllowed)));
}

#[test]
fn enforces_per_payment_cap() {
    let f = setup();
    assert_eq!(f.pass.try_pay(&f.hospital, &(151 * ONE)), Err(Ok(Error::OverPaymentCap)));
    f.pass.pay(&f.hospital, &(150 * ONE)); // exactly at the cap is fine
}

#[test]
fn enforces_monthly_limit_and_resets_after_30_days() {
    let f = setup();
    f.pass.pay(&f.hospital, &(100 * ONE));
    f.pass.pay(&f.hospital, &(100 * ONE)); // $200 spent, vault now empty
    f.token_mint_for_test(100);
    // $200 + $101 > $300
    assert_eq!(f.pass.try_pay(&f.hospital, &(101 * ONE)), Err(Ok(Error::OverMonthlyLimit)));
    f.pass.pay(&f.hospital, &(100 * ONE)); // exactly reaches $300

    f.env.ledger().with_mut(|l| l.timestamp += WINDOW_SECS + 1);
    assert_eq!(f.pass.spent_in_window(), 0);
    f.token_mint_for_test(100);
    f.pass.pay(&f.hospital, &(100 * ONE));
    assert_eq!(f.pass.spent_in_window(), 100 * ONE);
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
    f.pass.set_rules(&(400 * ONE), &(100 * ONE), &((1 << HOSPITAL) | (1 << DENTAL)));
    assert_eq!(f.pass.try_pay(&f.hospital, &(120 * ONE)), Err(Ok(Error::OverPaymentCap)));
    f.pass.pay(&f.dental, &(80 * ONE)); // dental now allowed
    assert_eq!(f.pass.try_set_rules(&(50 * ONE), &(100 * ONE), &1), Err(Ok(Error::InvalidRules)));
    assert_eq!(f.pass.try_set_rules(&(300 * ONE), &(100 * ONE), &0), Err(Ok(Error::InvalidRules)));
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
    let pass_id = env.register(Pass, (&sponsor, &beneficiary, &sac.address(), &reg, 300 * ONE, 150 * ONE, 1u32));
    let pass = PassClient::new(&env, &pass_id);
    assert!(pass.try_set_frozen(&true).is_err());
    assert!(pass.try_set_rules(&(300 * ONE), &(100 * ONE), &1).is_err());
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
    // per-payment cap larger than the monthly limit
    env.register(Pass, (&a, &a, &sac.address(), &a, 100 * ONE, 150 * ONE, 1u32));
}

impl<'a> Fx<'a> {
    /// Top the vault up with `usdc` test dollars (anyone may do this — it is just a token transfer).
    fn token_mint_for_test(&self, usdc: i128) {
        StellarAssetClient::new(&self.env, &self.token.address).mint(&self.pass.address, &(usdc * ONE));
    }
}
