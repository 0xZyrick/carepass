import type { Metadata } from "next";
import { ArrowRight, Banknote, Blocks, Globe2, Landmark } from "lucide-react";
import { Button } from "@/components/ui/ui";
import { contractUrl } from "@/lib/site";
import { PARTNERS } from "@/lib/partners";

export const metadata: Metadata = {
  title: "How it's built",
  description: "The problem CarePass solves and the three layers it is built from: healthcare, payments and blockchain.",
};

const ICON = { stellar: Globe2, soroban: Blocks, yellowcard: Banknote, ramp: Landmark } as const;

const LAYERS = [
  ["Healthcare", "Verified providers", "Hospitals, labs and pharmacies register, are checked, and get a QR code. Only these can be paid. Families see care, not cash."],
  ["Fintech", "Cards and bank in, Naira out", "Sponsors in the US and UK pay by card or bank through a licensed checkout. Clinics are paid in Naira through a licensed payout partner."],
  ["Blockchain", "Rules that can't be bypassed", "Money is held as digital dollars on the Stellar network, and a smart contract allows payments only to verified providers within the sponsor's limits. The sponsor stays in control, and no one, including CarePass, can redirect the money."],
];

export default function About() {
  return (
    <div className="container-x pb-24 pt-12 lg:pt-16">
      <div className="eyebrow">How it's built</div>
      <h1 className="mt-3 max-w-3xl text-balance font-display text-[40px] font-semibold leading-[1.05] sm:text-6xl">Healthcare, payments and blockchain, in one simple product.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">Families abroad send billions home every year, and a large share of it pays for healthcare. Cash arrives with no guarantee it reaches care. CarePass turns that transfer into a payment that can only go to a verified provider.</p>

      <section className="mt-16">
        <h2 className="font-display text-3xl font-semibold">Three layers</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {LAYERS.map(([k, t, d]) => (
            <div key={k} className="receipt-wrap"><div className="receipt p-7 pb-9"><div className="eyebrow">{k}</div><h3 className="mt-3 font-display text-2xl font-semibold">{t}</h3><p className="mt-2 leading-relaxed text-ink-mute">{d}</p></div></div>
          ))}
        </div>
      </section>

      {process.env.CHAIN_REGISTRY_ID && (
        <section className="mt-20 rounded-3xl bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-3xl font-semibold">Live on the network</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Every family pass has its own vault on the network. Each clinic is registered as a verified provider. Payments in the app are made through these contracts, and every one has a public receipt.</p>
          <a href={contractUrl(process.env.CHAIN_REGISTRY_ID)} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-line-strong px-4 py-2.5 text-sm font-semibold">Verified providers registry <span className="font-mono text-xs text-ink-mute">{process.env.CHAIN_REGISTRY_ID.slice(0, 6)}…{process.env.CHAIN_REGISTRY_ID.slice(-6)}</span> ↗</a>
        </section>
      )}

      <section className="mt-20">
        <h2 className="font-display text-3xl font-semibold">Technology and partners</h2>
        <p className="mt-3 max-w-2xl text-ink-mute">First route: the United States and United Kingdom to Nigeria.</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {PARTNERS.map((p) => { const Icon = ICON[p.id]; return (
            <li key={p.id} className="card p-6"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-white"><Icon className="h-5 w-5" /></span><div><h3 className="font-display text-xl font-semibold">{p.name}</h3><div className="text-sm font-semibold text-brand-700">{p.role}</div></div></div><p className="mt-3 text-sm leading-relaxed text-ink-mute">{p.blurb}</p></li>
          ); })}
        </ul>
      </section>

      <section className="mt-20 rounded-3xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="font-display text-3xl font-semibold">Where it stands</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">The full product works today in test mode: accounts, family passes, spending rules, card checkout, QR payments at clinics, PINs and activity. It runs on the Stellar test network and a payment-partner sandbox, so no real money moves. Going live means switching to production keys and completing partner onboarding and a contract security review. The product itself doesn't change.</p>
      </section>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Button href="/signin?mode=signup" size="lg">Get started <ArrowRight className="h-5 w-5" /></Button>
        <Button href="/try" size="lg" variant="outline">Try a payment</Button>
      </div>
    </div>
  );
}
