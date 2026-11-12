"use client";

import { useParams } from "next/navigation";
import { Calendar, ClipboardList, EyeOff, MapPin, Phone, Receipt, Wallet } from "lucide-react";
import { Avatar, Badge, BackLink, Button, CatIcon, Empty, Progress, Row } from "@/components/ui/ui";
import { CareTimeline } from "@/components/CareTimeline";
import { STATE_META } from "@/components/EpisodeCard";
import { useStore } from "@/lib/store";
import { held, isClosed, pkgOf, progressPct, released, stateOf, stepPayout, when } from "@/lib/care";
import { merchantOf } from "@/lib/data";
import { usd } from "@/lib/format";

export default function CareDetail() {
  const { id } = useParams<{ id: string }>();
  const { episodes, beneficiaries } = useStore();
  const e = episodes.find((x) => x.id === id);

  if (!e)
    return (
      <div className="card mx-auto mt-6 max-w-lg">
        <Empty icon={<ClipboardList />} title="We couldn’t find that care package" sub="It may have been removed, or the link is out of date."
          action={<Button href="/sponsor/care">Back to care</Button>} />
      </div>
    );

  const p = pkgOf(e.packageId), b = beneficiaries.find((x) => x.id === e.beneficiaryId), m = merchantOf(e.providerId);
  const st = stateOf(e), meta = STATE_META[st], closed = isClosed(e);
  const payout = stepPayout(e);

  return (
    <div className="animate-fade-in">
      <BackLink href="/sponsor/care">All care</BackLink>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 items-center gap-4">
          {b && <Avatar initials={b.initials} hue={b.hue} size={56} />}
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2"><Badge tone={meta.tone} dot>{meta.label}</Badge><span className="text-[13px] text-ink-mute">Started {when(e.startedDaysAgo).toLowerCase()}</span></div>
            <h1 className="text-[28px] font-bold leading-tight sm:text-[34px]">{p.name}</h1>
            <p className="text-ink-mute">for {b?.fullName} · {b?.city}</p>
          </div>
        </div>
        {!closed && <Button href={`/sponsor/fund?care=${e.id}`} icon={<Wallet className="h-[18px] w-[18px]" />} className="w-full sm:w-auto">{e.funded > 0 ? "Add funds" : "Fund this package"}</Button>}
      </div>

      {/* Progress summary */}
      <section className="card mt-6 p-5 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute">{closed ? "Status" : "Next step"}</div>
            <div className="mt-1 text-xl font-bold sm:text-2xl">{closed ? "All steps confirmed" : p.steps[e.done]}</div>
            <div className="mt-0.5 text-sm text-ink-mute">{st === "needs-funding" ? "Fund the package so the provider can begin." : st === "awaiting-intake" ? `Waiting for ${b?.name} to send documents.` : closed ? "The package is complete." : `Waiting for ${m?.name} to confirm.`}</div>
          </div>
          <div className="num text-3xl font-bold text-brand-700">{progressPct(e)}%</div>
        </div>
        <Progress value={e.done} max={p.steps.length} className="mt-4 h-2.5" label="Care progress" />
        <div className="mt-2 flex justify-between text-xs font-medium text-ink-mute"><span>{Math.min(e.done, p.steps.length)} of {p.steps.length} steps confirmed</span><span>{p.timeline}</span></div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* Timeline */}
        <section className="card p-5 sm:p-6">
          <h2 className="mb-5 text-lg font-bold">Steps &amp; payouts</h2>
          <CareTimeline steps={p.steps} done={e.done} confirms={e.confirms} payout={e.funded > 0 ? payout : undefined} />
          <p className="mt-5 flex items-start gap-2.5 rounded-xl bg-canvas p-3.5 text-[13px] leading-relaxed text-ink-mute">
            <EyeOff className="mt-0.5 h-4 w-4 shrink-0" />
            You see progress only. Medical details stay between {b?.name} and the provider.
          </p>
        </section>

        <div className="space-y-6">
          {/* Funds */}
          <section className="card p-5 sm:p-6">
            <h2 className="mb-1 text-lg font-bold">Funds</h2>
            <div className="divide-y divide-line">
              <Row label="Funded" value={usd(e.funded)} />
              <Row label="Paid to provider" value={usd(released(e))} />
              <Row label="Held for next steps" value={usd(held(e))} />
            </div>
            {e.funded > 0 && <div className="mt-2 text-xs text-ink-mute">Each confirmed step releases {usd(payout)}.</div>}
            {e.fundings.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <div className="eyebrow mb-3">Payments</div>
                <ul className="space-y-3">
                  {e.fundings.map((f) => (
                    <li key={f.id} className="flex items-center gap-3 text-sm">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink-soft"><Receipt className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1"><div className="font-semibold">{usd(f.amount)}</div><div className="truncate text-xs text-ink-mute">{f.method} · {when(f.daysAgo)} · {f.id}</div></div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Provider */}
          {m && (
            <section className="card p-5 sm:p-6">
              <h2 className="mb-4 text-lg font-bold">Provider</h2>
              <div className="flex items-start gap-3.5">
                <CatIcon type={m.type} />
                <div className="min-w-0">
                  <div className="font-bold">{m.name}</div>
                  <div className="flex items-center gap-1 text-sm text-ink-mute"><MapPin className="h-3.5 w-3.5" />{m.area}, {m.city}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-sm text-ink-mute"><Calendar className="h-3.5 w-3.5" />{m.hours}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <Button variant="outline" size="sm" href={`tel:${m.phone.replace(/\s/g, "")}`} icon={<Phone className="h-4 w-4" />}>Call</Button>
                <Button variant="outline" size="sm" external href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${m.name} ${m.area} ${m.city}`)}`} icon={<MapPin className="h-4 w-4" />}>Directions</Button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
