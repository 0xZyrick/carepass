import { ArrowRight, BadgeCheck, CalendarCheck, Check, ClipboardList, Hospital, KeyRound, Lock, QrCode, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Button, Stamp } from "@/components/ui/ui";
import { PACKAGES, packageTotal } from "@/lib/care";
import { usd } from "@/lib/format";

const FAQ = [
  ["What is a care plan?", "A care plan turns “Mom needs care in Lagos” into clear steps: a doctor visit, tests, a review, medicines. You choose a package and a verified clinic for each step, and you can follow the progress from abroad."],
  ["When is the clinic paid?", "Only when the visit happens. Your relative shows a 6-digit visit code, the clinic enters it, and the payment for that step is released. No visit, no payment."],
  ["Can the money be spent on anything else?", "No. It only works at verified hospitals, labs, pharmacies and other care providers, and only for the kinds of care you allow. Anywhere else is refused, and you can see every attempt."],
  ["What can I see as a sponsor?", "Which steps are done, which is next, and a receipt for every payment. You never see diagnoses or medical records."],
  ["What if the plan needs more money?", "Your relative can ask for funds from their pass and you get a notification. If a step comes up short, the visit stays open and works again as soon as you top up."],
  ["How does the clinic get paid?", "In Naira, to its bank account, after each confirmed visit. Clinics don't need to handle crypto."],
  ["Do you collect health records?", "No. CarePass sees the care step, the provider and the amount. It does not collect diagnoses, prescriptions or medical records."],
];

const SAMPLE = PACKAGES[1];

