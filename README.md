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
