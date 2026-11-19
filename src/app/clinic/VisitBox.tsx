"use client";

import { useState } from "react";
import { BadgeCheck, CalendarCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/ui";
import { useStore } from "@/lib/store";
import { usd } from "@/lib/format";

/** Confirm a visit with the family's code, and see who is expected. Shows first names only. */
export function VisitBox({ verified }: { verified: boolean }) {
  const { visits, confirmVisit } = useStore();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ title: string; priceUsd: number; patient: string } | null>(null);
  const waiting = visits.filter((v) => v.status === "pending");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setDone(null);
    const r = await confirmVisit(code);
    setBusy(false);
    if (r) { setDone(r); setCode(""); }
  }

  return (
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-card">
      <div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700"><CalendarCheck className="h-5 w-5" /></span><h2 className="font-display text-xl font-semibold">Confirm a visit</h2></div>
      <p className="mt-2 text-[13px] text-ink-mute">When a patient arrives for a planned step, ask for their 6-digit visit code. Confirming it releases payment for that step.</p>
      <form onSubmit={submit} className="mt-4 flex gap-2.5">
        <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="off" placeholder="000 000" aria-label="Visit code" disabled={!verified}
          className="h-12 min-w-0 flex-1 rounded-2xl border border-line-strong bg-white px-4 text-center font-mono text-xl font-bold tracking-[0.25em] outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15" />
        <Button type="submit" size="lg" disabled={busy || code.length !== 6 || !verified}>{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm"}</Button>
      </form>
      {!verified && <p className="mt-2 text-[13px] text-ink-mute">Available once your clinic is verified.</p>}
      {done && <div role="status" className="mt-3 flex items-start gap-2.5 rounded-2xl bg-brand-50 p-3.5 text-sm text-brand-800"><BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" /><p><b>Visit confirmed.</b> {done.title} for {done.patient}. {usd(done.priceUsd, 0)} released to your clinic.</p></div>}
      {waiting.length > 0 && (
        <div className="mt-4 border-t border-line pt-4">
          <div className="text-xs font-semibold text-ink-mute">Planned visits</div>
          <ul className="mt-2 divide-y divide-line text-sm">
            {waiting.slice(0, 6).map((v) => <li key={v.id} className="flex items-center justify-between gap-3 py-2.5"><span className="min-w-0"><b>{v.patient}</b> <span className="text-ink-mute">· {v.title}</span></span><span className="num font-semibold">{usd(v.priceUsd, 0)}</span></li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
