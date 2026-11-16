"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BellRing, Plus, Snowflake, UserPlus, X } from "lucide-react";
import { Avatar, Button, Money, Progress, Stamp } from "@/components/ui/ui";
import { TxDetailSheet, TxRow } from "@/components/TxRow";
import { useStore } from "@/lib/store";
import { greet, ngn, usd } from "@/lib/format";
import { Tx } from "@/lib/data";

export default function Overview() {
  const { me, beneficiaries, txs, requests, totalCredit, settledThisMonth, settledCount, blockedCount, spent, dismissRequest } = useStore();
  const [open, setOpen] = useState<Tx | null>(null);
  const who = (id: string) => beneficiaries.find((b) => b.id === id);

  return (
    <div className="animate-fade-in">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink-mute">{greet()}, {me?.name.split(" ")[0]}</p>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-tight sm:text-4xl">Your family's care</h1>
        </div>
        <Button href="/sponsor/family/new" variant="outline" className="hidden sm:inline-flex" icon={<UserPlus className="h-4 w-4" />}>Add family</Button>
      </div>

      {requests.map((r) => {
        const b = who(r.beneficiaryId); if (!b) return null;
        return (
          <section key={r.id} className="relative mb-5 flex flex-wrap items-center gap-4 rounded-3xl border border-sun-400/50 bg-sun-50 p-5 pr-12" aria-label="Request for funds">
            <BellRing className="h-5 w-5 shrink-0 text-sun-600" />
            <div className="min-w-0 flex-1 leading-tight"><div className="font-bold">{b.name} asked for {usd(r.amount, 0)}</div><div className="text-sm text-ink-soft">“{r.note}”</div></div>
            <Button href={`/sponsor/fund?to=${b.id}&amount=${r.amount}`} size="sm">Send {usd(r.amount, 0)}</Button>
            <button onClick={() => dismissRequest(r.id)} aria-label="Dismiss request" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-sun-600 hover:bg-sun-100"><X className="h-4 w-4" /></button>
          </section>
        );
      })}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="receipt-wrap" aria-label="Total care credit">
            <div className="receipt p-6 pb-9 sm:p-8 sm:pb-10">
              <div className="flex items-center justify-between"><span className="eyebrow">Care credit available</span><Stamp tone="ok">Verified clinics only</Stamp></div>
              <Money amount={totalCredit} size="xl" className="mt-4" />
              <p className="mt-2 text-sm text-ink-mute">Across {beneficiaries.length} {beneficiaries.length === 1 ? "person" : "people"}</p>
              <div className="tear mt-6" />
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div><div className="font-semibold text-ink-mute">Paid to clinics this month</div><div className="num mt-1 text-xl font-bold">{usd(settledThisMonth)}</div><div className="text-xs text-ink-mute">{settledCount} {settledCount === 1 ? "payment" : "payments"} · {ngn(settledThisMonth)}</div></div>
                <Link href="/sponsor/activity?f=blocked" className="block"><div className="font-semibold text-ink-mute">Stopped by your rules</div><div className="num mt-1 text-xl font-bold">{blockedCount}</div><div className="text-xs text-ink-mute">Nothing was spent</div></Link>
              </div>
              <Button href="/sponsor/fund" size="lg" full className="mt-7" icon={<Plus className="h-5 w-5" />}>Send money for care</Button>
            </div>
          </section>

          <section aria-label="Family">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Family</h2>
              <Link href="/sponsor/family" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">Manage <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {beneficiaries.map((b) => {
                const s = spent(b.id);
                return (
                  <article key={b.id} className="card p-5">
                    <div className="flex items-center gap-3.5">
                      <Avatar initials={b.initials} hue={b.hue} size={48} />
                      <div className="min-w-0 flex-1"><div className="truncate font-bold">{b.fullName}</div><div className="truncate text-sm text-ink-mute">{b.relation} · {b.city}</div></div>
                      {b.frozen && <Stamp tone="wait"><Snowflake className="h-3 w-3" /> Paused</Stamp>}
                    </div>
                    <Money amount={b.balance} size="md" className="mt-5" />
                    <div className="mt-4">
                      <div className="mb-1.5 flex justify-between text-xs font-semibold text-ink-mute"><span>Monthly limit</span><span>{usd(s, 0)} of {usd(b.monthlyLimit, 0)}</span></div>
                      <Progress value={s} max={b.monthlyLimit} />
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2.5">
                      <Button href={`/sponsor/fund?to=${b.id}`} size="sm">Add money</Button>
                      <Button href={`/sponsor/family/${b.id}`} size="sm" variant="outline">Manage</Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <section className="card h-fit overflow-hidden" aria-label="Recent activity">
          <div className="flex items-center justify-between px-5 pb-2 pt-5">
            <h2 className="font-display text-xl font-semibold">Recent activity</h2>
            <Link href="/sponsor/activity" className="text-sm font-semibold text-brand-700 hover:underline">See all</Link>
          </div>
          <div className="divide-y divide-line/70 pb-1">
            {txs.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-mute">Payments and top-ups will show up here.</p>}
            {txs.slice(0, 6).map((t) => <TxRow key={t.id} tx={t} who={who(t.beneficiaryId)} onClick={() => setOpen(t)} />)}
          </div>
        </section>
      </div>
      <TxDetailSheet tx={open} who={open ? who(open.beneficiaryId) : undefined} onClose={() => setOpen(null)} />
    </div>
  );
}
