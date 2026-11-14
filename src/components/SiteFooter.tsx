import Link from "next/link";
import { Logo } from "@/components/ui/ui";

export function SiteFooter() {
  return (
    <footer className="bg-brand-950 text-white">
      <div className="container-x py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Send care, not cash. Healthcare payments for families across borders, with rules enforced by a smart contract.
            </p>
          </div>
          {[
            { h: "Product", l: [["How it works", "/#how"], ["Guardrail lab", "/guardrails"], ["Verified network", "/#network"], ["Partners", "/#partners"]] },
            { h: "Try the demo", l: [["Sponsor app", "/sponsor"], ["Family pass", "/pass"], ["Sign in", "/signin"]] },
            { h: "Help", l: [["FAQ", "/#faq"], ["Security", "/#security"]] },
          ].map((c) => (
            <div key={c.h}>
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">{c.h}</div>
              <ul className="mt-4 space-y-3 text-sm">
                {c.l.map(([t, h]) => (
                  <li key={t}><Link href={h} className="text-white/75 transition hover:text-white">{t}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:justify-between">
          <span>© 2026 CarePass. Running on Stellar testnet. No real money moves yet.</span>
          <span>Built on Stellar · Non-custodial · Merchant-locked</span>
        </div>
      </div>
    </footer>
  );
}
