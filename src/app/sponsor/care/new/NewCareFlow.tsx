"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, Clock, MapPin, Minus, Phone, Plus, Wallet } from "lucide-react";
import clsx from "clsx";
import { Avatar, Badge, Button, CatIcon, Empty, PageHeader, PkgIcon, Row } from "@/components/ui/ui";
import { ChoiceCard, Stepper } from "@/components/ui/forms";
import { CareTimeline } from "@/components/CareTimeline";
import { useStore } from "@/lib/store";
import { CareEpisode, PACKAGES, payableSteps, pkgOf, providersFor } from "@/lib/care";
import { merchantOf } from "@/lib/data";
import { usd } from "@/lib/format";

const STEPS = ["Package", "Person", "Provider", "Review"];

export function NewCareFlow() {
  const q = useSearchParams();
  const { beneficiaries, startEpisode } = useStore();
  const qp = PACKAGES.find((p) => p.id === q.get("package"))?.id ?? "";
  const qw = beneficiaries.find((b) => b.id === q.get("for"))?.id ?? "";

  const [pkgId, setPkgId] = useState(qp);
  const [who, setWho] = useState(qw || beneficiaries[0]?.id || "");
  const [prov, setProv] = useState("");
  const [step, setStep] = useState(qp ? (qw ? 2 : 1) : 0);
  const [created, setCreated] = useState<CareEpisode | null>(null);
  const [busy, setBusy] = useState(false);

  const pkg = pkgId ? pkgOf(pkgId) : null;
  const person = beneficiaries.find((b) => b.id === who);
  const options = pkg && person ? providersFor(pkg, person.city) : [];
  const nearest = options.length ? options.reduce((a, b) => (b.distKm < a.distKm ? b : a)).id : "";
  const provider = prov ? merchantOf(prov) : undefined;

  const canNext = [!!pkg, !!person, !!provider, true][step];

  function go(n: number) { setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function submit() {
    if (!pkg || !person || !provider) return;
    setBusy(true);
    setTimeout(() => { setCreated(startEpisode(person.id, pkg.id, provider.id)); setBusy(false); window.scrollTo({ top: 0 }); }, 600);
  }

  /* ---------- Success ---------- */
  if (created && pkg && person && provider)
    return (
      <div className="mx-auto max-w-xl animate-fade-up pt-4 text-center sm:pt-10">
        <span className="mx-auto grid h-16 w-16 animate-pop place-items-center rounded-full bg-brand-600 text-white shadow-glow"><Check className="h-8 w-8" strokeWidth={3} /></span>
        <h1 className="mt-6 text-[30px] font-bold sm:text-4xl">Care started for {person.name}</h1>
        <p className="mx-auto mt-2 max-w-md text-ink-mute">{pkg.name} at {provider.name}. Here’s what happens next.</p>
        <ol className="card mt-8 divide-y divide-line text-left">
          {[
            ["Fund the package", "Money is held and only released as steps are confirmed.", Wallet],
            [`${person.name} sends documents`, "ID or a referral letter, visible to the provider only.", Phone],
            ["The provider confirms each visit", "With the family’s visit code. You’ll see every confirmation.", BadgeCheck],
          ].map(([t, d, I], i) => {
            const Icon = I as typeof Wallet;
            return (
              <li key={t as string} className="flex items-start gap-3.5 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon className="h-[18px] w-[18px]" /></span>
                <div><div className="text-sm font-bold">{i + 1}. {t as string}</div><div className="text-[13px] text-ink-mute">{d as string}</div></div>
              </li>
            );
          })}
        </ol>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button href={`/sponsor/fund?care=${created.id}`} size="lg" icon={<Wallet className="h-5 w-5" />}>Fund this package</Button>
          <Button href={`/sponsor/care/${created.id}`} size="lg" variant="outline">View care</Button>
        </div>
      </div>
    );

  return (
    <div>
      <PageHeader title="Start a care package" sub="Four quick steps. You can fund it right after." />
      <Stepper steps={STEPS} current={step} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {/* ---------- 1. Package ---------- */}
          {step === 0 && (
            <section className="animate-fade-in" aria-label="Choose a package">
              <h2 className="mb-1 text-xl font-bold">What kind of care?</h2>
              <p className="mb-5 text-sm text-ink-mute">Choose the closest fit. Exclusions are listed so there are no surprises.</p>
              <div role="radiogroup" aria-label="Care package" className="space-y-3">
                {PACKAGES.map((p) => (
                  <ChoiceCard key={p.id} selected={pkgId === p.id} onSelect={() => { setPkgId(p.id); setProv(""); }}>
                    <div className="flex items-start gap-3.5 pr-8">
                      <PkgIcon id={p.icon} />
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-bold">{p.name}</div>
                        <p className="mt-0.5 text-sm text-ink-mute">{p.blurb}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold">
                          <span className="num">{usd(p.price[0], 0)} – {usd(p.price[1], 0)}</span>
                          <span className="flex items-center gap-1 text-ink-mute"><Clock className="h-3.5 w-3.5" />{p.timeline}</span>
                        </div>
                      </div>
                    </div>
                    {pkgId === p.id && (
                      <div className="mt-4 grid grid-cols-1 animate-fade-in gap-4 border-t border-line pt-4 sm:grid-cols-2">
                        <ul className="space-y-2 text-[13px] text-ink-soft">{p.includes.map((x) => <li key={x} className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" strokeWidth={3} />{x}</li>)}</ul>
                        <ul className="space-y-2 text-[13px] text-ink-mute">{p.excludes.map((x) => <li key={x} className="flex gap-2"><Minus className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={3} />{x}</li>)}</ul>
                      </div>
                    )}
                  </ChoiceCard>
                ))}
              </div>
            </section>
          )}

          {/* ---------- 2. Person ---------- */}
          {step === 1 && (
            <section className="animate-fade-in" aria-label="Choose a person">
              <h2 className="mb-1 text-xl font-bold">Who is the care for?</h2>
              <p className="mb-5 text-sm text-ink-mute">We use their city to show providers nearby.</p>
              <div role="radiogroup" aria-label="Family member" className="space-y-3">
                {beneficiaries.map((b) => (
                  <ChoiceCard key={b.id} selected={who === b.id} onSelect={() => { setWho(b.id); setProv(""); }}>
                    <div className="flex items-center gap-3.5 pr-8">
                      <Avatar initials={b.initials} hue={b.hue} size={46} />
                      <div className="min-w-0"><div className="truncate font-bold">{b.fullName}</div><div className="text-sm text-ink-mute">{b.relation} · {b.city}</div></div>
                    </div>
                  </ChoiceCard>
                ))}
                <Link href="/sponsor/family/new" className="flex items-center gap-3.5 rounded-2xl border-2 border-dashed border-line-strong p-4 text-sm font-semibold text-brand-700 transition hover:bg-white">
                  <span className="grid h-[46px] w-[46px] place-items-center rounded-full bg-brand-50"><Plus className="h-5 w-5" /></span>Add someone new
                </Link>
              </div>
            </section>
          )}

          {/* ---------- 3. Provider ---------- */}
          {step === 2 && pkg && (
            <section className="animate-fade-in" aria-label="Choose a provider">
              <h2 className="mb-1 text-xl font-bold">Choose a vetted provider in {person?.city}</h2>
              <p className="mb-5 text-sm text-ink-mute">Verified partners that deliver the {pkg.name.toLowerCase()}.</p>
              {options.length === 0 ? (
                <div className="card">
                  <Empty icon={<MapPin />} title={`No partner in ${person?.city} yet`} sub="Try a different package, or choose someone based in another city."
                    action={<Button variant="outline" onClick={() => go(0)}>Change package</Button>} />
                </div>
              ) : (
                <div role="radiogroup" aria-label="Provider" className="space-y-3">
                  {options.map((m) => (
                    <ChoiceCard key={m.id} selected={prov === m.id} onSelect={() => setProv(m.id)}>
                      <div className="flex items-start gap-3.5 pr-8">
                        <CatIcon type={m.type} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-bold">{m.name}</span>
                            <BadgeCheck className="h-4 w-4 text-brand-600" aria-label="Verified" />
                            {m.id === nearest && options.length > 1 && <Badge tone="brand">Nearest</Badge>}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-sm text-ink-mute"><MapPin className="h-3.5 w-3.5" />{m.area} · {m.distKm} km</div>
                          <div className={clsx("mt-1 text-[13px] font-semibold", m.open ? "text-brand-700" : "text-ink-mute")}>{m.hours}</div>
                          <p className="mt-2 text-[13px] leading-relaxed text-ink-mute">{m.blurb}</p>
                        </div>
                      </div>
                    </ChoiceCard>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ---------- 4. Review ---------- */}
          {step === 3 && pkg && person && provider && (
            <section className="animate-fade-in" aria-label="Review">
              <h2 className="mb-1 text-xl font-bold">Review and start</h2>
              <p className="mb-5 text-sm text-ink-mute">You can change anything before it begins.</p>
              <div className="card divide-y divide-line">
                {[
                  ["Package", pkg.name, () => go(0), <PkgIcon key="a" id={pkg.icon} size={40} />],
                  ["For", `${person.fullName} · ${person.city}`, () => go(1), <Avatar key="b" initials={person.initials} hue={person.hue} size={40} />],
                  ["Provider", `${provider.name}, ${provider.area}`, () => go(2), <CatIcon key="c" type={provider.type} size={40} />],
                ].map(([l, v, fn, icon]) => (
                  <div key={l as string} className="flex items-center gap-3.5 p-4">
                    {icon as React.ReactNode}
                    <div className="min-w-0 flex-1"><div className="eyebrow">{l as string}</div><div className="truncate font-semibold">{v as string}</div></div>
                    <button onClick={fn as () => void} className="h-9 rounded-lg px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">Change</button>
                  </div>
                ))}
              </div>
              <div className="card mt-4 p-5">
                <h3 className="mb-4 font-bold">The steps</h3>
                <CareTimeline steps={pkg.steps} done={1} />
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-ink-mute">Starting a package costs nothing. Money only moves when you fund it, and is released per confirmed step.</p>
            </section>
          )}

          {/* ---------- Actions ---------- */}
          <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-line bg-white/90 px-4 pb-safe pt-3 backdrop-blur-xl lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            {step > 0 && <Button variant="outline" size="lg" onClick={() => go(step - 1)} icon={<ArrowLeft className="h-5 w-5" />} className="lg:min-w-32">Back</Button>}
            {step < 3 ? (
              <Button size="lg" className="flex-1 lg:flex-none lg:min-w-48" disabled={!canNext} onClick={() => go(step + 1)}>Continue <ArrowRight className="h-5 w-5" /></Button>
            ) : (
              <Button size="lg" className="flex-1 lg:flex-none lg:min-w-48" loading={busy} onClick={submit}>Start care</Button>
            )}
          </div>
        </div>

        {/* ---------- Summary ---------- */}
        <aside className="hidden lg:block">
          <div className="card sticky top-8 p-5">
            <div className="eyebrow mb-4">Your selection</div>
            {pkg ? (
              <>
                <div className="flex items-center gap-3"><PkgIcon id={pkg.icon} size={40} /><div><div className="font-bold leading-tight">{pkg.name}</div><div className="text-[13px] text-ink-mute">{pkg.timeline} · {payableSteps(pkg)} steps</div></div></div>
                <div className="mt-4 divide-y divide-line border-t border-line">
                  <Row label="Typical price" value={`${usd(pkg.price[0], 0)} – ${usd(pkg.price[1], 0)}`} />
                  <Row label="For" value={person?.name ?? "—"} mute={!person} />
                  <Row label="Provider" value={provider?.name ?? "—"} mute={!provider} />
                </div>
              </>
            ) : (
              <p className="text-sm text-ink-mute">Choose a package to see its details here.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
