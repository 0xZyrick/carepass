# CarePass architecture

## Roles

| Role | Does | Sees |
|---|---|---|
| Sponsor (diaspora) | Chooses package and provider, funds it | Milestones, confirmations, receipts. Never diagnoses or intake documents |
| Family (patient) | Sends intake documents, shows visit codes | Next step, provider, what to bring |
| Provider | Confirms steps with the visit code | Own patients' packages and intake documents |

## Episode state machine

```
Package selected -> Intake (docs sent, provider confirms) -> Visit 1 ... Visit N -> Package closed
                         each arrow = one provider confirmation = one payout
```

Each package defines its steps. Step 0 is "Package selected"; step 1 is always intake; later steps are visits.

## Data model (today, `src/lib/care.ts`)

- `CarePackage`: id, name, steps[], inclusions, exclusions, price band, providerIds[]
- `CareEpisode`: beneficiary, package, provider, `done` (confirmed steps), `funded`, `confirms{step: {by, at, receipt?}}`, `docs[]`
- `released(e)` = funded x confirmed visit steps / total payable steps

## Money flow on Stellar (build-week target)

```
Sponsor wallet --USDC--> CareEscrow (Soroban) --per-step payout--> Provider account
                               |                        ^
                               | cancel -> refund       | release_step(id) signed by confirmer
                               v                        |
                         Sponsor (unreleased)    Backend verifies visit code
```

1. **create**: sponsor deposits the full package amount; payouts per step are fixed at creation.
2. **release_step**: the confirmer key releases the next step's payout to the provider. The backend only signs after the provider enters the correct visit code.
3. **cancel**: sponsor reclaims the unreleased balance.

Testnet only. USDC is the Stellar asset contract on testnet.

## Trust model

- The confirmer (platform backend key) is the trusted party for "the visit happened". The provider entering the family's code is the evidence.
- **v2:** commit-reveal codes. The contract stores a hash per step at creation, and the provider calls release with the code. The contract verifies the hash, so no platform key is needed to release.
- Funds can only move to the provider or back to the sponsor. The contract never pays anyone else.

## Privacy boundaries

- Sponsor view: milestones and confirmations only.
- Intake documents are visible to the provider only, in access-controlled storage in production.
- Receipts are optional, provider-attached, and must contain no clinical results.
- On-chain data: amounts, accounts and step counts only. No names, packages or clinical detail.

## Integration plan

| Layer | Prototype | Build week |
|---|---|---|
| State | Browser store | Neon Postgres + API routes |
| Codes | Derived client-side | Server-generated, one-time, expiring |
| Money | Simulated | Testnet USDC + Soroban escrow |
| Wallet | None | Freighter (or passkey wallet) for sponsor signing |
| Release | Local state | `/api/confirm` verifies code, signs `release_step` |

### Build-week plan

1. Day 1-2: deploy escrow to testnet, fund and release with the CLI. Unit tests for create, release, cancel.
2. Day 3: wallet connect and fund flow in the sponsor app.
3. Day 4: `/api/confirm` ties the visit code to `release_step`.
4. Day 5: polish, 3-minute demo script, pitch.

## Risks

- **Custody and regulation:** holding customer funds is licensed activity. The demo is testnet only, and production needs a regulated partner.
- **Key management:** the confirmer key is a single point of failure until commit-reveal ships.
- **NGN on/off-ramp:** out of scope for the buildathon; would go through a Stellar anchor.
- **Provider adoption:** the contract is easy, but getting providers to confirm steps is the real work.
