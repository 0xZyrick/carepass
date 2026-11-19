# CarePass — redesigned

Next.js 15 · React 19 · Tailwind 3 · lucide-react. Run: `npm install && npm run dev` → http://localhost:3000

## Screens & flows
| Route | What it is |
|---|---|
| `/` | Landing page (hero, how it works, guardrails demo, audiences, network, FAQ, CTA) |
| `/signin`, `/signin?mode=signup` | Role choice + OTP verification (demo: any 6 digits) |
| `/sponsor` | Dashboard: balance, family passes, top-up requests, spending chart, activity |
| `/sponsor/fund` | 4-step funding flow with live fee / FX summary and success state |
| `/sponsor/family`, `/[id]`, `/new` | Passes list, per-person rules + freeze, add-member flow |
| `/sponsor/activity`, `/settings` | Searchable/filterable ledger with receipts; settings |
| `/pass`, `/pass/pay`, `/clinics`, `/activity` | Family mobile app: pass card, scan→amount→PIN→guardrail result, verified clinics, history |
| `/guardrails` | Guardrail lab: step-by-step rule engine + on-chain whitelist |

State is shared in memory (`src/lib/store.tsx`): a top-up, a clinic payment, a blocked attempt or a funding
request made on one side shows up on the other. All data is demo data (`src/lib/data.ts`).
The payment rules live in `src/lib/guardrail.ts` — swap for your real contract/API there.

Changes beyond the UI: Next.js upgraded 15.1.3 → 15.5.29 (security advisory); fonts now bundled via
@fontsource (no Google Fonts fetch at build time).

## Stellar direction (v2 notes)
- Corridor: US/UK → Nigeria. Network: Stellar (USDC). Guardrail: Soroban contract (to be built — `src/lib/guardrail.ts` is the front-end model of its rules).
- Payout partner: Yellow Card (confirmed). Funding partner: Banxa (planned; BlindPay as US fallback) — see `src/lib/partners.ts`;
  set `status: "live"` once signed and the landing page tag disappears.
- Demo addresses are Stellar-format (`G…`) but are NOT real accounts.

## Testnet mode (v3)
- `contracts/` holds the Soroban contracts (registry + pass vault) with 17 unit tests — see `contracts/README.md`.
- Run `contracts/scripts/deploy-testnet.sh` to deploy to Stellar testnet; it writes `public/testnet.json`, and `/guardrails` then shows a live panel that runs the checks on the deployed contract and can settle a real testnet payment. Without that file the whole app runs in simulated mode.
- Funding is a sandbox step; MoonPay/Ramp test mode will plug in here once API keys exist (needs keys from their dashboards).
- Partners on the landing page are all "planned" except Stellar and Soroban; edit `src/lib/partners.ts`.

## Backend (v4): Neon + Better Auth

The app now has a real backend. Nothing important lives in the browser any more.

| Layer | What | Where |
|---|---|---|
| Database | Postgres via **Neon** (Drizzle ORM). Money is stored as integer cents. | `src/server/db/` · migrations in `drizzle/` |
| Auth | **Better Auth** with email one-time codes, sessions in the database, role (`sponsor` / `family`) | `src/server/auth.ts` · `/api/auth/*` |
| Rules | The guardrail runs **on the server** for every payment; blocked attempts are logged | `src/app/api/passes/[id]/pay` · `src/lib/guardrail.ts` |
| Access control | Server layouts guard `/sponsor` and `/pass`; every API route checks who owns the pass | `src/server/http.ts`, `src/server/passes.ts` |

### Run it

```bash
cp .env.example .env.local      # fill in DATABASE_URL + BETTER_AUTH_SECRET (see comments)
npm install
npm run db:migrate              # creates the tables in Neon
npm run dev
```

With no `DATABASE_URL` the app still runs on an **in-memory** database (resets on restart), which is handy for a quick look.

### Demo mode

With no `RESEND_API_KEY`, sign-in codes are shown on screen (for any email) so reviewers can try both sides of the app. A sponsor can also load a sample family and preview the family screens for passes they own. **This means email addresses are not verified.** Before real users: add a Resend key (on-screen codes switch off automatically) and set `DEMO_MODE=off`.

### Honest status

- Balances and payments are a **database ledger**. They are not yet backed by USDC on Stellar. That is the next step: the Soroban contracts in `contracts/` become the source of truth, and this ledger mirrors them.
- Funding is sandbox-only until the MoonPay test keys are connected.
- The monthly-limit check reads then writes, so two payments at the same instant could both pass it (the balance check is atomic and cannot overdraft). The on-chain vault enforces the window atomically.
- The Neon path was not run in the build environment (no network to Neon). The same queries run against an embedded Postgres (PGlite) in the tests; run `npm run db:migrate` against your Neon URL and sign in once to confirm.

