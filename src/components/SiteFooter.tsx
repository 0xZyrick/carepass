import Link from "next/link";
import { Logo } from "@/components/ui/ui";

const COLS = [
  { h: "Product", l: [["How it works", "/#how"], ["Care packages", "/packages"], ["Trust & privacy", "/#trust"], ["FAQ", "/#faq"]] },
  { h: "Try the demo", l: [["Sponsor app", "/sponsor"], ["Family pass", "/pass"], ["Provider desk", "/provider"], ["Sign in", "/signin"]] },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-brand-950 text-white">
      <div className="grain pointer-events-none absolute inset-0" />
      <div className="container-x relative py-14 sm:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(0,1fr))]">
          <div className="col-span-2 md:col-span-1">
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Care for family back home, from the right package to proof that it happened.
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.h}>
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">{c.h}</div>
              <ul className="mt-4 space-y-3 text-sm">
                {c.l.map(([t, h]) => (
                  <li key={t}><Link href={h} className="text-white/75 transition hover:text-white">{t}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:justify-between">
          <span>© 2026 CarePass. Prototype: all balances, providers and transactions are demo data.</span>
          <span>Built for families, in Lagos, Abuja and everywhere they send love from.</span>
        </div>
      </div>
    </footer>
  );
}
