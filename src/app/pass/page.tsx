"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Bell, BadgeCheck, Eye, EyeOff, HandCoins, MapPin, QrCode, ScanLine, Send, Snowflake } from "lucide-react";
import clsx from "clsx";
import { Avatar, Button, CatIcon, Progress, Sheet } from "@/components/ui/ui";
import { PassCard } from "@/components/PassCard";
import { TxDetailSheet, TxRow } from "@/components/TxRow";
import { QRPattern } from "@/components/ui/ui";
import { useStore } from "@/lib/store";
import { MERCHANTS, Tx } from "@/lib/data";
import { greet, ngn, usd } from "@/lib/format";

const REASONS = ["Hospital visit", "Medicine", "Lab tests", "Dental", "Emergency"];

export default function PassHome() {
  const { beneficiaries, activePassId, txs, spent, requestTopUp, requests, toast } = useStore();
  const b = beneficiaries.find((x) => x.id === activePassId) ?? beneficiaries[0];
  const [hide, setHide] = useState(false);
  const [qr, setQr] = useState(false);
  const [req, setReq] = useState(false);
  const [amt, setAmt] = useState(50);
  const [why, setWhy] = useState(REASONS[0]);
  const [open, setOpen] = useState<Tx | null>(null);
  const s = spent(b.id);
  const left = Math.max(0, b.monthlyLimit - s);
  const pending = requests.find((r) => r.beneficiaryId === b.id);
  const near = MERCHANTS.filter((m) => m.city === b.city && b.allowed.includes(m.type)).sort((a, c) => a.distKm - c.distKm).slice(0, 3);
  const mine = txs.filter((t) => t.beneficiaryId === b.id).slice(0, 3);

  const actions = [
    { label: "Pay", icon: ScanLine, href: "/pass/pay" },
    { label: "My QR", icon: QrCode, onClick: () => setQr(true) },
    { label: "Clinics", icon: MapPin, href: "/pass/clinics" },
    { label: "Request", icon: HandCoins, onClick: () => setReq(true) },
  ];

  return (
    <div className="animate-fade-in px-5 pb-8 pt-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar initials={b.initials} hue={b.hue} size={44} />
          <div className="leading-tight"><div className="text-[13px] font-medium text-ink-mute">{greet()}</div><div className="font-display text-xl font-extrabold">{b.name}</div></div>
        </div>
        <button aria-label="Notifications" onClick={() => toast("You're all caught up")} className="relative grid h-11 w-11 place-items-center rounded-full bg-white shadow-card"><Bell className="h-5 w-5" /></button>
      </header>

      <div className="relative mt-6">
        <PassCard name={b.fullName} balance={b.balance} last4={b.last4} hue={b.hue} frozen={b.frozen} hidden={hide} />
        <button onClick={() => setHide(!hide)} aria-label={hide ? "Show balance" : "Hide balance"} className="absolute right-[3.25rem] top-4 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25">
          {hide ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>

      {b.frozen && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-iris-50 p-4 text-sm text-iris-700">
          <Snowflake className="mt-0.5 h-5 w-5 shrink-0" /><p><strong>Your pass is paused.</strong> {b.sponsorName ?? "Your sponsor"} has frozen payments for now. Message them to unfreeze it.</p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-4 gap-2.5">
        {actions.map((a) => {
          const inner = (<><span className={clsx("grid h-14 w-14 place-items-center rounded-2xl transition group-active:scale-95", a.label === "Pay" ? "bg-brand-500 text-white shadow-glow" : "bg-white text-ink shadow-card")}><a.icon className="h-6 w-6" /></span><span className="text-[13px] font-semibold">{a.label}</span></>);
          return a.href ? <Link key={a.label} href={a.href} className="group flex flex-col items-center gap-2">{inner}</Link>
            : <button key={a.label} onClick={a.onClick} className="group flex flex-col items-center gap-2">{inner}</button>;
        })}
      </div>

      {pending && <div className="mt-5 flex items-center gap-3 rounded-2xl bg-sun-50 p-4 text-sm text-sun-600"><Send className="h-5 w-5 shrink-0" /><p><strong>Request sent</strong> — {b.sponsorName ?? "Your sponsor"} has been asked for {usd(pending.amount, 0)}.</p></div>}

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-card" aria-label="Monthly spending">
        <div className="flex items-end justify-between">
          <div><div className="text-sm font-semibold text-ink-mute">Left to spend this month</div><div className="num mt-0.5 text-2xl font-extrabold">{usd(left, 0)}</div></div>
          <div className="text-right text-xs text-ink-mute">{usd(s, 0)} of {usd(b.monthlyLimit, 0)}<br />{ngn(left)}</div>
        </div>
        <div className="mt-3"><Progress value={s} max={b.monthlyLimit} /></div>
      </section>

      <section className="mt-7" aria-label="Nearby clinics">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-sans text-base font-bold">Verified nearby</h2><Link href="/pass/clinics" className="flex items-center gap-1 text-sm font-semibold text-brand-700">See all <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="space-y-2.5">
          {near.map((m) => (
            <Link key={m.id} href={`/pass/pay?m=${m.id}`} className="flex items-center gap-3.5 rounded-2xl bg-white p-3.5 shadow-card transition active:scale-[0.99]">
              <CatIcon type={m.type} />
              <div className="min-w-0 flex-1"><div className="truncate text-[15px] font-bold">{m.name}</div><div className="truncate text-[13px] text-ink-mute">{m.distKm} km · {m.open ? "Open now" : "Closed"}</div></div>
              <BadgeCheck className="h-5 w-5 shrink-0 text-brand-500" aria-label="Verified" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-7" aria-label="Recent activity">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-sans text-base font-bold">Recent</h2><Link href="/pass/activity" className="text-sm font-semibold text-brand-700">See all</Link></div>
        <div className="divide-y divide-line/70 overflow-hidden rounded-3xl bg-white shadow-card">
          {mine.map((t) => <TxRow key={t.id} tx={t} perspective="family" who={b} showWho={false} onClick={() => setOpen(t)} />)}
        </div>
      </section>

      {/* My QR */}
      <Sheet phone open={qr} onClose={() => setQr(false)} title="Your pass QR">
        <div className="flex flex-col items-center pb-2 text-center">
          <div className="rounded-3xl border border-line bg-white p-4 shadow-card"><QRPattern seed={`pass-${b.id}-${b.last4}`} size={220} /></div>
          <div className="mt-4 font-bold">{b.fullName}</div>
          <div className="font-mono text-sm text-ink-mute">CarePass •••• {b.last4}</div>
          <p className="mt-3 max-w-[260px] text-sm text-ink-mute">Show this to the cashier at any verified clinic, lab or pharmacy.</p>
        </div>
      </Sheet>

      {/* Request funds */}
      <Sheet phone open={req} onClose={() => setReq(false)} title={`Ask ${b.sponsorName ?? "your sponsor"} for funds`}>
        <div className="text-center"><div className="num text-5xl font-extrabold">${amt}</div><div className="mt-1 font-semibold text-brand-700">≈ {ngn(amt)}</div></div>
        <div className="mt-5 flex justify-center gap-2">{[25, 50, 100, 150].map((v) => <button key={v} onClick={() => setAmt(v)} className={clsx("h-11 rounded-full border px-5 text-sm font-bold", amt === v ? "border-brand-500 bg-brand-50 text-brand-800" : "border-line-strong")}>${v}</button>)}</div>
        <div className="eyebrow mb-2 mt-6">What's it for?</div>
        <div className="flex flex-wrap gap-2">{REASONS.map((r) => <button key={r} onClick={() => setWhy(r)} className={clsx("h-10 rounded-full border px-4 text-sm font-semibold", why === r ? "border-ink bg-ink text-white" : "border-line-strong")}>{r}</button>)}</div>
        <Button size="lg" full className="mt-7" icon={<Send className="h-4 w-4" />} onClick={async () => { if (await requestTopUp(b.id, amt, why)) { setReq(false); toast(`Request sent to ${b.sponsorName ?? "your sponsor"}`); } }}>Send request</Button>
      </Sheet>
      <TxDetailSheet phone tx={open} who={b} perspective="family" onClose={() => setOpen(null)} />
    </div>
  );
}
