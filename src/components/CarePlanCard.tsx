"use client";

import { useState } from "react";
import { BadgeCheck, Check, KeyRound } from "lucide-react";
import clsx from "clsx";
import { Button, CatIcon, Sheet } from "@/components/ui/ui";
import { useStore, type CarePlan } from "@/lib/store";
import { usd } from "@/lib/format";

/** A care plan as a timeline of milestones. Families can show a visit code for the next step; sponsors only see progress. */
export function CarePlanCard({ plan, mode }: { plan: CarePlan; mode: "family" | "sponsor" }) {
  const { getVisitCode, cancelPlan, toast } = useStore();
  const [code, setCode] = useState<{ code: string; clinicName: string; title: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const total = plan.steps.length;

  async function show(stepId: string) { setBusy(true); const c = await getVisitCode(stepId); setBusy(false); if (c) setCode(c); }

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Care plan</div>
          <h2 className="mt-1 font-display text-xl font-semibold">{plan.title}</h2>
          <p className="mt-0.5 text-sm text-ink-mute">{plan.status === "complete" ? "All steps complete" : plan.status === "cancelled" ? "Cancelled" : `${plan.doneCount} of ${total} steps done`} · {usd(plan.totalUsd, 0)} in total</p>
        </div>
        {plan.status === "complete" && <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800"><BadgeCheck className="h-3.5 w-3.5" /> Complete</span>}
      </div>
      {plan.status === "active" && plan.escrow && plan.lockedUsd > 0 && (
        <p className="mt-3 rounded-2xl bg-brand-50 px-3.5 py-2.5 text-[13px] font-medium text-brand-800">{usd(plan.lockedUsd, 0)} is locked for the remaining steps. Each amount is released only when the clinic confirms the visit.</p>
      )}
      <div className="mt-4 flex gap-1.5" aria-hidden>{plan.steps.map((s) => <span key={s.id} className={clsx("h-1.5 flex-1 rounded-full", s.status === "done" ? "bg-brand-500" : "bg-canvas-2")} />)}</div>

      <ol className="mt-5 space-y-4">
        {plan.steps.map((s) => {
          const next = s.id === plan.nextStepId;
          return (
            <li key={s.id} className="flex gap-3.5">
              <span className={clsx("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold", s.status === "done" ? "bg-brand-500 text-white" : next ? "bg-ink text-white" : "bg-canvas-2 text-ink-faint")}>
                {s.status === "done" ? <Check className="h-4 w-4" strokeWidth={3} /> : s.idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className={clsx("font-semibold", s.status === "pending" && !next && "text-ink-soft")}>{s.title}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-ink-mute"><CatIcon type={s.category} boxed={false} className="h-3.5 w-3.5" /> {s.clinicName} · {s.when} · {usd(s.priceUsd, 0)}</div>
                {s.status === "done" && s.receiptId && <a href={`/verify/${s.receiptId}`} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[13px] font-semibold text-brand-700 underline">Receipt ↗</a>}
                {next && mode === "family" && <Button size="sm" className="mt-2.5" disabled={busy} onClick={() => show(s.id)} icon={<KeyRound className="h-4 w-4" />}>Show visit code</Button>}
                {next && mode === "sponsor" && <div className="mt-1 text-[13px] font-medium text-brand-700">Next up</div>}
              </div>
            </li>
          );
        })}
      </ol>

      {plan.status === "active" && (
        <button onClick={() => { if (confirm("Cancel this care plan? Steps already paid stay paid.")) { cancelPlan(plan.id); toast("Care plan cancelled"); } }} className="mt-5 text-[13px] font-semibold text-ink-mute underline">Cancel plan</button>
      )}

      <Sheet open={!!code} onClose={() => setCode(null)} title="Your visit code">
        {code && (
          <div className="text-center">
            <p className="text-sm text-ink-mute">{code.title}</p>
            <div className="mt-4 rounded-3xl bg-canvas p-6 font-mono text-5xl font-bold tracking-[0.2em]">{code.code.slice(0, 3)} {code.code.slice(3)}</div>
            <p className="mt-4 text-sm text-ink-soft">Show this at <b>{code.clinicName}</b>. They enter it to confirm your visit, and the payment for this step is released.</p>
            <Button className="mt-6" size="lg" full variant="outline" onClick={() => setCode(null)}>Done</Button>
          </div>
        )}
      </Sheet>
    </section>
  );
}
