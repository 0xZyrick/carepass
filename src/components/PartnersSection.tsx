import { ArrowRight, Banknote, Blocks, Coins, Globe2, Landmark } from "lucide-react";
import { PARTNERS } from "@/lib/partners";

const ICON = { stellar: Globe2, soroban: Blocks, yellowcard: Banknote, ramp: Landmark } as const;

export function PartnersSection() {
  return (
    <section id="partners" className="container-x py-20 lg:py-28">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
        <div>
          <div className="eyebrow">Built on proven rails</div>
          <h2 className="mt-3 text-balance text-4xl font-extrabold sm:text-5xl">Licensed rails in. Verified care out.</h2>
          <p className="mt-5 max-w-md leading-relaxed text-ink-mute">
            Regulated partners move the money between dollars and Naira. A Soroban contract on Stellar decides where it is allowed to go.
          </p>
          <div className="mt-8 inline-flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
            <span className="text-sm font-bold">First corridor</span>
            <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-soft">
              <span className="rounded-full bg-canvas px-3 py-1">🇺🇸 US</span>
              <span className="rounded-full bg-canvas px-3 py-1">🇬🇧 UK</span>
              <ArrowRight className="h-4 w-4 text-brand-600" />
              <span className="rounded-full bg-brand-50 px-3 py-1 text-brand-800">🇳🇬 Nigeria</span>
            </span>
          </div>
        </div>

        <ol className="relative grid gap-4 sm:grid-cols-2">
          {PARTNERS.map((p, i) => {
            const Icon = ICON[p.id] ?? Coins;
            return (
              <li key={p.id} className="card relative p-6 transition hover:-translate-y-0.5 hover:shadow-pop">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-white"><Icon className="h-6 w-6" /></span>
                  <span className="num text-3xl font-extrabold text-canvas-2">0{i + 1}</span>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-2xl font-extrabold">{p.name}</h3>
                  {p.status === "planned" && <span className="rounded-full bg-sun-50 px-2.5 py-0.5 text-[11px] font-bold text-sun-600">Integrating</span>}
                </div>
                <div className="mt-0.5 text-sm font-bold text-brand-700">{p.role}</div>
                <p className="mt-3 text-sm leading-relaxed text-ink-mute">{p.blurb}</p>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="mt-8 text-xs text-ink-faint">Partner names are trademarks of their respective owners. Running on Stellar testnet and partner sandboxes today; production is next.</p>
    </section>
  );
}
