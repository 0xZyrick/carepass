"use client";

import { ArrowDownLeft, ShieldX, ShieldCheck, Copy, Check } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { Beneficiary, Tx } from "@/lib/data";
import { dayLabel, ngn, usd } from "@/lib/format";
import { CatIcon, Sheet, Stamp } from "@/components/ui/ui";
import { receiptUrl } from "@/lib/site";

export type Perspective = "sponsor" | "family";

export function txTitle(t: Tx, p: Perspective, who?: Beneficiary) {
  if (t.kind === "topup") return p === "family" ? `Top-up from ${who?.sponsorName ?? "your sponsor"}` : `Top-up · ${who?.name ?? ""}`;
  if (t.kind === "blocked") return `Not allowed · ${t.merchant}`;
  return t.merchant ?? "Payment";
}

export function TxIcon({ tx }: { tx: Tx }) {
  if (tx.kind === "topup")
    return <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-500 text-white"><ArrowDownLeft className="h-5 w-5" /></span>;
  if (tx.kind === "blocked")
    return <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-700"><ShieldX className="h-5 w-5" /></span>;
  return <CatIcon type={tx.category ?? "hospital"} />;
}

export function TxRow({ tx, who, perspective = "sponsor", onClick, showWho = true }: { tx: Tx; who?: Beneficiary; perspective?: Perspective; onClick?: () => void; showWho?: boolean }) {
  const sub = [showWho && perspective === "sponsor" ? who?.name : null, tx.daysAgo === 0 ? `Today ${tx.time}` : `${dayLabel(tx.daysAgo)} · ${tx.time}`].filter(Boolean).join(" · ");
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition hover:bg-canvas/70 sm:px-5">
      <TxIcon tx={tx} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold">{txTitle(tx, perspective, who)}</div>
        <div className="truncate text-[13px] text-ink-mute">{sub}</div>
      </div>
      <div className="text-right">
        <div className={clsx("num text-[15px] font-bold", tx.kind === "topup" && "text-brand-700", tx.kind === "blocked" && "text-rose-700 line-through decoration-1")}>
          {tx.kind === "topup" ? "+" : tx.kind === "payment" ? "−" : ""}{usd(tx.amount)}
        </div>
        <div className="text-xs text-ink-faint">{tx.kind === "blocked" ? "Stopped" : ngn(tx.amount)}</div>
      </div>
    </button>
  );
}

export function TxDetailSheet({ tx, who, onClose, perspective = "sponsor", phone }: { tx: Tx | null; who?: Beneficiary; onClose: () => void; perspective?: Perspective; phone?: boolean }) {
  const [copied, setCopied] = useState(false);
  if (!tx) return null;
  const rows: [string, string][] = [
    ["Reference", tx.ref],
    ["Date", `${dayLabel(tx.daysAgo)}, ${tx.time}`],
    ["Family pass", who ? `${who.fullName} · •••• ${who.last4}` : "—"],
    ...(tx.method ? [["Paid with", tx.method] as [string, string]] : []),
    ...(tx.merchant && tx.kind !== "topup" ? [["Provider", tx.merchant] as [string, string]] : []),
    ...(tx.note ? [[tx.kind === "blocked" ? "Why" : "For", tx.note] as [string, string]] : []),
    ...(tx.kind !== "blocked" ? [["Naira value", ngn(tx.amount)] as [string, string]] : []),
  ];
  return (
    <Sheet open onClose={onClose} title="Transaction" phone={phone}>
      <div className="flex flex-col items-center py-2 text-center">
        <TxIcon tx={tx} />
        <div className="mt-3 text-[15px] font-semibold text-ink-soft">{txTitle(tx, perspective, who)}</div>
        <div className={clsx("num mt-1 font-display text-[40px] font-bold leading-none", tx.kind === "topup" && "text-brand-700", tx.kind === "blocked" && "text-rose-700")}>
          {tx.kind === "topup" ? "+" : tx.kind === "payment" ? "−" : ""}{usd(tx.amount)}
        </div>
        <div className="mt-3">
          {tx.kind === "blocked" ? <Stamp tone="no">Not allowed</Stamp> : <Stamp tone="ok">{tx.kind === "topup" ? "Added" : "Paid"}</Stamp>}
        </div>
      </div>
      {tx.kind === "blocked" && (
        <p className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm leading-relaxed text-rose-700">
          This payment was stopped by the care rules. No money was spent.
        </p>
      )}
      <div className="tear mt-5" />
      <dl className="mt-2 divide-y divide-dashed divide-line-strong">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-6 py-3 text-sm">
            <dt className="text-ink-mute">{k}</dt>
            <dd className="text-right font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      {tx.chainTx && (
        <a href={receiptUrl(tx.chainTx)} target="_blank" rel="noreferrer" className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-brand-500/40 bg-brand-50 text-sm font-semibold text-brand-800">Network receipt <span aria-hidden>↗</span></a>
      )}
      <button
        onClick={() => { navigator.clipboard?.writeText(tx.ref).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-canvas text-sm font-semibold text-ink-soft hover:bg-canvas-2"
      >
        {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy reference</>}
      </button>
    </Sheet>
  );
}
