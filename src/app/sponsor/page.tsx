"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BellRing, BadgeCheck, Plus, ShieldCheck, ShieldX, Snowflake, UserPlus, X } from "lucide-react";
import { Avatar, Badge, Button, Progress } from "@/components/ui/ui";
import { TxDetailSheet, TxRow } from "@/components/TxRow";
import { useStore } from "@/lib/store";
import { FX_RATE, greet, ngn, usd } from "@/lib/format";
import { Tx } from "@/lib/data";

const HISTORY = [["Jun", 120], ["Jul", 95], ["Aug", 140], ["Sep", 110], ["Oct", 162]] as const;

export default function Overview() {
  const { me, beneficiaries, txs, requests, totalCredit, settledThisMonth, settledCount, blockedCount, spent, dismissRequest } = useStore();
  const [open, setOpen] = useState<Tx | null>(null);
  const bars = [...HISTORY.map(([m, v]) => [m, v] as [string, number]), ["Nov", settledThisMonth] as [string, number]];
  const max = Math.max(...bars.map((b) => b[1])) * 1.1;
  const who = (id: string) => beneficiaries.find((b) => b.id === id);

  return (
    <div className="animate-fade-in">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink-mute">{greet()}, {me?.name.split(" ")[0]} 👋</p>
          <h1 className="mt-1 text-[30px] font-extrabold leading-tight sm:text-4xl">Your family's care</h1>
        </div>
        <Button href="/sponsor/family/new" variant="outline" className="hidden sm:inline-flex" icon={<UserPlus className="h-4 w-4" />}>Add family</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* Balance hero */}
          <section className="relative overflow-hidden rounded-[32px] bg-brand-900 p-6 text-white sm:p-8" aria-label="Total care credit">
            <div className="grain absolute inset-0" />
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="eyebrow !text-brand-200">Total care credit</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">$1 ≈ ₦{FX_RATE.toLocaleString()}</span>
              </div>
              <div className="num mt-3 text-[52px] font-extrabold leading-none sm:text-[64px]">{usd(totalCredit)}</div>
              <div className="mt-2 text-brand-200">≈ {ngn(totalCredit)} across {beneficiaries.length} {beneficiaries.length === 1 ? "person" : "people"}</div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button href="/sponsor/fund" variant="light" size="lg" icon={<Plus className="h-5 w-5" />} className="flex-1 sm:flex-none">Fund care</Button>
                <Button href="/sponsor/activity" size="lg" className="flex-1 !bg-white/10 hover:!bg-white/20 sm:flex-none">View activity</Button>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/[0.07] p-4">
                  <div className="text-xs font-semibold text-white/55">Settled this month</div>
                  <div className="num mt-1 text-2xl font-bold">{usd(settledThisMonth)}</div>
                  <div className="text-xs text-white/50">{settledCount} clinic payments</div>
                </div>
                <Link href="/sponsor/activity?f=blocked" className="rounded-2xl bg-white/[0.07] p-4 transition hover:bg-white/10">
                  <div className="text-xs font-semibold text-white/55">Blocked attempts</div>
                  <div className="num mt-1 text-2xl font-bold">{blockedCount}</div>
                  <div className="text-xs text-white/50">Non-care destinations rejected</div>
                </Link>
              </div>
            </div>
          </section>

          {/* Family */}
          <section aria-label="Family">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-bold">Family passes</h2>
              <Link href="/sponsor/family" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">Manage <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {beneficiaries.map((b) => {
                const s = spent(b.id);
                return (
                  <article key={b.id} className="card p-5">
                    <div className="flex items-center gap-3.5">
                      <Avatar initials={b.initials} hue={b.hue} size={48} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold">{b.fullName}</div>
                        <div className="truncate text-sm text-ink-mute">{b.relation} · {b.city}</div>
                      </div>
                      {b.frozen && <Badge tone="iris"><Snowflake className="h-3 w-3" /> Frozen</Badge>}
                    </div>
                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <div className="num text-[30px] font-extrabold leading-none">{usd(b.balance)}</div>
                        <div className="mt-1 text-[13px] text-ink-mute">{ngn(b.balance)}</div>
                      </div>
                      <div className="text-right text-xs text-ink-mute">Last active<br /><span className="font-semibold text-ink-soft">{b.lastActive}</span></div>
                    </div>
                    <div className="mt-5">
                      <div className="mb-1.5 flex justify-between text-xs font-semibold text-ink-mute">
                        <span>Monthly limit</span><span>{usd(s, 0)} / {usd(b.monthlyLimit, 0)}</span>
                      </div>
                      <Progress value={s} max={b.monthlyLimit} />
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2.5">
                      <Button href={`/sponsor/fund?to=${b.id}`} size="sm">Top up</Button>
                      <Button href={`/sponsor/family/${b.id}`} size="sm" variant="outline">Manage</Button>
                    </div>
                  </article>
                );
              })}
              <Link href="/sponsor/family/new" className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-line-strong p-5 text-ink-mute transition hover:border-brand-500 hover:bg-brand-50/50 hover:text-brand-700">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-canvas-2"><UserPlus className="h-5 w-5" /></span>
                <span className="font-bold">Add a family member</span>
              </Link>
            </div>
          </section>

          {/* Chart */}
          <section className="card p-5 sm:p-6" aria-label="Care spending history">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">Care spending</h2>
                <p className="text-sm text-ink-mute">Settled at clinics, last 6 months</p>
              </div>
              <Badge tone="ink">USD</Badge>
            </div>
            <div className="mt-6 flex h-44 items-end gap-3 sm:gap-5">
              {bars.map(([m, v], i) => (
                <div key={m} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="num text-xs font-bold text-ink-soft">${Math.round(v)}</span>
                  <div className={`w-full rounded-t-xl transition-all duration-700 ${i === bars.length - 1 ? "bg-brand-500" : "bg-brand-100"}`} style={{ height: `${(v / max) * 100}%` }} />
                  <span className="text-xs font-semibold text-ink-mute">{m}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          {requests.map((r) => {
            const b = who(r.beneficiaryId)!;
            return (
              <section key={r.id} className="relative overflow-hidden rounded-3xl border border-sun-400/50 bg-sun-50 p-5" aria-label="Top-up request">
                <div className="flex items-center gap-2 text-sm font-bold text-sun-600"><BellRing className="h-4 w-4" /> Top-up request</div>
                <button onClick={() => dismissRequest(r.id)} aria-label="Dismiss request" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-sun-600 hover:bg-sun-100"><X className="h-4 w-4" /></button>
                <div className="mt-3 flex items-center gap-3">
                  <Avatar initials={b.initials} hue={b.hue} size={40} />
                  <div className="leading-tight"><div className="font-bold">{b.name} asked for {usd(r.amount, 0)}</div><div className="text-sm text-ink-soft">“{r.note}”</div></div>
                </div>
                <Button href={`/sponsor/fund?to=${b.id}&amount=${r.amount}`} full size="sm" className="mt-4">Fund {usd(r.amount, 0)} now</Button>
              </section>
            );
          })}

          <section className="card p-5" aria-label="Guardrail status">
            <div className="flex items-center gap-3">
              <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700"><ShieldCheck className="h-5 w-5" /><span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-brand-500 ring-2 ring-white" /></span>
              <div className="leading-tight"><div className="font-bold">Guardrails active</div><div className="text-sm text-ink-mute">All passes protected</div></div>
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              {["Verified merchants only", "Monthly limits enforced", "Per-payment caps on"].map((t) => (
                <li key={t} className="flex items-center gap-2.5 font-medium text-ink-soft"><BadgeCheck className="h-4 w-4 text-brand-500" />{t}</li>
              ))}
              <li className="flex items-center gap-2.5 font-medium text-ink-soft"><ShieldX className="h-4 w-4 text-rose-500" />{blockedCount} attempts blocked this month</li>
            </ul>
            <Button href="/guardrails" variant="soft" size="sm" full className="mt-4">Test the guardrails</Button>
          </section>

          <section className="card overflow-hidden" aria-label="Recent activity">
            <div className="flex items-center justify-between px-5 pb-2 pt-5">
              <h2 className="text-lg font-bold">Recent activity</h2>
              <Link href="/sponsor/activity" className="text-sm font-semibold text-brand-700 hover:underline">See all</Link>
            </div>
            <div className="divide-y divide-line/70 pb-1">
              {txs.slice(0, 5).map((t) => <TxRow key={t.id} tx={t} who={who(t.beneficiaryId)} onClick={() => setOpen(t)} />)}
            </div>
          </section>
        </div>
      </div>
      <TxDetailSheet tx={open} who={open ? who(open.beneficiaryId) : undefined} onClose={() => setOpen(null)} />
    </div>
  );
}
