# CarePass redesign notes

No new dependencies: same Next.js, Tailwind 3, lucide-react and fonts as before. Run `npm install && npm run dev`.

## Design system
- Tokens in `tailwind.config.ts` (brand emerald, warm canvas, ink scale, sun/rose/iris). Primary buttons use brand-600 so white text passes AA.
- Primitives: `components/ui/ui.tsx` (Button, Badge, Avatar, Sheet, Toast, Progress, ...) and `components/ui/forms.tsx` (Field, Segmented, Chip, ChoiceCard, Stepper, CodeInput, CheckRow).

## What changed
- Landing: new hero with product mockup, pay-for-proof payout schedule, role views, comparison table, FAQ, CTA.
- Sign in: split layout, role cards, validation, 6-box OTP with paste and resend timer.
- Sponsor: sidebar on desktop, bottom nav on mobile; overview with funds summary, attention items, activity feed.
- New: care detail page (`/sponsor/care/[id]`) with per-step payouts and payment history.
- New: 4-step Start care wizard (`/sponsor/care/new`) and 3-step Fund wizard with fee, FX and release schedule, receipt.
- Family pass: phone-first, visit-code ticket, document upload, checklist; new Help tab.
- Provider desk: facility switcher, stats, needs-action queue, confirm sheet with 4-digit code input.
- Data: activity events, funding history, per-step payout helpers; seed data uses relative dates.
