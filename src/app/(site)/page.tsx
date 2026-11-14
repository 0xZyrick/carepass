import {
  ArrowRight, BadgeCheck, Bell, Check, HandCoins, Landmark, Lock, ScanLine, ShieldCheck, ShieldX, SlidersHorizontal, Smartphone, Timer, Users, Zap,
} from "lucide-react";
import { Button, CatIcon } from "@/components/ui/ui";
import { PassCard } from "@/components/PassCard";
import { LandingDemo } from "@/components/LandingDemo";
import { PartnersSection } from "@/components/PartnersSection";
import { CATEGORIES, MERCHANTS } from "@/lib/data";

const FAQ = [
  ["What can I use today?", "The full product: accounts, family passes, spending rules, the guardrail, funding, clinic payments and a live activity feed. It currently runs on Stellar testnet with sandbox funding, so no real money moves. Going to mainnet and live funding is the next step, with the same product and the same rules."],
  ["Can my family spend the money on anything else?", "No. A CarePass balance only clears at hospitals, labs, pharmacies and other providers on the verified whitelist. Any other destination is rejected, and you see the attempt."],
  ["Who holds the money?", "Not us. CarePass is designed to be non-custodial: funds sit in a Stellar vault governed by a Soroban contract that you, the sponsor, control. We never pool family balances in an account we operate."],
  ["How does the clinic get paid in Naira?", "Your relative scans the clinic's QR code or taps their pass. The payment settles on Stellar in seconds, and a licensed payout partner converts it to Naira for the clinic."],
  ["What if my mom needs more money in an emergency?", "She taps Request on her pass and you get a notification. You can top up in under a minute, and the request clears automatically."],
  ["Can I control how much is spent?", "Yes. For each person you set a monthly limit, a per-payment cap and the types of care allowed. You can freeze a pass instantly."],
  ["What does it cost?", "Sponsors see one fee before they confirm, including any card or bank charge from the funding partner. Family members pay nothing to use their pass. Pricing is confirmed with each partner before launch."],
  ["Do you collect health records?", "No. CarePass sees the amount, the provider and the care category for each payment. It does not collect diagnoses, prescriptions or medical records."],
];

