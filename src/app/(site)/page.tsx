import {
  ArrowRight, BadgeCheck, Check, ChevronDown, ClipboardList, Eye, EyeOff, FileCheck, KeyRound, Lock, Minus, Smartphone, Stethoscope, Wallet, X,
} from "lucide-react";
import clsx from "clsx";
import { Badge, Button, PkgIcon } from "@/components/ui/ui";
import { PhoneMock } from "@/components/PhoneMock";
import { PACKAGES } from "@/lib/care";
import { MERCHANTS } from "@/lib/data";
import { usd } from "@/lib/format";

const FAQ = [
  ["Do you provide the care?", "No. Care is delivered by existing hospitals, clinics and labs in Lagos and Abuja. We package it, vet the providers and keep everyone clear on the next step."],
  ["What can I see as a sponsor?", "Progress only: package selected, intake done, appointments completed, package closed. Diagnoses and clinical notes stay with your family and their provider."],
  ["Where does money come in?", "Optionally. You fund a package and the money is released to the provider as each milestone is confirmed, so you only pay for care that is proven to have happened."],
  ["How does a provider confirm a visit?", "Your family member shows a 4-digit code at the visit. The provider enters it, and that confirmation is both the proof and the payment trigger."],
  ["What if my family needs something that is not in a package?", "Start with the closest package. Exclusions are listed up front so nobody is surprised, and you can start another package at any time."],
  ["Is this live?", "This is a working prototype on demo data. No real money moves and no real patient information is stored. Production will use a licensed payments partner."],
];

const HOW = [
  { icon: ClipboardList, t: "Choose a package", d: "Pick the care that fits: maternity, diagnostics, surgery or chronic follow-up. Inclusions and exclusions are clear up front." },
  { icon: Stethoscope, t: "Pick a vetted provider", d: "Choose from verified hospitals and labs in your family member’s city, with hours and distance." },
  { icon: Smartphone, t: "Family follows the steps", d: "They see the next step, what to bring and where to go. Documents go to the provider only." },
  { icon: KeyRound, t: "Provider confirms with a code", d: "At each visit the provider enters the patient’s code. Confirmed steps release payment, nothing sooner." },
];

const SCHEDULE = [
  { s: "Intake and documents", st: "done" },
  { s: "Consultation", st: "done" },
  { s: "Labs and imaging", st: "now" },
  { s: "Results review", st: "next" },
  { s: "Package closed", st: "next" },
] as const;

const COMPARE: { row: string; cols: ("yes" | "part" | "no")[] }[] = [
  { row: "Covers in-person care end to end", cols: ["yes", "no", "no", "part"] },
  { row: "Proof that each visit happened", cols: ["yes", "no", "no", "part"] },
  { row: "Pay only as steps are confirmed", cols: ["yes", "no", "no", "no"] },
  { row: "One shared view for you and family", cols: ["yes", "part", "no", "no"] },
  { row: "Built for families paying out of pocket", cols: ["yes", "yes", "yes", "no"] },
];
const COMPARE_COLS = ["CarePass", "Telemedicine apps", "WhatsApp + transfers", "HMOs & insurance"];

