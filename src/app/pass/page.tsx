"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, HeartPulse, Eye, EyeOff, HandCoins, MapPin, ScanLine, Send, Snowflake } from "lucide-react";
import clsx from "clsx";
import { Avatar, Button, CatIcon, Money, Progress, Sheet } from "@/components/ui/ui";
import { CarePlanCard } from "@/components/CarePlanCard";
import { AccountSheet } from "@/components/AccountSheet";
import { PassCard } from "@/components/PassCard";
import { TxDetailSheet, TxRow } from "@/components/TxRow";
import { useStore } from "@/lib/store";
import { Tx } from "@/lib/data";
import { greet, ngn, usd } from "@/lib/format";

const REASONS = ["Hospital visit", "Medicine", "Lab tests", "Dental", "Emergency"];

export default function PassHome() {
  const { carePlans, beneficiaries, activePassId, setActivePassId, txs, requestTopUp, requests, toast, merchants } = useStore();
  const b = beneficiaries.find((x) => x.id === activePassId) ?? beneficiaries[0];
  const [hide, setHide] = useState(false);
  const [account, setAccount] = useState(false);
  const [switcher, setSwitcher] = useState(false);
  const [req, setReq] = useState(false);
  const [amt, setAmt] = useState(50);
  const [why, setWhy] = useState(REASONS[0]);
  const [open, setOpen] = useState<Tx | null>(null);
  const plan = carePlans.find((p) => p.passId === b.id && p.status === "active") ?? carePlans.find((p) => p.passId === b.id && p.status === "complete");
  const pending = requests.find((r) => r.beneficiaryId === b.id);
  const sponsor = b.sponsorName ?? "your sponsor";
  const near = merchants.filter((m) => m.city === b.city && b.allowed.includes(m.type)).sort((a, c) => a.distKm - c.distKm).slice(0, 3);
  const mine = txs.filter((t) => t.beneficiaryId === b.id).slice(0, 3);

  const actions = [
    { label: "Pay a clinic", icon: ScanLine, href: "/pass/pay", primary: true },
    { label: "Find clinics", icon: MapPin, href: "/pass/clinics" },
    { label: "Ask for funds", icon: HandCoins, onClick: () => setReq(true) },
  ];

  return (
    <div className="animate-fade-in px-5 pb-8 pt-5">
      <header className="flex items-center justify-between">
        <button onClick={() => (beneficiaries.length > 1 ? setSwitcher(true) : setAccount(true))} className="flex items-center gap-3 text-left" aria-label="Account">
          <Avatar initials={b.initials} hue={b.hue} size={44} />
          <div className="leading-tight"><div className="text-[13px] font-medium text-ink-mute">{greet()}</div><div className="font-display text-xl font-semibold">{b.name}</div></div>
        </button>
        <button onClick={() => setAccount(true)} className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-ink-soft shadow-card">Account</button>
      </header>

      {plan && <div className="mt-6"><CarePlanCard plan={plan} mode="family" /></div>}

      <div className="relative mt-6">
        <PassCard name={b.fullName} balance={b.balance} last4={b.last4} hue={b.hue} frozen={b.frozen} hidden={hide} />
        <button onClick={() => setHide(!hide)} aria-label={hide ? "Show balance" : "Hide balance"} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25">
          {hide ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>

      {b.frozen && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-iris-50 p-4 text-sm text-iris-700">
          <Snowflake className="mt-0.5 h-5 w-5 shrink-0" /><p><strong>Your pass is paused.</strong> {sponsor} has paused payments for now. Ask them to turn it back on.</p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-2.5">
        {actions.map((a) => {
          const inner = (<><span className={clsx("grid h-14 w-14 place-items-center rounded-2xl transition group-active:scale-95", a.primary ? "bg-brand-500 text-white shadow-glow" : "bg-white text-ink shadow-card")}><a.icon className="h-6 w-6" /></span><span className="text-center text-[13px] font-semibold leading-tight">{a.label}</span></>);
          return a.href ? <Link key={a.label} href={a.href} className="group flex flex-col items-center gap-2">{inner}</Link>
            : <button key={a.label} onClick={a.onClick} className="group flex flex-col items-center gap-2">{inner}</button>;
        })}
      </div>

      {pending && <div className="mt-5 flex items-center gap-3 rounded-2xl bg-sun-50 p-4 text-sm text-sun-600"><Send className="h-5 w-5 shrink-0" /><p><strong>Request sent.</strong> {sponsor} has been asked for {usd(pending.amount, 0)}.</p></div>}

      {!plan && (
        <Link href="/pass/care" className="mt-6 flex items-center gap-4 rounded-3xl bg-white p-5 shadow-card transition active:scale-[0.99]">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700"><HeartPulse className="h-6 w-6" /></span>
          <div className="min-w-0 flex-1"><div className="font-bold">Plan your care</div><div className="text-sm text-ink-mute">Pick a package, choose a clinic, and follow each step.</div></div>
        </Link>
      )}

      {near.length > 0 && (
        <section className="mt-7" aria-label="Nearby clinics">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-sans text-base font-bold">Clinics near you</h2><Link href="/pass/clinics" className="text-sm font-semibold text-brand-700">See all</Link></div>
          <div className="space-y-2.5">
            {near.map((m) => (
              <Link key={m.id} href={`/pass/pay?m=${encodeURIComponent(m.id)}`} className="flex items-center gap-3.5 rounded-2xl bg-white p-3.5 shadow-card transition active:scale-[0.99]">
                <CatIcon type={m.type} />
                <div className="min-w-0 flex-1"><div className="truncate text-[15px] font-bold">{m.name}</div><div className="truncate text-[13px] text-ink-mute">{m.area} · {m.distKm} km</div></div>
                <BadgeCheck className="h-5 w-5 shrink-0 text-brand-500" aria-label="Verified" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-7" aria-label="Recent activity">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-sans text-base font-bold">Recent</h2><Link href="/pass/activity" className="text-sm font-semibold text-brand-700">See all</Link></div>
        {mine.length ? (
          <div className="divide-y divide-line/70 overflow-hidden rounded-3xl bg-white shadow-card">
            {mine.map((t) => <TxRow key={t.id} tx={t} perspective="family" who={b} showWho={false} onClick={() => setOpen(t)} />)}
          </div>
        ) : <p className="rounded-3xl bg-white p-5 text-sm text-ink-mute shadow-card">Nothing yet. Payments and top-ups will show up here.</p>}
      </section>

      <Sheet phone open={req} onClose={() => setReq(false)} title={`Ask ${sponsor} for funds`}>
        <div className="text-center"><div className="num text-5xl font-bold">${amt}</div><div className="mt-1 font-semibold text-brand-700">about {ngn(amt)}</div></div>
        <div className="mt-5 flex justify-center gap-2">{[25, 50, 100, 150].map((v) => <button key={v} onClick={() => setAmt(v)} className={clsx("h-11 rounded-full border px-5 text-sm font-bold", amt === v ? "border-brand-500 bg-brand-50 text-brand-800" : "border-line-strong")}>${v}</button>)}</div>
        <div className="eyebrow mb-2 mt-6">What is it for?</div>
        <div className="flex flex-wrap gap-2">{REASONS.map((r) => <button key={r} onClick={() => setWhy(r)} className={clsx("h-10 rounded-full border px-4 text-sm font-semibold", why === r ? "border-ink bg-ink text-white" : "border-line-strong")}>{r}</button>)}</div>
        <Button size="lg" full className="mt-7" icon={<Send className="h-4 w-4" />} onClick={async () => { if (await requestTopUp(b.id, amt, why)) { setReq(false); toast(`Request sent to ${sponsor}`); } }}>Send request</Button>
      </Sheet>

      <Sheet phone open={switcher} onClose={() => setSwitcher(false)} title="Your passes">
        <div className="space-y-2">
          {beneficiaries.map((x) => (
            <button key={x.id} onClick={() => { setActivePassId(x.id); setSwitcher(false); }} className={clsx("flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left", activePassId === x.id ? "border-brand-500 bg-brand-50/60" : "border-line bg-white")}>
              <Avatar initials={x.initials} hue={x.hue} size={40} />
              <div className="min-w-0 flex-1"><div className="truncate font-bold">{x.fullName}</div><div className="text-xs text-ink-mute">from {x.sponsorName ?? "your sponsor"}</div></div>
            </button>
          ))}
        </div>
      </Sheet>
      <AccountSheet phone open={account} onClose={() => setAccount(false)} />
      <TxDetailSheet phone tx={open} who={b} perspective="family" onClose={() => setOpen(null)} />
    </div>
  );
}
