"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import clsx from "clsx";
import { Button, CatIcon, Empty } from "@/components/ui/ui";
import { useStore } from "@/lib/store";
import { CATEGORIES, type Category } from "@/lib/data";
import { PACKAGES, packageTotal } from "@/lib/care";
import { usd } from "@/lib/format";

/** Pick a package, then a verified provider in the family's city for each kind of care. */
export function NewPlan({ passId, back }: { passId: string; back: string }) {
  const router = useRouter();
  const { beneficiaries, merchants, startPlan } = useStore();
  const b = beneficiaries.find((x) => x.id === passId);
  const [pkgId, setPkgId] = useState(PACKAGES[0].id);
  const [pick, setPick] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  if (!b) return <Empty icon={<Check />} title="Pass not found" sub="We couldn't find this pass." />;

  const pkg = PACKAGES.find((p) => p.id === pkgId)!;
  const cats = [...new Set(pkg.steps.map((s) => s.category))] as Category[];
  const real = merchants.filter((m) => /^CL-/.test(m.id) && m.city === b.city);
  const ready = cats.every((c) => pick[c]);

  async function go() {
    setBusy(true);
    const ok = await startPlan(b!.id, pkg.id, pick);
    setBusy(false);
    if (ok) router.push(back);
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in pb-16">
      <Link href={back} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Plan care for {b.name}</h1>
      <p className="mt-2 text-ink-mute">Choose a package and where {b.name} will go in {b.city}. Each step is paid only when the provider confirms the visit.</p>

      <div className="mt-7 space-y-3" role="radiogroup" aria-label="Care package">
        {PACKAGES.map((p) => (
          <button key={p.id} role="radio" aria-checked={pkgId === p.id} onClick={() => { setPkgId(p.id); setPick({}); }}
            className={clsx("flex w-full items-start gap-4 rounded-3xl border-2 bg-white p-4 text-left transition sm:p-5", pkgId === p.id ? "border-brand-500 ring-4 ring-brand-500/10" : "border-line hover:border-line-strong")}>
            <div className="min-w-0 flex-1">
              <div className="font-bold">{p.title}</div>
              <div className="text-sm text-ink-mute">{p.blurb}</div>
              <div className="mt-1.5 text-[13px] text-ink-soft">{p.steps.length} steps · about {usd(packageTotal(p) / 100, 0)}</div>
            </div>
            <span className={clsx("mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2", pkgId === p.id ? "border-brand-500 bg-brand-500 text-white" : "border-line-strong")}>{pkgId === p.id && <Check className="h-3.5 w-3.5" strokeWidth={3.5} />}</span>
          </button>
        ))}
      </div>

      <h2 className="mt-9 font-display text-xl font-semibold">Where to go</h2>
      <div className="mt-3 space-y-5">
        {cats.map((c) => {
          const label = CATEGORIES.find((x) => x.id === c)!;
          const list = real.filter((m) => m.type === c);
          return (
            <fieldset key={c}>
              <legend className="text-sm font-semibold">{label.label} <span className="font-normal text-ink-mute">· {pkg.steps.filter((s) => s.category === c).map((s) => s.title).join(", ")}</span></legend>
              {list.length === 0 ? <p className="mt-2 rounded-2xl bg-sun-50 px-4 py-3 text-[13px] font-medium text-sun-600">No verified {label.plural.toLowerCase()} in {b.city} have joined yet.</p> : (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {list.map((m) => (
                    <button key={m.id} type="button" onClick={() => setPick((x) => ({ ...x, [c]: m.id }))} aria-pressed={pick[c] === m.id}
                      className={clsx("flex items-center gap-3 rounded-2xl border-2 bg-white p-3.5 text-left", pick[c] === m.id ? "border-brand-500" : "border-line hover:border-line-strong")}>
                      <CatIcon type={m.type} />
                      <div className="min-w-0 flex-1"><div className="truncate font-semibold">{m.name}</div><div className="truncate text-[13px] text-ink-mute">{m.area}</div></div>
                      {pick[c] === m.id && <Check className="h-5 w-5 text-brand-600" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              )}
            </fieldset>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl bg-canvas-2 p-4 text-sm text-ink-soft">
        <div className="flex justify-between"><span>Plan total</span><b>{usd(packageTotal(pkg) / 100, 0)}</b></div>
        <div className="mt-1 flex justify-between"><span>{b.name}'s pass balance</span><b>{usd(b.balance, 0)}</b></div>
        {b.balance < packageTotal(pkg) / 100 && <p className="mt-2 text-[13px] text-ink-mute">The pass doesn't hold the full amount yet. Each step is released as funds are available, so ask {b.sponsorName ?? "the sponsor"} to top up.</p>}
      </div>
      <Button className="mt-5" size="lg" full disabled={!ready || busy} onClick={go}>{busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Starting…</> : "Start care plan"}</Button>
    </div>
  );
}
