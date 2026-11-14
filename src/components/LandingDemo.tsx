"use client";

import { useState } from "react";
import { ShieldCheck, ShieldX, ArrowRight } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";

const SCEN = {
  hospital: { label: "Pay Lagoon Hospital", ok: true, to: "Lagoon Hospital · GA7F…K2QX" },
  wallet: { label: "Send to a personal wallet", ok: false, to: "Unknown wallet · GDEA…BEEF" },
} as const;

export function LandingDemo() {
  const [k, setK] = useState<keyof typeof SCEN>("hospital");
  const s = SCEN[k];
  return (
    <div className="rounded-[28px] bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur sm:p-6">
      <div className="eyebrow !text-white/50">Try a $50 payment</div>
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-black/25 p-1.5">
        {(Object.keys(SCEN) as (keyof typeof SCEN)[]).map((id) => (
          <button key={id} onClick={() => setK(id)} className={clsx("rounded-xl px-3 py-3 text-[13px] font-semibold leading-tight transition", k === id ? "bg-white text-ink shadow" : "text-white/70 hover:text-white")}>
            {SCEN[id].label}
          </button>
        ))}
      </div>

      <div key={k} className="mt-4 animate-scale-in rounded-2xl bg-black/25 p-4">
        <div className="font-mono text-[12px] text-white/50">→ {s.to}</div>
        <div className={clsx("mt-3 flex items-center gap-3", s.ok ? "text-brand-300" : "text-[#FF8C80]")}>
          {s.ok ? <ShieldCheck className="h-8 w-8" /> : <ShieldX className="h-8 w-8" />}
          <div>
            <div className="font-display text-xl font-extrabold">{s.ok ? "Approved & settled" : "Blocked by guardrail"}</div>
            <div className="text-[13px] text-white/65">
              {s.ok ? "Settled on Stellar, paid out in Naira via Yellow Card" : "Funds stay locked in the wallet — zero leakage"}
            </div>
          </div>
        </div>
      </div>
      <Link href="/guardrails" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-300 hover:text-white">
        Open the full guardrail lab <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
