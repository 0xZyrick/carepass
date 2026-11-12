# CarePass

**Care for family back home, from the right package to a confirmed visit.**

Diaspora families already send money home for medical care. The money is not the problem; the path around it is: which care, which provider, what happens next, and did it happen. CarePass turns "we need care for Mom in Lagos" into a completed care episode, and releases money only as each step is confirmed by the provider.

> Status: front-end prototype on simulated data. The Stellar layer (testnet USDC + Soroban escrow) is the build-week goal. See [ARCHITECTURE.md](ARCHITECTURE.md).

## How it works

1. **Package.** The sponsor picks a defined care package (maternity pathway, diagnostic workup, elective surgery, chronic follow-up) with clear inclusions, exclusions, steps, timeline and price band.
2. **Provider.** The sponsor chooses a vetted provider in the relative's city.
3. **Intake.** The family sends ID or a referral letter to the provider. Only the provider sees these.
4. **Visits.** At each visit the family shows a 4-digit code. The provider enters it and confirms the step. Confirmation is the proof and the payment trigger.
5. **Funds.** Money is held against the package and released per confirmed step.

The sponsor sees milestones only, never diagnoses.

## Run it

```bash
npm install
npm run dev
```

| Route | Who | What |
|---|---|---|
| `/` | Anyone | Landing page |
| `/packages` | Anyone | Package explorer: steps, inclusions, providers by city |
| `/sponsor` | Sponsor | Overview: care in progress, money held and released |
| `/sponsor/care` | Sponsor | Start a package, follow episodes |
| `/sponsor/fund` | Sponsor | Fund a care episode |
| `/pass` | Family | Next step, visit code, intake documents |
| `/provider` | Provider | Enter visit codes, confirm steps |

### 3-minute demo

1. Open `/sponsor/care`, start a **Diagnostic workup** for Adebola (Lagos) at a vetted provider.
2. Open `/sponsor/fund`, fund it.
3. Open `/pass`, add an intake document.
4. Open `/provider`, confirm intake.
5. Back on `/pass`, copy the visit code. On `/provider`, enter it and confirm. Watch the sponsor timeline and the released amount update.

## Repo layout

```
src/app/         Next.js routes (site, sponsor, pass, provider)
src/lib/care.ts  Packages, episode model, visit codes
src/lib/store.tsx  Client state (all simulated)
contracts/care-escrow/  Soroban escrow sketch (not yet compiled or audited)
```

## Limits

- All data and files live in the browser session. No backend, accounts or storage yet.
- Visit codes are derived client-side and are not secure. Production codes must be server-generated, one-time and expiring.
- Provider "login" is a demo switcher.
- No real money moves. Production would use a licensed payments partner.