export default function Landing() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container-x grid grid-cols-1 items-center gap-12 pb-16 pt-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:pb-24 lg:pt-14">
          <div className="animate-fade-up">
            <Stamp slant tone="ok"><BadgeCheck className="h-3.5 w-3.5" /> Verified providers only</Stamp>
            <h1 className="mt-6 text-balance font-display text-[44px] font-semibold leading-[1.03] sm:text-6xl lg:text-[68px]">Care for family <span className="text-brand-600">back home.</span></h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-ink-soft">
              Choose a care plan for a parent in Nigeria, pick a verified clinic, and follow every step from wherever you are. <strong className="font-semibold text-ink">Payment is released only when the clinic confirms the visit.</strong>
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button href="/signin?mode=signup" size="lg">Plan care <ArrowRight className="h-5 w-5" /></Button>
              <Button href="/try" size="lg" variant="outline">Try a payment</Button>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[460px] animate-fade-up [animation-delay:120ms]">
            <div className="receipt-wrap">
              <div className="receipt px-6 pb-10 pt-8">
                <div className="eyebrow">Care plan</div>
                <div className="mt-1 flex items-baseline justify-between gap-3"><h2 className="font-display text-2xl font-semibold">{SAMPLE.title}</h2><span className="text-sm text-ink-mute">2 of 4 done</span></div>
                <div className="mt-3 flex gap-1.5" aria-hidden>{SAMPLE.steps.map((s, i) => <span key={s.title} className={`h-1.5 flex-1 rounded-full ${i < 2 ? "bg-brand-500" : "bg-canvas-2"}`} />)}</div>
                <ol className="mt-5 space-y-3.5">
                  {SAMPLE.steps.map((s, i) => (
                    <li key={s.title} className="flex items-center gap-3">
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${i < 2 ? "bg-brand-500 text-white" : i === 2 ? "bg-ink text-white" : "bg-canvas-2 text-ink-faint"}`}>{i < 2 ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}</span>
                      <div className="min-w-0 flex-1"><div className={`truncate text-sm font-semibold ${i > 2 ? "text-ink-soft" : ""}`}>{s.title}</div><div className="text-xs text-ink-mute">{s.when}</div></div>
                      <span className="num text-sm font-semibold">{usd(s.priceCents / 100, 0)}</span>
                    </li>
                  ))}
                </ol>
                <div className="tear mt-6" />
                <div className="mt-4 flex items-center justify-between">
                  <div><div className="text-xs text-ink-mute">Next visit code</div><div className="font-mono text-xl font-bold tracking-[0.2em]">482 915</div></div>
                  <Stamp slant tone="ok">Confirmed by clinic</Stamp>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="border-y border-line bg-white/60 py-20 lg:py-28">
        <div className="container-x">
          <div className="eyebrow">How it works</div>
          <h2 className="mt-3 max-w-2xl text-balance font-display text-4xl font-semibold sm:text-5xl">From “they need care” to care done.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              [ClipboardList, "Choose a care plan", "Pick a package and a verified clinic, lab and pharmacy in their city. You see every step and its price before anything starts."],
              [KeyRound, "They follow the steps", "Your relative sees what is next and shows a 6-digit visit code at the clinic. You follow progress from abroad."],
              [CalendarCheck, "The clinic confirms, then is paid", "When the clinic enters the code, that step's payment is released and you both get a receipt you can verify."],
            ].map(([I, t, d], i) => { const Icon = I as typeof ClipboardList; return (
              <div key={t as string} className="receipt-wrap"><div className="receipt p-7 pb-9">
                <div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Icon className="h-6 w-6" /></span><span className="num font-display text-4xl font-semibold text-line-strong">{i + 1}</span></div>
                <h3 className="mt-5 font-display text-2xl font-semibold">{t as string}</h3>
                <p className="mt-2 leading-relaxed text-ink-mute">{d as string}</p>
              </div></div>
            ); })}
          </div>
        </div>
      </section>

      {/* PACKAGES */}
      <section id="packages" className="container-x py-20 lg:py-28">
        <div className="eyebrow">Care plans</div>
        <h2 className="mt-3 max-w-2xl text-balance font-display text-4xl font-semibold sm:text-5xl">Start with the care they need.</h2>
        <p className="mt-4 max-w-xl text-ink-mute">Each plan is a short list of steps with a clear price. Prices shown are estimates until clinics set their own.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((p) => (
            <article key={p.id} className="card flex flex-col p-6">
              <h3 className="text-lg font-bold">{p.title}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-mute">{p.blurb}</p>
              <div className="mt-4 border-t border-line pt-3 text-sm text-ink-soft">{p.steps.length} steps · about <b>{usd(packageTotal(p) / 100, 0)}</b></div>
            </article>
          ))}
        </div>
      </section>

      {/* SAFE */}
      <section id="safe" className="border-y border-line bg-white/60 py-20 lg:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
          <div>
            <div className="eyebrow">Why you can trust it</div>
            <h2 className="mt-3 text-balance font-display text-4xl font-semibold sm:text-5xl">Care you can see happen.</h2>
            <p className="mt-5 max-w-md leading-relaxed text-ink-mute">Money moves for a step only after the clinic confirms it, and the rules are checked before any of it leaves. Not by trust, by design.</p>
            <p className="mt-6 text-sm"><a href="/about" className="font-bold text-brand-700 hover:underline">See how it's built →</a></p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              [CalendarCheck, "Paid on confirmation", "A clinic is paid for a step only when it confirms the visit with your relative's code."],
              [ShieldCheck, "Verified providers only", "Every clinic, lab and pharmacy is checked before it can receive a payment."],
              [SlidersHorizontal, "Rules you control", "Choose the kinds of care allowed and pause a pass any time. Each care plan fixes who gets paid and how much."],
              [Check, "Receipts you can verify", "Each payment's receipt is fingerprinted on a public network, so it can't be quietly changed."],
            ].map(([I, t, d]) => { const Icon = I as typeof Lock; return (
              <li key={t as string} className="card p-6"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-white"><Icon className="h-5 w-5" /></span><h3 className="mt-4 text-lg font-bold">{t as string}</h3><p className="mt-1.5 text-sm leading-relaxed text-ink-mute">{d as string}</p></li>
            ); })}
          </ul>
        </div>
      </section>

      {/* CLINICS */}
      <section id="clinics" className="bg-brand-950 py-20 text-white lg:py-28">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="eyebrow !text-brand-200">For clinics</div>
            <h2 className="mt-3 text-balance font-display text-4xl font-semibold sm:text-5xl">Planned patients, paid on time.</h2>
            <p className="mt-5 max-w-md leading-relaxed text-white/70">Register your clinic, see the visits families have planned with you, and confirm each one with a code. You're paid in Naira, with no crypto to handle.</p>
            <div className="mt-8"><Button href="/signin?mode=signup" size="lg" variant="light">Register your clinic <ArrowRight className="h-5 w-5" /></Button></div>
          </div>
          <ul className="grid gap-3">
            {[[CalendarCheck, "See planned visits before patients arrive"], [QrCode, "A QR code for walk-in payments too"], [Hospital, "Hospitals, labs, pharmacies, dental and eye care"], [BadgeCheck, "Paid in Naira to your bank account"]].map(([I, t]) => { const Icon = I as typeof QrCode; return (
              <li key={t as string} className="flex items-center gap-4 rounded-2xl bg-white/[0.07] p-5 ring-1 ring-white/10"><Icon className="h-6 w-6 shrink-0 text-brand-300" /><span className="font-semibold">{t as string}</span></li>
            ); })}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container-x py-20 lg:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="eyebrow">Questions</div>
          <h2 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Good to know</h2>
          <div className="mt-10 divide-y divide-line border-y border-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">{q}<span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-canvas-2 text-xl transition group-open:rotate-45">+</span></summary>
                <p className="mt-3 max-w-2xl leading-relaxed text-ink-mute">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x pb-20 lg:pb-28">
        <div className="rounded-[36px] bg-brand-600 px-6 py-14 text-center text-white sm:px-12">
          <h2 className="mx-auto max-w-2xl text-balance font-display text-4xl font-semibold sm:text-5xl">Be there for their care, from anywhere.</h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/signin?mode=signup" size="lg" variant="light">Plan care <ArrowRight className="h-5 w-5" /></Button>
            <Button href="/try" size="lg" className="!bg-brand-700 hover:!bg-brand-800">Try a payment</Button>
          </div>
        </div>
      </section>
    </>
  );
}
