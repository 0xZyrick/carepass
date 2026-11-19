"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import clsx from "clsx";
import { Avatar, Button, Stamp } from "@/components/ui/ui";
import { MERCHANTS, PERSONAL_SHORT, SEED_BENEFICIARIES } from "@/lib/data";
import { Decision, evaluatePayment } from "@/lib/guardrail";
import { ngn, usd } from "@/lib/format";

const WHERE = [
  { label: "Lagoon Hospital", value: MERCHANTS[0].short },
  { label: "HealthPlus Pharmacy", value: MERCHANTS[2].short },
  { label: "Smile Lagos Dental", value: MERCHANTS[4].short },
  { label: "A personal account", value: PERSONAL_SHORT },
];
const AMOUNTS = [50, 120, 400];

/** A public, account-free walk-through using a fixed sample pass. Real payments are checked on the server. */
export function TryPayment() {
  const b = SEED_BENEFICIARIES[0];
  const [dest, setDest] = useState(WHERE[3].value);
  const [amount, setAmount] = useState(50);
  const [d, setD] = useState<Decision | null>(null);
  const place = WHERE.find((w) => w.value === dest)!;

  return (
    <div className="container-x pb-20 pt-10 lg:pt-16">
      <div className="eyebrow">Try a payment</div>
      <h1 className="mt-3 max-w-3xl text-balance font-display text-[40px] font-semibold leading-[1.05] sm:text-6xl">See how a payment is checked.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">Pretend to be {b.name}. Try paying a hospital, a pharmacy or a personal account and see what the care rules decide.</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="card p-5 sm:p-7">
          <div className="flex items-center gap-3"><Avatar initials={b.initials} hue={b.hue} size={44} /><div className="leading-tight"><div className="font-bold">{b.fullName}'s pass</div><div className="text-sm text-ink-mute">{b.allowed.join(", ")} allowed</div></div></div>
          <div className="eyebrow mb-2.5 mt-7">Pay</div>
          <div className="flex flex-wrap gap-2">
            {WHERE.map((w) => <button key={w.value} onClick={() => { setDest(w.value); setD(null); }} className={clsx("h-10 rounded-full border px-4 text-sm font-semibold", dest === w.value ? "border-ink bg-ink text-white" : "border-line-strong bg-white")}>{w.label}</button>)}
          </div>
          <div className="eyebrow mb-2.5 mt-6">Amount</div>
          <div className="flex flex-wrap gap-2">
            {AMOUNTS.map((a) => <button key={a} onClick={() => { setAmount(a); setD(null); }} className={clsx("h-10 rounded-full border px-5 text-sm font-bold", amount === a ? "border-ink bg-ink text-white" : "border-line-strong bg-white")}>${a}</button>)}
          </div>
          <Button size="lg" full className="mt-8" onClick={() => setD(evaluatePayment(b, dest, amount))}>Pay {usd(amount, 0)} to {place.label}</Button>
        </div>

        <div aria-live="polite">
          {d ? (
            <div className="receipt-wrap animate-scale-in"><div className="receipt px-6 pb-9 pt-8 text-center">
              <Stamp slant tone={d.approved ? "ok" : "no"} className="!text-sm">{d.approved ? "Paid" : "Not allowed"}</Stamp>
              <div className="num mt-5 font-display text-5xl font-semibold">{usd(amount)}</div>
              <div className="mt-1 text-ink-mute">about {ngn(amount)}</div>
              <p className="mx-auto mt-4 max-w-xs leading-relaxed text-ink-soft">{d.approved ? `${d.merchant?.name} has been paid.` : d.reason}</p>
              <div className="tear mt-6" />
              <ul className="mt-5 space-y-3 text-left">
                {d.checks.filter((c) => c.status !== "skipped").map((c) => (
                  <li key={c.id} className="flex items-start gap-3">
                    <span className={clsx("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white", c.status === "pass" ? "bg-brand-500" : "bg-rose-500")}>{c.status === "pass" ? <Check className="h-3 w-3" strokeWidth={4} /> : <X className="h-3 w-3" strokeWidth={4} />}</span>
                    <div className="text-sm leading-tight"><div className="font-semibold">{c.label}</div><div className="mt-0.5 text-[13px] text-ink-mute">{c.detail}</div></div>
                  </li>
                ))}
              </ul>
            </div></div>
          ) : (
            <div className="grid min-h-[320px] place-items-center rounded-3xl border-2 border-dashed border-line-strong p-8 text-center text-ink-mute">Choose where to pay and how much, then press the button.</div>
          )}
        </div>
      </div>
    </div>
  );
}
