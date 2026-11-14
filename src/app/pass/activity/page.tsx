"use client";

import { useMemo, useState } from "react";
import { Receipt } from "lucide-react";
import clsx from "clsx";
import { Empty } from "@/components/ui/ui";
import { TxDetailSheet, TxRow } from "@/components/TxRow";
import { useStore } from "@/lib/store";
import { Tx, TxKind } from "@/lib/data";
import { dayLabel } from "@/lib/format";

const F: { id: "all" | TxKind; label: string }[] = [{ id: "all", label: "All" }, { id: "payment", label: "Payments" }, { id: "topup", label: "Top-ups" }];

export default function PassActivity() {
  const { beneficiaries, activePassId, txs } = useStore();
  const b = beneficiaries.find((x) => x.id === activePassId) ?? beneficiaries[0];
  const [f, setF] = useState<"all" | TxKind>("all");
  const [open, setOpen] = useState<Tx | null>(null);
  const groups = useMemo(() => {
    const m = new Map<number, Tx[]>();
    txs.filter((t) => t.beneficiaryId === b.id && t.kind !== "blocked" && (f === "all" || t.kind === f)).forEach((t) => m.set(t.daysAgo, [...(m.get(t.daysAgo) ?? []), t]));
    return [...m.entries()].sort((a, c) => a[0] - c[0]);
  }, [txs, b.id, f]);

  return (
    <div className="animate-fade-in px-5 pb-8 pt-6">
      <h1 className="text-[28px] font-extrabold">Activity</h1>
      <div className="mt-4 flex gap-2" role="tablist">{F.map((x) => <button key={x.id} role="tab" aria-selected={f === x.id} onClick={() => setF(x.id)} className={clsx("h-10 rounded-full px-5 text-sm font-bold", f === x.id ? "bg-ink text-white" : "bg-white text-ink-soft shadow-card")}>{x.label}</button>)}</div>
      {groups.length === 0 ? <Empty icon={<Receipt className="h-6 w-6" />} title="No activity yet" sub="Your payments and top-ups will show up here." /> : (
        <div className="mt-6 space-y-6">
          {groups.map(([d, items]) => (
            <section key={d}>
              <h2 className="mb-2 px-1 font-sans text-xs font-bold uppercase tracking-wider text-ink-mute">{dayLabel(d)}</h2>
              <div className="divide-y divide-line/70 overflow-hidden rounded-3xl bg-white shadow-card">{items.map((t) => <TxRow key={t.id} tx={t} perspective="family" who={b} showWho={false} onClick={() => setOpen(t)} />)}</div>
            </section>
          ))}
        </div>
      )}
      <TxDetailSheet phone tx={open} who={b} perspective="family" onClose={() => setOpen(null)} />
    </div>
  );
}
