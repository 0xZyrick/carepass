"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Receipt, Search } from "lucide-react";
import clsx from "clsx";
import { Empty, PageHeader } from "@/components/ui/ui";
import { TxDetailSheet, TxRow, txTitle } from "@/components/TxRow";
import { useStore } from "@/lib/store";
import { Tx, TxKind } from "@/lib/data";
import { dayLabel, usd } from "@/lib/format";

const FILTERS: { id: "all" | TxKind; label: string }[] = [
  { id: "all", label: "All" }, { id: "topup", label: "Added" }, { id: "payment", label: "Payments" }, { id: "blocked", label: "Not allowed" },
];

export function ActivityView() {
  const params = useSearchParams();
  const { txs, beneficiaries } = useStore();
  const initial = (params.get("f") as TxKind) || "all";
  const [f, setF] = useState<"all" | TxKind>(FILTERS.some((x) => x.id === initial) ? initial : "all");
  const [person, setPerson] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Tx | null>(null);
  const who = (id: string) => beneficiaries.find((b) => b.id === id);

  const list = useMemo(
    () => txs.filter((t) => (f === "all" || t.kind === f) && (person === "all" || t.beneficiaryId === person) &&
      (!q || txTitle(t, "sponsor", who(t.beneficiaryId)).toLowerCase().includes(q.toLowerCase()) || t.ref.toLowerCase().includes(q.toLowerCase()))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [txs, f, person, q, beneficiaries]
  );
  const groups = useMemo(() => {
    const m = new Map<number, Tx[]>();
    list.forEach((t) => m.set(t.daysAgo, [...(m.get(t.daysAgo) ?? []), t]));
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [list]);
  const sum = (k: TxKind) => list.filter((t) => t.kind === k).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Activity" sub="Money added, clinic payments, and anything your rules stopped." />

      <div className="mb-5 grid grid-cols-3 gap-3">
        {[["Added", usd(sum("topup"), 0), "text-brand-700"], ["Spent on care", usd(sum("payment"), 0), "text-ink"], ["Not allowed", usd(sum("blocked"), 0), "text-rose-700"]].map(([l, v, c]) => (
          <div key={l} className="card p-3.5 sm:p-5"><div className="text-[11px] font-semibold text-ink-mute sm:text-xs">{l}</div><div className={clsx("num mt-1 text-xl font-extrabold sm:text-2xl", c)}>{v}</div></div>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clinic or reference" aria-label="Search activity"
            className="h-12 w-full rounded-2xl border border-line-strong bg-white pl-11 pr-4 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15" />
        </div>
        {beneficiaries.length > 1 && (
          <select value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Filter by person" className="h-12 rounded-2xl border border-line-strong bg-white px-4 font-semibold outline-none focus:border-brand-500">
            <option value="all">Everyone</option>
            {beneficiaries.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>
      <div className="no-scrollbar -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0" role="tablist">
        {FILTERS.map((x) => (
          <button key={x.id} role="tab" aria-selected={f === x.id} onClick={() => setF(x.id)}
            className={clsx("h-10 shrink-0 rounded-full px-5 text-sm font-bold transition", f === x.id ? "bg-ink text-white" : "border border-line-strong bg-white text-ink-soft hover:border-ink-faint")}>{x.label}</button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="card"><Empty icon={<Receipt className="h-6 w-6" />} title="Nothing here" sub="No transactions match your filters." /></div>
      ) : (
        <div className="space-y-6">
          {groups.map(([d, items]) => (
            <section key={d}>
              <h2 className="mb-2 px-1 font-sans text-[13px] font-bold uppercase tracking-wider text-ink-mute">{dayLabel(d)}</h2>
              <div className="card divide-y divide-line/70 overflow-hidden">{items.map((t) => <TxRow key={t.id} tx={t} who={who(t.beneficiaryId)} onClick={() => setOpen(t)} />)}</div>
            </section>
          ))}
        </div>
      )}
      <TxDetailSheet tx={open} who={open ? who(open.beneficiaryId) : undefined} onClose={() => setOpen(null)} />
    </div>
  );
}