export default function Landing() {
  const providerCount = new Set(PACKAGES.flatMap((p) => p.providerIds)).size;
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div className="grid-fade pointer-events-none absolute inset-0" />
        <div className="container-x relative grid grid-cols-1 items-center gap-14 pb-16 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-24 lg:pt-16">
          <div>
            <Badge tone="brand" dot className="mb-5 bg-white py-1.5 pl-2.5 pr-3 shadow-card ring-1 ring-line">
              Care for family in Lagos &amp; Abuja
            </Badge>
            <h1 className="text-balance text-[42px] font-bold leading-[1.02] sm:text-[58px] lg:text-[68px]">
              Get Mom the right care. <span className="text-brand-600">See that it happened.</span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-[17px] leading-relaxed text-ink-soft sm:text-lg">
              Families already pay for care back home. CarePass fixes the path around that money: the right package, a vetted provider, every step tracked, and funds released only when the provider confirms each step.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/signin?mode=signup" size="lg">Start a care package <ArrowRight className="h-5 w-5" /></Button>
              <Button href="/pass" size="lg" variant="outline">See the family view</Button>
            </div>
            <ul className="mt-9 grid grid-cols-1 max-w-xl gap-3 text-sm font-semibold text-ink-soft sm:grid-cols-3">
              {[[BadgeCheck, "Vetted providers"], [Wallet, "Pay per confirmed step"], [Lock, "Private by design"]].map(([I, t]) => {
                const Icon = I as typeof BadgeCheck;
                return <li key={t as string} className="flex items-center gap-2"><Icon className="h-[18px] w-[18px] text-brand-600" />{t as string}</li>;
              })}
            </ul>
          </div>
          <div className="relative flex justify-center py-6 lg:py-0">
            <div className="absolute inset-x-0 top-1/2 mx-auto h-[420px] w-[420px] max-w-full -translate-y-1/2 rounded-full bg-brand-200/50 blur-3xl" />
            <PhoneMock className="relative" />
          </div>
        </div>
      </section>

      {/* ---------- Proof strip ---------- */}
      <section className="border-y border-line bg-white">
        <dl className="container-x grid grid-cols-1 grid-cols-2 gap-y-6 py-8 sm:grid-cols-4">
          {[
            [String(PACKAGES.length), "Defined care packages"],
            [String(providerCount), "Vetted partner providers"],
            ["2", "Cities: Lagos and Abuja"],
            ["100%", "Payouts tied to a confirmed step"],
          ].map(([v, l]) => (
            <div key={l} className="px-2 text-center sm:border-l sm:border-line sm:first:border-l-0">
              <dt className="num text-[32px] font-bold leading-none sm:text-4xl">{v}</dt>
              <dd className="mt-2 text-[13px] font-medium text-ink-mute">{l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="container-x py-20 lg:py-28">
        <div className="max-w-2xl">
          <div className="eyebrow mb-3">How it works</div>
          <h2 className="h-section text-balance">From “we need care for Mom” to a completed visit.</h2>
        </div>
        <ol className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW.map((h, i) => (
            <li key={h.t} className="card card-hover relative p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><h.icon className="h-5 w-5" /></span>
                <span className="num text-4xl font-bold text-canvas-3">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-bold">{h.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-mute">{h.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Money moves when care happens ---------- */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="grain pointer-events-none absolute inset-0" />
        <div className="container-x relative grid grid-cols-1 items-center gap-12 py-20 lg:grid-cols-2 lg:gap-20 lg:py-28">
          <div>
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-300">Pay for proof</div>
            <h2 className="h-section text-balance">Money moves only when care happens.</h2>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-white/70">
              Fund a package once. Your money is held against it and released to the provider one confirmed step at a time. If a step never happens, that money stays yours.
            </p>
            <ul className="mt-8 space-y-3.5">
              {["Payouts are fixed per step when you fund", "A confirmed visit code is the only trigger", "You see every release as it happens"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-[15px] text-white/85">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500/25 text-brand-200"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>{t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-pop backdrop-blur sm:p-7">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs font-semibold text-white/55">Diagnostic workup · funded</div>
                <div className="num mt-1 text-4xl font-bold">$120.00</div>
              </div>
              <Badge tone="dark" dot>2 of 5 payouts made</Badge>
            </div>
            <div className="mt-5 flex gap-1.5" aria-hidden>
              {SCHEDULE.map((x) => (
                <span key={x.s} className={clsx("h-2 flex-1 rounded-full", x.st === "done" ? "bg-brand-400" : x.st === "now" ? "bg-brand-400/40" : "bg-white/15")} />
              ))}
            </div>
            <ul className="mt-5 divide-y divide-white/10">
              {SCHEDULE.map((x) => (
                <li key={x.s} className="flex items-center gap-3 py-3">
                  <span className={clsx("grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                    x.st === "done" ? "bg-brand-400 text-brand-950" : x.st === "now" ? "bg-white text-ink" : "bg-white/10 text-white/50")}>
                    {x.st === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3.2} /> : ""}
                  </span>
                  <span className={clsx("flex-1 text-sm", x.st === "next" ? "text-white/50" : "font-semibold")}>{x.s}</span>
                  <span className={clsx("num text-sm font-semibold", x.st === "done" ? "text-brand-300" : "text-white/45")}>
                    {usd(24)} {x.st === "done" ? "released" : "held"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Three views ---------- */}
      <section className="container-x py-20 lg:py-28">
        <div className="max-w-2xl">
          <div className="eyebrow mb-3">One episode, three views</div>
          <h2 className="h-section text-balance">Everyone sees exactly what they need. Nothing more.</h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[
            { t: "Sponsor", tag: "You, abroad", href: "/sponsor", cta: "Open sponsor app", sees: ["Package, provider and progress", "Confirmations and receipts", "Money held and released"], never: ["Diagnoses or notes", "Intake documents"] },
            { t: "Family", tag: "Your relative, at home", href: "/pass", cta: "Open family pass", sees: ["The next step and where to go", "A visit code to show", "What to bring"], never: ["Anything they didn’t share"] },
            { t: "Provider", tag: "Hospital or lab", href: "/provider", cta: "Open provider desk", sees: ["Their own patients’ packages", "Intake documents", "Payout per confirmed step"], never: ["Other providers’ patients"] },
          ].map((c) => (
            <article key={c.t} className="card flex flex-col p-6">
              <div className="flex items-baseline justify-between"><h3 className="text-2xl font-bold">{c.t}</h3><span className="text-[13px] font-medium text-ink-mute">{c.tag}</span></div>
              <div className="mt-6 text-xs font-bold uppercase tracking-wider text-brand-700">Sees</div>
              <ul className="mt-2.5 space-y-2.5">{c.sees.map((s) => <li key={s} className="flex items-start gap-2.5 text-sm"><Eye className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{s}</li>)}</ul>
              <div className="mt-5 text-xs font-bold uppercase tracking-wider text-ink-mute">Never sees</div>
              <ul className="mt-2.5 space-y-2.5">{c.never.map((s) => <li key={s} className="flex items-start gap-2.5 text-sm text-ink-mute"><EyeOff className="mt-0.5 h-4 w-4 shrink-0" />{s}</li>)}</ul>
              <Button href={c.href} variant="outline" full className="mt-auto" >{c.cta}</Button>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Packages ---------- */}
      <section id="network" className="border-y border-line bg-white py-20 lg:py-28">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="eyebrow mb-3">Care packages</div>
              <h2 className="h-section text-balance">Clear scope. Clear price band. Clear steps.</h2>
            </div>
            <Button href="/packages" variant="outline">Explore inclusions and providers <ArrowRight className="h-4 w-4" /></Button>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PACKAGES.map((p) => (
              <article key={p.id} className="card card-hover flex flex-col p-6">
                <PkgIcon id={p.icon} />
                <h3 className="mt-5 text-lg font-bold">{p.name}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-mute">{p.blurb}</p>
                <div className="mt-5 border-t border-line pt-4">
                  <div className="num text-xl font-bold">{usd(p.price[0], 0)} – {usd(p.price[1], 0)}</div>
                  <div className="mt-0.5 text-xs font-medium text-ink-mute">{p.timeline} · {p.steps.length - 1} steps</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Trust ---------- */}
      <section id="trust" className="container-x py-20 lg:py-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <div className="eyebrow mb-3">Trust &amp; privacy</div>
            <h2 className="h-section text-balance">Built so medical information stays medical.</h2>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-ink-soft">
              CarePass tracks milestones, not diagnoses. The people who need clinical detail have it. Everyone else gets proof.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { icon: EyeOff, t: "Milestones only", d: "Sponsors see steps and confirmations. Never results, diagnoses or notes." },
              { icon: Lock, t: "Documents stay private", d: "Intake documents are visible to the provider only, in access-controlled storage." },
              { icon: KeyRound, t: "Code-confirmed visits", d: "A visit counts only when the provider enters the family’s code on the day." },
              { icon: FileCheck, t: "Receipts without results", d: "Providers can attach an invoice. It must contain no clinical results." },
            ].map((x) => (
              <div key={x.t} className="card p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><x.icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-bold">{x.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-mute">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Comparison ---------- */}
      <section className="border-t border-line bg-white py-20 lg:py-28">
        <div className="container-x">
          <div className="max-w-2xl">
            <div className="eyebrow mb-3">How it compares</div>
            <h2 className="h-section text-balance">The gap between a transfer and a completed visit.</h2>
          </div>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-canvas">
                  <th className="p-4 text-left font-semibold text-ink-mute"><span className="sr-only">Capability</span></th>
                  {COMPARE_COLS.map((c, i) => (
                    <th key={c} className={clsx("p-4 text-center text-[13px] font-bold", i === 0 && "bg-brand-50 text-brand-800")}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((r) => (
                  <tr key={r.row} className="border-t border-line">
                    <th scope="row" className="p-4 text-left font-semibold">{r.row}</th>
                    {r.cols.map((c, i) => (
                      <td key={i} className={clsx("p-4 text-center", i === 0 && "bg-brand-50/60")}>
                        <span className="inline-flex items-center justify-center" aria-label={c === "yes" ? "Yes" : c === "part" ? "Partly" : "No"}>
                          {c === "yes" ? <Check className="h-5 w-5 text-brand-600" strokeWidth={2.8} /> : c === "part" ? <Minus className="h-5 w-5 text-sun-500" strokeWidth={2.8} /> : <X className="h-5 w-5 text-ink-faint" />}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-ink-mute">General comparison of categories, not of any single product. Telemedicine starts with a remote consult; HMOs cover members; transfers carry no structure or proof.</p>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="container-x py-20 lg:py-28">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <div className="eyebrow mb-3">FAQ</div>
            <h2 className="h-section text-balance">Questions, answered.</h2>
            <p className="mt-4 text-ink-mute">Still unsure? Try the demo. It takes about three minutes.</p>
            <Button href="/signin?mode=signup" className="mt-6">Try the demo <ArrowRight className="h-4 w-4" /></Button>
          </div>
          <div className="divide-y divide-line rounded-2xl border border-line bg-white">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group px-5 py-1 sm:px-6">
                <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 py-3 font-bold">
                  {q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-ink-mute transition-transform group-open:rotate-180" />
                </summary>
                <p className="pb-4 pr-8 text-[15px] leading-relaxed text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="container-x pb-20 lg:pb-28">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 to-brand-950 p-8 text-white sm:p-14">
          <div className="grain pointer-events-none absolute inset-0" />
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="text-balance text-[32px] font-bold sm:text-[44px]">Start with one package for one person.</h2>
              <p className="mt-3 text-white/70">Add a family member, choose a package and a provider, and follow every step. {MERCHANTS.length} partner facilities across Lagos and Abuja are ready.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button href="/signin?mode=signup" size="lg" variant="light">Get started <ArrowRight className="h-5 w-5" /></Button>
              <Button href="/packages" size="lg" variant="glass">Browse packages</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
