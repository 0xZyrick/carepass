import { ArrowRight, BadgeCheck, Check, HandCoins, Hospital, Lock, QrCode, ScanLine, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";
import { Button, Stamp } from "@/components/ui/ui";
import { PassCard } from "@/components/PassCard";

const FAQ = [
  ["Can my family spend the money on anything else?", "No. The money on a CarePass only works at verified hospitals, labs, pharmacies and other care providers. Anywhere else is refused, and you can see every attempt."],
  ["How does the clinic get paid?", "Your relative scans the clinic's QR code, enters their PIN and the payment goes through. The clinic is paid in Naira to its bank account."],
  ["What if my mom needs more money in an emergency?", "She taps “Ask for funds” on her pass and you get a notification. You can send more in under a minute."],
  ["Can I control how much is spent?", "Yes. For each person you set a monthly limit, a limit per payment and the kinds of care allowed. You can pause a pass at any time."],
  ["Who holds the money?", "You stay in control of it. CarePass doesn't pool family balances in an account we run. Each person's money is kept separately and can only move to verified providers."],
  ["What does it cost?", "You see one clear fee before you confirm. Your family pays nothing to use their pass."],
  ["Do you collect health records?", "No. CarePass sees the amount, the provider and the type of care for each payment. It does not collect diagnoses, prescriptions or medical records."],
];

export default function Landing() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container-x grid grid-cols-1 items-center gap-12 pb-16 pt-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:pb-24 lg:pt-14">
          <div className="animate-fade-up">
            <Stamp tone="ok"><BadgeCheck className="h-3.5 w-3.5" /> Verified providers only</Stamp>
            <h1 className="mt-6 text-balance font-display text-[46px] font-semibold leading-[1.02] sm:text-6xl lg:text-[72px]">Send care,<br /><span className="text-brand-600">not cash.</span></h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-ink-soft">
              Pay for a parent's treatment in Nigeria without wondering where the money went. CarePass gives your family a pass that only works at <strong className="font-semibold text-ink">verified hospitals, labs and pharmacies</strong>, within limits you set, with a receipt for every payment.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button href="/signin?mode=signup" size="lg">Get started <ArrowRight className="h-5 w-5" /></Button>
              <Button href="/try" size="lg" variant="outline">Try a payment</Button>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[460px] animate-fade-up [animation-delay:120ms]">
            <div className="receipt-wrap">
              <div className="receipt px-6 pb-10 pt-8">
                <div className="mx-auto max-w-[320px] -rotate-2"><PassCard name="Adebola Okonkwo" balance={186.4} last4="8842" /></div>
                <div className="tear mt-8" />
                <div className="mt-5 flex items-center justify-between">
                  <div><div className="text-sm font-bold">Lagoon Hospital</div><div className="text-xs text-ink-mute">Consultation · paid</div></div>
                  <div className="text-right"><div className="num text-lg font-bold">$45.00</div><div className="num text-xs text-ink-mute">₦68,805</div></div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-dashed border-line-strong pt-4">
                  <div><div className="text-sm font-bold">Personal account</div><div className="text-xs text-ink-mute">Not a care provider</div></div>
                  <Stamp tone="no">Not allowed</Stamp>
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
          <h2 className="mt-3 max-w-2xl text-balance font-display text-4xl font-semibold sm:text-5xl">Three steps from your phone to their care.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              [Users, "Add your family", "Add the person you support and set the rules: a monthly limit, a limit per payment and the kinds of care allowed."],
              [HandCoins, "Send money for care", "Pay by card or bank from the US or UK. You see the fee and the Naira amount before you confirm."],
              [ScanLine, "They pay at the clinic", "Your family scans the clinic's QR code and enters their PIN. The clinic is paid, and you both get the receipt."],
            ].map(([I, t, d], i) => { const Icon = I as typeof Users; return (
              <div key={t as string} className="receipt-wrap"><div className="receipt p-7 pb-9">
                <div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Icon className="h-6 w-6" /></span><span className="num font-display text-4xl font-semibold text-line-strong">{i + 1}</span></div>
                <h3 className="mt-5 font-display text-2xl font-semibold">{t as string}</h3>
                <p className="mt-2 leading-relaxed text-ink-mute">{d as string}</p>
              </div></div>
            ); })}
          </div>
        </div>
      </section>

      {/* SAFE */}
      <section id="safe" className="container-x py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
          <div>
            <div className="eyebrow">Why it's safe</div>
            <h2 className="mt-3 text-balance font-display text-4xl font-semibold sm:text-5xl">The money can only go to care.</h2>
            <p className="mt-5 max-w-md leading-relaxed text-ink-mute">The rules are checked on every payment, before any money moves. Not by trust, by design.</p>
            <p className="mt-6 text-sm"><a href="/about" className="font-bold text-brand-700 hover:underline">See how it's built →</a></p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              [ShieldCheck, "Verified providers only", "Every clinic, lab and pharmacy is checked before it can receive a payment."],
              [SlidersHorizontal, "Limits you control", "Set what each person can spend per month and per payment. Change it any time."],
              [Lock, "A PIN on every payment", "Your family confirms each payment with their own PIN."],
              [Check, "A receipt every time", "You see each payment, and each attempt that was stopped, as it happens."],
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
            <h2 className="mt-3 text-balance font-display text-4xl font-semibold sm:text-5xl">Get paid for care, simply.</h2>
            <p className="mt-5 max-w-md leading-relaxed text-white/70">Set up your clinic in two minutes and get a QR code for your desk. Families scan it to pay, and you see every payment as it comes in.</p>
            <div className="mt-8"><Button href="/signin?mode=signup" size="lg" variant="light">Register your clinic <ArrowRight className="h-5 w-5" /></Button></div>
          </div>
          <ul className="grid gap-3">
            {[[QrCode, "One QR code for your desk"], [Hospital, "Hospitals, labs, pharmacies, dental and eye care"], [BadgeCheck, "Paid in Naira to your bank account"]].map(([I, t]) => { const Icon = I as typeof QrCode; return (
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
          <h2 className="mx-auto max-w-2xl text-balance font-display text-4xl font-semibold sm:text-5xl">Be sure your help reaches the care.</h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/signin?mode=signup" size="lg" variant="light">Get started <ArrowRight className="h-5 w-5" /></Button>
            <Button href="/try" size="lg" className="!bg-brand-700 hover:!bg-brand-800">Try a payment</Button>
          </div>
        </div>
      </section>
    </>
  );
}