## Funding with MoonPay (sandbox)

Sponsors fund a pass through a signed MoonPay checkout. The server builds and signs the URL (`src/server/moonpay.ts`), the sponsor pays in MoonPay's window, and the pass is credited **once** when MoonPay confirms, either by webhook (`/api/webhooks/moonpay`, signature verified) or by the Fund screen checking `/api/funding/[id]/sync`.

1. Put the three MoonPay keys in `.env.local` (see `.env.example`).
2. Deploy, then register `https://<your-domain>/api/webhooks/moonpay` in the MoonPay dashboard. Locally the Fund screen checks status every few seconds, so the webhook isn't needed to try it.
3. Test cards: US `4000 0200 0000 0000`, UK `4242 4242 4242 4242`, any future expiry and CVV.
4. MoonPay's minimum purchase is $20.

In the sandbox MoonPay delivers a small amount of Stellar testnet XLM to the sponsor's testnet wallet; the pass is credited with the USD amount. Switching to production means swapping the keys and registering the production webhook.

## v7: clinic app, real PIN, plain-language UI

- **Three roles:** sponsor, family, clinic. Choose one at first sign-in.
- **Clinic app (`/clinic`):** set up the clinic, get a QR code (`carepass:clinic:CL-XXXXXX`), see payments received.
- **Paying:** scan the QR (Chromium browsers) or type the clinic code. Payments need a 4-digit PIN (created on first payment, locked 10 minutes after 5 wrong tries).
- **Public pages:** `/about` (how it's built), `/try`, `/terms`, `/privacy`. Set your real contact address in `src/lib/site.ts` and have a lawyer review the legal pages.
- **MoonPay checkout check:** while signed in as a sponsor, open `/api/funding/check`. It reports whether the keys load and have the right shape without printing them. Keys go in `.env.local` with no quotes or spaces, and the publishable and secret key must come from the same sandbox account. `FUNDING_MODE=sandbox` bypasses MoonPay for demos.

## v8: payments run through the contracts

With the CHAIN_* variables set, the app works like this:
- Each family pass gets its own vault contract the first time it is created or funded.
- Each clinic is registered as a verified provider (and set up to receive USDC) when it is created.
- Funding a pass deposits the amount into its vault. Paying a registered clinic goes through the pass's contract, and the receipt link appears on the payment.
- Changing a pass's rules or pausing it updates the contract too.
- Without the CHAIN_* variables the app keeps its own books and everything else works the same.

Setup, from the project root, after `deploy-testnet.sh`:
1. `contracts/scripts/chain-env.sh` prints the five variables. Paste them into `.env.local`.
2. `npm run chain:test` creates a throwaway vault and clinic and checks one allowed and three refused payments.
3. `npm run db:migrate` if you use Neon (adds the chain columns).

Notes: the first payment after a pass or clinic is created can take 10 to 20 seconds while setup finishes. The server holds each pass's signing key (sealed with BETTER_AUTH_SECRET); the sponsor can still change rules, pause, or withdraw through the contract. Delete the old `public/testnet.json`; the app no longer uses it.

## MoonPay troubleshooting
`npm run moonpay:check` (run on your own computer) tests both keys against MoonPay, checks the currency code, and prints two links: a plain one and a signed one. If the plain link fails, the key or currency code is wrong. If only the signed link fails, the secret key doesn't belong with the publishable key.
While signed in as a sponsor you can also open `/api/funding/check` in the browser. It shows the same key checks plus the two links (`plainLink`, `signedLink`) to try, with no command line needed.

## v9: Stellar anchor funding and real USDC

Sponsors can fund a pass with **Stellar USDC**: the server signs in to the anchor (SEP-10), opens a hosted deposit (SEP-24) on `CHAIN_ANCHOR_DOMAIN` (default `testanchor.stellar.org`), and credits the pass with the amount that actually arrives, then moves it into the family vault. MoonPay stays as a second option, and the instant test top-up remains when no provider is configured.

- Real USDC: set `CHAIN_USDC_ISSUER` (confirm it against the anchor's stellar.toml) and omit `CHAIN_ISSUER_SECRET`. Run `REAL_USDC=1 contracts/scripts/chain-env.sh`.
- Run `npm run db:migrate` to apply migrations 0003 and 0004, and delete the old `public/testnet.json`.
- Not yet tested live against the network from the build sandbox: run `npm run chain:test` first.
- `ANCHOR_FUNDING=off` hides the option.

## v11: clinic cash-out

A verified clinic sees "Ready to cash out" (the USDC its account holds) and a Cash out button. The server signs in to the anchor as the clinic (SEP-10), opens a SEP-24 withdraw window, and once the clinic has chosen an amount it sends exactly that USDC to the anchor's account with the anchor's memo, once. Status and history show on the clinic dashboard. Needs the same `CHAIN_ANCHOR_DOMAIN` as funding, and `npm run db:migrate` for migration 0005. On mainnet, point `CHAIN_ANCHOR_DOMAIN` at a licensed Naira anchor.

## v12: receipts you can verify, and Naira settlement

**Receipt hash.** Every payment to a clinic gets a receipt (clinic, amount, care type, note, time, reference). Its sha256 is attached to the Stellar payment as a hash memo, and the receipt is stored. `/verify/<payment id>` is a public page that checks the stored receipt against its hash and against the memo on the network (Horizon), so neither the family nor the clinic can change the record later. The page names no patient. Itemised bill lines can be added to the receipt fields in `src/server/receipt.ts` (changing the field order changes every hash, so version it).

**Naira settlement.** After a payment, `src/server/settlement.ts` sends the clinic's USDC to the settlement account (the admin account) and pays the locked Naira amount to the clinic's bank account. `SETTLEMENT_MODE=mock` simulates the bank transfer; `paystack` uses the Paystack Transfer API (test keys, with transfer OTP turned off in the dashboard). Clinics now enter their full account number, stored encrypted and shown as the last 4 digits. Failed payouts show a Retry button on the clinic dashboard. Run `npm run db:migrate` for migrations 0005 and 0006.

## v13/v14: care plans (the care episode)

A family or sponsor picks a **care package** (`src/lib/care.ts`: antenatal care, health check-up) and a verified provider in the family's city for each kind of care. Each step has a price, a provider and a status. The family shows a 6-digit **visit code** for the next step (derived from the step, nothing stored); the clinic enters it under "Confirm a visit", which marks the milestone done and releases that step's payment from the pass through the same rules and contract as any payment (caps, care types, balance), with a receipt. If the pass lacks funds the visit stays open and the same code works after a top-up. A clinic is locked out for 10 minutes after 5 wrong codes.

Privacy by design: no documents, no diagnoses, no free-text health notes. Sponsors see milestones only; clinics see a patient's first name and initial; the public receipt page hides notes. Package names still imply a kind of care, so treat plans as personal data. Run `npm run db:migrate` for migration 0007. Package prices are estimates until providers set their own.

v14 rewrites the landing page and About around care plans and adds two packages (ongoing care, dental).

## v15: care-plan escrow on the vault contract

The pass vault contract now holds the money for a care plan until each step is confirmed (see `contracts/README.md`). The app opens the plan on the vault when it is created (the pass needs enough money up front), releases each step when the clinic enters the family's visit code (the clinic's and the patient's keys both sign), and unlocks the rest if the plan is cancelled. The pass shows only spendable money; locked money is shown on the care plan. Vaults deployed before the upgrade fall back to the earlier behavior. Turn escrow off with `CHAIN_ESCROW=off`. Run `npm run db:migrate` (migration 0008), rebuild and upload the contract (`contracts/scripts/chain-env.sh`), set the new `CHAIN_PASS_WASM_HASH`, then `npm run chain:test`.

Both signing keys are still held by the server, so today the contract enforces the structure (locked money, order, fixed amounts and providers, two required signatures) but the server decides when to sign. Moving the patient's key to a passkey on their phone is what makes that second signature independent.

## v16: the care plan is the limit

The per-payment cap and the monthly limit are gone. A sponsor funds a whole care package; each step has a fixed provider and amount, locked in the vault when the plan starts and released only when the clinic confirms the visit. What remains: allowed care types, verified providers only, the pause switch, and enough unlocked balance.

- Contract: constructor is now `(sponsor, beneficiary, token, registry, allowed_mask)`; `set_rules(allowed_mask)`. **Existing vaults must be redeployed** (rerun `contracts/scripts/chain-env.sh`, set the new `CHAIN_PASS_WASM_HASH`, create new passes).
- Database: migration `0009_retire_caps` (the old columns stay with default 0). Run `npm run db:migrate`.
- Tests: `npm run test:contract` (20 Rust tests), `npm run test:app` (API, care plans, settlement, cash-out), `npm run chain:test` (live testnet, needs the CHAIN_* env).
