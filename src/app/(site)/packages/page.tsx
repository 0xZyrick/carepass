"use client";

import { useState } from "react";
import { ArrowRight, BadgeCheck, Check, Clock, MapPin, Minus, Users } from "lucide-react";
import clsx from "clsx";
import { Badge, Button, CatIcon, PkgIcon } from "@/components/ui/ui";
import { Chip, Segmented } from "@/components/ui/forms";
import { CareTimeline } from "@/components/CareTimeline";
import { PACKAGES, payableSteps, providersFor } from "@/lib/care";
import { CITIES, City } from "@/lib/data";
import { usd } from "@/lib/format";

export default function Packages() {
  const [id, setId] = useState(PACKAGES[0].id);
  const [city, setCity] = useState<City>("Lagos");
  const p = PACKAGES.find((x) => x.id === id)!;
  const provs = providersFor(p, city);

  return (
    <div className="container-x pb-20 pt-8 sm:pt-12">
      <div className="max-w-2xl">
        <div className="eyebrow mb-3">Care packages</div>
        <h1 className="text-[34px] font-bold sm:text-5xl">What each package covers, and who delivers it.</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">Every package has a defined scope, a typical price band and a fixed set of steps. Pick one to see the details.</p>
      </div>

      {/* Package picker */}
      <div className="no-scrollbar -mx-5 mt-8 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Care packages">
        {PACKAGES.map((x) => (
          <Chip key={x.id} on={id === x.id} onClick={() => setId(x.id)}>{x.name}</Chip>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-start">
        {/* Summary + steps */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <section className="card overflow-hidden">
            <div className="bg-gradient-to-br from-brand-800 to-brand-950 p-6 text-white">
              <PkgIcon id={p.icon} tone="dark" />
              <h2 className="mt-4 text-2xl font-bold">{p.name}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-white/70">{p.blurb}</p>
              <div className="num mt-5 text-3xl font-bold">{usd(p.price[0], 0)} – {usd(p.price[1], 0)}</div>
              <div className="text-xs font-medium text-white/55">Typical price band</div>
            </div>
            <dl className="grid grid-cols-3 divide-x divide-line text-center">
              {[[Clock, "Timeline", p.timeline], [Check, "Steps", String(payableSteps(p))], [Users, "For", p.who]].map(([I, l, v]) => {
                const Icon = I as typeof Clock;
                return (
                  <div key={l as string} className="px-2 py-4">
                    <Icon className="mx-auto h-4 w-4 text-brand-600" />
                    <dt className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{l as string}</dt>
                    <dd className="mt-0.5 text-[13px] font-bold leading-tight">{v as string}</dd>
                  </div>
                );
              })}
            </dl>
          </section>

          <section className="card p-6">
            <h3 className="mb-5 text-lg font-bold">The steps</h3>
            <CareTimeline steps={p.steps} done={0} />
            <p className="mt-5 rounded-xl bg-canvas p-3.5 text-[13px] leading-relaxed text-ink-mute">
              Funding is split evenly across {payableSteps(p)} steps and released one at a time as the provider confirms each.
            </p>
          </section>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <section className="card grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-bold"><span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-white"><Check className="h-3.5 w-3.5" strokeWidth={3.2} /></span>Included</h3>
              <ul className="space-y-2.5 text-sm text-ink-soft">{p.includes.map((x) => <li key={x} className="flex gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" strokeWidth={2.8} />{x}</li>)}</ul>
            </div>
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-bold"><span className="grid h-6 w-6 place-items-center rounded-full bg-canvas-3 text-ink-soft"><Minus className="h-3.5 w-3.5" strokeWidth={3.2} /></span>Not included</h3>
              <ul className="space-y-2.5 text-sm text-ink-mute">{p.excludes.map((x) => <li key={x} className="flex gap-2.5"><Minus className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" strokeWidth={2.8} />{x}</li>)}</ul>
            </div>
          </section>

          <section className="card p-6">
            <h3 className="mb-3 font-bold">What your family member brings</h3>
            <div className="flex flex-wrap gap-2">{p.bring.map((x) => <Badge key={x} tone="ink" className="px-3 py-1.5 text-[13px]">{x}</Badge>)}</div>
          </section>

          <section className="card p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-bold"><BadgeCheck className="h-5 w-5 text-brand-600" />Vetted providers</h3>
              <Segmented<City> label="City" value={city} onChange={setCity} options={CITIES.map((c) => ({ value: c, label: c }))} className="w-48" />
            </div>
            {provs.length === 0 && (
              <p className="rounded-xl bg-canvas p-4 text-sm text-ink-mute">No partner delivers this package in {city} yet. Try {CITIES.find((c) => c !== city)}.</p>
            )}
            <ul className="space-y-2.5">
              {provs.map((m) => (
                <li key={m.id} className="flex items-center gap-3.5 rounded-xl border border-line p-3.5">
                  <CatIcon type={m.type} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{m.name}</div>
                    <div className="flex items-center gap-1 text-[13px] text-ink-mute"><MapPin className="h-3.5 w-3.5 shrink-0" />{m.area}</div>
                  </div>
                  <span className={clsx("text-right text-[12.5px] font-semibold leading-tight", m.open ? "text-brand-700" : "text-ink-mute")}>{m.hours}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href={`/sponsor/care/new?package=${p.id}`} size="lg" className="sm:flex-1">Start {p.name.toLowerCase()} <ArrowRight className="h-5 w-5" /></Button>
            <Button href="/#how" size="lg" variant="outline">How it works</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