export default function Landing() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container-x grid grid-cols-1 items-center gap-10 pb-16 pt-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-6 lg:pb-24 lg:pt-14">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-2 pr-4 text-[13px] font-semibold text-ink-soft shadow-card">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-white"><Lock className="h-3 w-3" /></span>
              Healthcare payments across borders
            </span>
            <h1 className="mt-6 text-balance text-[44px] font-extrabold leading-[1.02] sm:text-6xl lg:text-[72px]">
              Send care,
              <br />
              <span className="relative inline-block text-brand-600">
                not cash.
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none" aria-hidden>
                  <path d="M3 8c60-6 140-8 294-2" stroke="#F5B83D" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-ink-soft">
              Millions of families pay for a parent's treatment by sending cash and hoping. CarePass replaces that transfer with a pass that only works at <strong className="font-semibold text-ink">verified hospitals, labs and pharmacies</strong>, within limits you set, with a receipt for every payment.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button href="/signin?mode=signup" size="lg" icon={undefined}>
                Start funding care <ArrowRight className="h-5 w-5" />
              </Button>
              <Button href="/pass" size="lg" variant="outline">See the family pass</Button>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2.5 text-sm font-semibold text-ink-soft">
              {["Non-custodial by design", "Settles on Stellar in seconds", "Built for Naira payouts"].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-600" strokeWidth={3} />{t}</li>
              ))}
            </ul>
          </div>

          {/* visual */}
          <div className="relative mx-auto w-full max-w-[520px] animate-fade-up [animation-delay:120ms]">
            <div className="relative overflow-hidden rounded-[36px] bg-brand-900 px-6 pb-10 pt-12 sm:px-10 sm:pb-14 sm:pt-16">
              <div className="grain absolute inset-0" />
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
              <div className="relative mx-auto max-w-[340px] -rotate-3 animate-float">
                <PassCard name="Adebola Okonkwo" balance={186.4} last4="8842" />
              </div>
              <div className="relative mx-auto mt-7 flex max-w-[340px] flex-col gap-3">
                <div className="flex items-center gap-3 rounded-2xl bg-white p-3 pr-4 shadow-pop">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><ShieldCheck className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold">Lagoon Hospital</div>
                    <div className="text-xs text-ink-mute">Verified · settled in seconds</div>
                  </div>
                  <span className="num text-sm font-bold">−$45.00</span>
                </div>
                <div className="ml-6 flex items-center gap-3 rounded-2xl bg-white p-3 pr-4 shadow-pop">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700"><ShieldX className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold">Personal wallet</div>
                    <div className="text-xs text-ink-mute">Blocked by guardrail</div>
                  </div>
                  <span className="num text-sm font-bold text-rose-700">$50.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section id="why" className="border-y border-line bg-white">
        <div className="container-x py-16 lg:py-24">
          <div className="max-w-2xl">
            <div className="eyebrow">The problem</div>
            <h2 className="mt-3 text-balance text-4xl font-extrabold sm:text-5xl">Families abroad fund care they can't see, can't limit and can't trust.</h2>
          </div>
          <div className="mt-10 grid grid-cols-1 divide-y divide-line rounded-3xl border border-line bg-canvas/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              ["≈ $20B", "sent to Nigeria in 2024", "Diaspora remittances are one of the country's largest sources of foreign currency."],
              ["≈ 75%", "of health spending is out of pocket", "When someone falls ill, the family pays first, often with money sent from abroad."],
              ["Blind", "trust is the only control", "A standard transfer can't be restricted to a hospital, so the sender can only hope it is used for care."],
            ].map(([n, l, d]) => (
              <div key={l} className="px-6 py-7">
                <div className="num text-5xl font-extrabold text-brand-700">{n}</div>
                <div className="mt-1 font-bold">{l}</div>
                <div className="mt-1 text-sm leading-relaxed text-ink-mute">{d}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-faint">
            Sources: Central Bank of Nigeria diaspora remittance data, reported by <a className="underline" href="https://nairametrics.com/2025/07/26/diaspora-remittances-to-nigeria-hit-20-93b-in-2024">Nairametrics</a> (2024 figures vary by source, roughly $19.8–20.9B); out-of-pocket share per a 2024 report summarised by <a className="underline" href="https://nairametrics.com/2024/09/03/out-of-pocket-expenses-dominate-nigerias-health-spending-at-75-report/">Nairametrics</a>.
          </p>
        </div>
      </section>

      {/* THREE INDUSTRIES */}
      <section id="product" className="container-x py-20 lg:py-28">
        <div className="max-w-2xl">
          <div className="eyebrow">One product, three layers</div>
          <h2 className="mt-3 text-balance text-4xl font-extrabold sm:text-5xl">Where healthtech, fintech and blockchain meet.</h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">Each layer does one job. Together they make a transfer that can only become care.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            { icon: BadgeCheck, tag: "Healthtech", t: "A verified care network", d: "Hospitals, labs and pharmacies are vetted and categorised. Sponsors choose which kinds of care a pass covers, so the money follows the need.", status: "Working today" },
            { icon: Landmark, tag: "Fintech", t: "Dollars in, Naira out", d: "Sponsors fund in USD or GBP with the fee shown up front. Licensed partners handle the conversion and the Naira payout to the clinic.", status: "Sandbox now · live funding next" },
            { icon: Lock, tag: "Blockchain", t: "Rules nobody can bend", d: "USDC settles on Stellar. A Soroban contract enforces the whitelist, limits and freeze, and holds funds non-custodially, so the rules can be audited and not just promised.", status: "Live on testnet · mainnet next" },
          ].map((c) => (
            <article key={c.tag} className="card p-7">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><c.icon className="h-6 w-6" /></span>
              <div className="eyebrow mt-6 !text-brand-700">{c.tag}</div>
              <h3 className="mt-1 text-xl font-bold">{c.t}</h3>
              <p className="mt-2 leading-relaxed text-ink-mute">{c.d}</p>
              <span className="mt-6 inline-block rounded-full bg-sun-50 px-3.5 py-1.5 text-xs font-bold text-sun-600">{c.status}</span>
            </article>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="container-x py-20 lg:py-28">
        <div className="max-w-2xl">
          <div className="eyebrow">How it works</div>
          <h2 className="mt-3 text-balance text-4xl font-extrabold sm:text-5xl">From your phone to their clinic in three steps.</h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            { n: "01", icon: Users, t: "Add your family member", d: "Create a pass for a parent, sibling or relative. Set a monthly limit, a per-payment cap and the kinds of care it covers.", chip: "Mom · Lagos" },
            { n: "02", icon: HandCoins, t: "Top up in dollars", d: "Fund with a card or bank transfer. You see the fee and the Naira value before you confirm.", chip: "$100 → ₦152,900" },
            { n: "03", icon: ScanLine, t: "They pay at the clinic", d: "They scan the clinic's QR code or tap their pass. The guardrail checks the provider and your limits, then the payment settles.", chip: "Verified ✓ · seconds" },
          ].map((s) => (
            <article key={s.n} className="card group relative overflow-hidden p-7 transition hover:-translate-y-1 hover:shadow-pop">
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-500 group-hover:text-white"><s.icon className="h-6 w-6" /></span>
                <span className="num text-4xl font-extrabold text-canvas-2">{s.n}</span>
              </div>
              <h3 className="mt-6 text-xl font-bold">{s.t}</h3>
              <p className="mt-2 leading-relaxed text-ink-mute">{s.d}</p>
              <span className="mt-6 inline-block rounded-full bg-canvas px-3.5 py-1.5 text-xs font-bold text-ink-soft">{s.chip}</span>
            </article>
          ))}
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className="bg-brand-950 text-white">
        <div className="container-x grid grid-cols-1 gap-12 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <div className="eyebrow !text-brand-300">Guardrails</div>
            <h2 className="mt-3 text-balance text-4xl font-extrabold sm:text-5xl">Rules enforced in code, not in a promise.</h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/65">
              Every payment is checked against the verified provider list and your limits before any money moves. A blocked payment never leaves the vault, and you can see the attempt.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                [BadgeCheck, "Verified merchants only", "Hospitals, labs and pharmacies are vetted, then added to an on-chain registry."],
                [SlidersHorizontal, "Your limits, per person", "A monthly limit, a per-payment cap and the care types allowed, set for each person."],
                [Lock, "Non-custodial by design", "No pooled account. The rules are public and enforced by the contract."],
              ].map(([I, t, d]) => {
                const Icon = I as typeof Lock;
                return (
                  <li key={t as string} className="flex gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/20 text-brand-300"><Icon className="h-5 w-5" /></span>
                    <div><div className="font-bold">{t as string}</div><div className="text-sm text-white/55">{d as string}</div></div>
                  </li>
                );
              })}
            </ul>
          </div>
          <LandingDemo />
        </div>
      </section>

      <div className="border-y border-line bg-white/60"><PartnersSection /></div>

      {/* AUDIENCES */}
      <section className="container-x py-20 lg:py-28">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-[32px] bg-brand-50 p-8 sm:p-10">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500 text-white"><Landmark className="h-6 w-6" /></span>
            <h3 className="mt-6 text-3xl font-extrabold">For sponsors abroad</h3>
            <p className="mt-2 text-ink-soft">Control and peace of mind from anywhere.</p>
            <ul className="mt-6 space-y-3.5">
              {["Fund in USD or GBP and see the Naira value up front", "See every payment and every blocked attempt", "Change limits or freeze a pass in one tap", "Answer top-up requests from family"].map((t) => (
                <li key={t} className="flex gap-3"><Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" strokeWidth={3} /><span className="font-medium">{t}</span></li>
              ))}
            </ul>
            <Button href="/sponsor" variant="dark" className="mt-8">Explore the sponsor app</Button>
          </div>
          <div className="rounded-[32px] bg-sun-50 p-8 sm:p-10">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-white"><Smartphone className="h-6 w-6" /></span>
            <h3 className="mt-6 text-3xl font-extrabold">For family at home</h3>
            <p className="mt-2 text-ink-soft">Simple enough for anyone to use, with no app to install.</p>
            <ul className="mt-6 space-y-3.5">
              {["One big button to pay: scan or tap", "Find verified clinics, labs and pharmacies nearby", "See the balance in dollars and Naira", "Ask for more funds with one tap"].map((t) => (
                <li key={t} className="flex gap-3"><Check className="mt-0.5 h-5 w-5 shrink-0 text-sun-600" strokeWidth={3} /><span className="font-medium">{t}</span></li>
              ))}
            </ul>
            <Button href="/pass" variant="dark" className="mt-8">Explore the family pass</Button>
          </div>
        </div>
      </section>

      {/* NETWORK */}
      <section id="network" className="border-y border-line bg-white py-20 lg:py-24">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <div className="eyebrow">Provider network</div>
              <h2 className="mt-3 text-balance text-4xl font-extrabold">Care providers on the verified list.</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <span key={c.id} className="rounded-full border border-line px-3.5 py-1.5 text-[13px] font-semibold text-ink-soft">{c.plural}</span>
              ))}
            </div>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MERCHANTS.slice(0, 6).map((m) => (
              <div key={m.id} className="flex items-center gap-4 rounded-2xl border border-line bg-canvas/50 p-4">
                <CatIcon type={m.type} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{m.name}</div>
                  <div className="truncate text-sm text-ink-mute">{m.area}, {m.city}</div>
                </div>
                <BadgeCheck className="h-5 w-5 shrink-0 text-brand-500" aria-label="Verified" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container-x grid grid-cols-1 gap-10 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:py-28">
        <div>
          <div className="eyebrow">FAQ</div>
          <h2 className="mt-3 text-4xl font-extrabold sm:text-5xl">Questions, answered.</h2>
          <p className="mt-4 text-ink-mute">Everything you'd want to know before sending your first dollar.</p>
        </div>
        <div className="divide-y divide-line rounded-3xl border border-line bg-white shadow-card">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
                {q}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-canvas text-lg transition group-open:rotate-45 group-open:bg-brand-500 group-open:text-white">+</span>
              </summary>
              <p className="mt-3 pr-10 leading-relaxed text-ink-mute">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-x pb-20 lg:pb-28">
        <div className="relative overflow-hidden rounded-[36px] bg-brand-500 px-8 py-14 text-center text-white sm:py-20">
          <div className="grain absolute inset-0" />
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-brand-900/30" />
          <div className="relative">
            <Timer className="mx-auto h-8 w-8 text-brand-100" />
            <h2 className="mx-auto mt-5 max-w-2xl text-balance text-4xl font-extrabold sm:text-5xl">Be there for them, even from far away.</h2>
            <p className="mx-auto mt-4 max-w-md text-brand-50">Create a pass, add funds, and know where every dollar goes.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/signin?mode=signup" size="lg" variant="light">Create your account <ArrowRight className="h-5 w-5" /></Button>
              <Button href="/guardrails" size="lg" className="!bg-brand-700 hover:!bg-brand-800" icon={<Zap className="h-5 w-5" />}>Try the guardrail lab</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
