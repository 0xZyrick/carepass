"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, CheckCircle2, ClipboardList, FileText, Plus, Smartphone, Sparkles, UserPlus, Wallet } from "lucide-react";
import clsx from "clsx";
import { Avatar, Badge, Button, IconTile, SectionTitle } from "@/components/ui/ui";
import { EpisodeCard } from "@/components/EpisodeCard";
import { useStore } from "@/lib/store";
import { EventKind, held, isClosed, pkgOf, released, stateOf, when } from "@/lib/care";
import { greet, usd } from "@/lib/format";
import { SPONSOR } from "@/lib/data";

const EVENT_ICON: Record<EventKind, typeof Wallet> = {
  started: ClipboardList, funded: Wallet, docs: FileText, confirmed: BadgeCheck, completed: CheckCircle2,
};
const EVENT_TONE: Record<EventKind, "brand" | "sun" | "iris" | "ink"> = {
  started: "ink", funded: "sun", docs: "iris", confirmed: "brand", completed: "brand",
};

export default function Overview() {
  const { episodes, beneficiaries, events } = useStore();
  const active = episodes.filter((e) => !isClosed(e));
  const heldTotal = episodes.reduce((s, e) => s + held(e), 0);
  const paidTotal = episodes.reduce((s, e) => s + released(e), 0);
  const fundedTotal = heldTotal + paidTotal;
  const paidPct = fundedTotal > 0 ? (paidTotal / fundedTotal) * 100 : 0;
  const attention = active.filter((e) => ["needs-funding", "awaiting-intake"].includes(stateOf(e)));
  const who = (id: string) => beneficiaries.find((b) => b.id === id);

  return (
    <div className="animate-fade-in">
      {/* Greeting */}
      <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-mute">{greet()}, {SPONSOR.first}</p>
          <h1 className="mt-1 text-[28px] font-bold sm:text-[36px]">Your family’s care</h1>
        </div>
        <div className="hidden sm:block"><Button href="/sponsor/care/new" icon={<Plus className="h-[18px] w-[18px]" />}>Start a package</Button></div>
      </div>

      {/* Money summary */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 to-brand-950 p-5 text-white shadow-raise sm:p-7">
        <div className="grain pointer-events-none absolute inset-0" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[13px] font-semibold text-brand-200">Total funded</div>
              <div className="num mt-1 text-[40px] font-bold leading-none sm:text-5xl">{usd(fundedTotal)}</div>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button href="/sponsor/fund" variant="light" className="flex-1 sm:flex-none" icon={<Wallet className="h-4 w-4" />}>Fund care</Button>
              <Button href="/sponsor/care/new" variant="glass" className="flex-1 sm:hidden" icon={<Plus className="h-4 w-4" />}>New package</Button>
            </div>
          </div>

          <div className="mt-6 flex h-2.5 overflow-hidden rounded-full bg-white/15" role="img" aria-label={`${Math.round(paidPct)}% of funded money paid to providers`}>
            <div className="h-full rounded-full bg-brand-300 transition-all duration-700" style={{ width: `${paidPct}%` }} />
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-3">
            {[
              ["Paid to providers", usd(paidTotal), "bg-brand-300"],
              ["Held for next steps", usd(heldTotal), "bg-white/30"],
              ["Care in progress", String(active.length), ""],
            ].map(([l, v, dot]) => (
              <div key={l}>
                <dt className="flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-200 sm:text-[13px]">{dot && <span className={clsx("h-2 w-2 rounded-full", dot)} />}{l}</dt>
                <dd className="num mt-1 text-lg font-bold sm:text-2xl">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Needs attention */}
      {attention.length > 0 && (
        <section className="mt-6" aria-label="Needs your attention">
          {attention.map((e) => {
            const st = stateOf(e), b = who(e.beneficiaryId), p = pkgOf(e.packageId);
            return (
              <Link key={e.id} href={st === "needs-funding" ? `/sponsor/fund?care=${e.id}` : `/sponsor/care/${e.id}`}
                className="mb-2 flex items-center gap-3.5 rounded-2xl border border-sun-100 bg-sun-50/70 p-4 transition hover:bg-sun-50">
                <IconTile tone="sun" size={40}><Sparkles className="h-5 w-5" /></IconTile>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">{st === "needs-funding" ? `Fund ${p.name.toLowerCase()} for ${b?.name}` : `Waiting for ${b?.name}’s documents`}</div>
                  <div className="text-[13px] text-sun-700">{st === "needs-funding" ? "The provider can begin once it’s funded." : "We’ll update you as soon as the provider confirms intake."}</div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-sun-700" />
              </Link>
            );
          })}
        </section>
      )}

      <div className="mt-9 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div>
          <SectionTitle action={episodes.length > 0 && <Link href="/sponsor/care" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>}>In progress</SectionTitle>
          {active.length === 0 ? (
            <div className="card p-6 sm:p-8">
              <div className="mx-auto max-w-md text-center">
                <IconTile size={52} className="mx-auto"><ClipboardList className="h-6 w-6" /></IconTile>
                <h3 className="mt-4 text-lg font-bold">Nothing in progress</h3>
                <p className="mt-1 text-sm text-ink-mute">Start a care package for someone in your family and follow every step from here.</p>
                <Button href="/sponsor/care/new" className="mt-5">Start a care package</Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {active.map((e) => <EpisodeCard key={e.id} e={e} who={who(e.beneficiaryId)} />)}
            </div>
          )}

          {/* Activity */}
          <SectionTitle className="mt-9">Recent activity</SectionTitle>
          <div className="card divide-y divide-line">
            {events.length === 0 && <p className="p-5 text-sm text-ink-mute">Activity will appear here as care progresses.</p>}
            {events.slice(0, 6).map((ev) => {
              const I = EVENT_ICON[ev.kind];
              return (
                <div key={ev.id} className="flex items-start gap-3.5 p-4">
                  <IconTile tone={EVENT_TONE[ev.kind]} size={38}><I className="h-[18px] w-[18px]" /></IconTile>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{ev.title}</div>
                    {ev.detail && <div className="text-[13px] text-ink-mute">{ev.detail}</div>}
                  </div>
                  <span className="shrink-0 pt-0.5 text-xs font-medium text-ink-faint">{when(ev.daysAgo)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side column */}
        <aside className="space-y-6">
          <section>
            <SectionTitle action={<Link href="/sponsor/family" className="text-sm font-semibold text-brand-700 hover:underline">Manage</Link>}>Family</SectionTitle>
            <div className="card divide-y divide-line">
              {beneficiaries.map((b) => {
                const n = active.filter((e) => e.beneficiaryId === b.id).length;
                return (
                  <Link key={b.id} href={`/sponsor/care/new?for=${b.id}`} className="flex items-center gap-3 p-4 transition hover:bg-canvas/60">
                    <Avatar initials={b.initials} hue={b.hue} size={42} />
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{b.fullName}</div><div className="text-[13px] text-ink-mute">{b.relation} · {b.city}</div></div>
                    <Badge tone={n ? "sun" : "ink"}>{n ? `${n} active` : "No care"}</Badge>
                  </Link>
                );
              })}
              <Link href="/sponsor/family/new" className="flex items-center gap-3 p-4 text-sm font-semibold text-brand-700 transition hover:bg-canvas/60">
                <span className="grid h-[42px] w-[42px] place-items-center rounded-full border-2 border-dashed border-line-strong"><UserPlus className="h-[18px] w-[18px]" /></span>Add family member
              </Link>
            </div>
          </section>

          <Link href="/pass" className="card card-hover flex items-center gap-4 p-5">
            <IconTile tone="iris" size={46}><Smartphone className="h-5 w-5" /></IconTile>
            <div className="min-w-0 flex-1">
              <div className="font-bold">Preview the family pass</div>
              <div className="text-[13px] text-ink-mute">See exactly what your relative sees on their phone.</div>
            </div>
            <ArrowRight className="h-4 w-4 text-ink-faint" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
