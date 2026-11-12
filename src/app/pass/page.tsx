"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Clock, FileText, HeartPulse, MapPin, Navigation, Phone, Upload } from "lucide-react";
import clsx from "clsx";
import { Avatar, CopyButton, Empty, Progress } from "@/components/ui/ui";
import { CheckRow } from "@/components/ui/forms";
import { CareTimeline } from "@/components/CareTimeline";
import { useStore } from "@/lib/store";
import { CareEpisode, isClosed, pkgOf, released, visitCode } from "@/lib/care";
import { merchantOf } from "@/lib/data";
import { greet, usd } from "@/lib/format";

function Bring({ items }: { items: string[] }) {
  const [got, setGot] = useState<Record<string, boolean>>({});
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold"><FileText className="h-4 w-4 text-brand-600" />Bring with you</div>
        <span className="text-xs font-semibold text-ink-mute">{Object.values(got).filter(Boolean).length}/{items.length}</span>
      </div>
      {items.map((x) => <CheckRow key={x} checked={!!got[x]} onChange={(v) => setGot((g) => ({ ...g, [x]: v }))}>{x}</CheckRow>)}
    </div>
  );
}

function Episode({ e }: { e: CareEpisode }) {
  const { addDoc, toast } = useStore();
  const p = pkgOf(e.packageId), m = merchantOf(e.providerId)!, closed = isClosed(e);
  const intake = !closed && e.done === 1;

  return (
    <section className="space-y-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 to-brand-950 p-5 text-white shadow-raise">
        <div className="grain pointer-events-none absolute inset-0" />
        <div className="relative">
          <div className="text-[13px] font-semibold text-brand-200">{p.name}</div>
          <div className="mt-1 font-display text-[26px] font-bold leading-tight">{closed ? "All done 🎉" : `Next: ${p.steps[e.done]}`}</div>
          <div className="mt-4 flex items-start gap-2 text-sm text-brand-100"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span>{m.name}, {m.area}<span className="block text-[13px] text-brand-200">{m.hours}</span></span></div>
          <Progress value={e.done} max={p.steps.length} tone="dark" className="mt-4" label="Care progress" />
          <div className="mt-1.5 flex justify-between text-[11.5px] font-medium text-brand-200"><span>{Math.min(e.done, p.steps.length)} of {p.steps.length} steps</span>{e.funded > 0 && <span>{usd(released(e), 0)} of {usd(e.funded, 0)} paid out</span>}</div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-semibold transition hover:bg-white/20"><Phone className="h-4 w-4" />Call</a>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${m.name} ${m.area} ${m.city}`)}`} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-brand-900 transition hover:bg-brand-50"><Navigation className="h-4 w-4" />Directions</a>
          </div>
        </div>
      </div>

      {/* Funding reassurance */}
      {!closed && e.funded === 0 && (
        <div className="flex items-start gap-3 rounded-2xl bg-sun-50 p-4 text-[13px] leading-relaxed text-sun-700"><Clock className="mt-0.5 h-4 w-4 shrink-0" />Your family hasn’t added funds yet. You can still send your documents.</div>
      )}

      {/* Intake: upload documents */}
      {intake && (
        <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <div className="font-bold">Send your documents to {m.name}</div>
          <p className="mt-1 text-sm leading-relaxed text-ink-mute">A photo of your ID or a referral letter. Only {m.name} can see these, never your family abroad.</p>
          {e.docs.length > 0 && (
            <ul className="mt-4 space-y-2">
              {e.docs.map((d) => <li key={d.url + d.name} className="flex items-center gap-2.5 rounded-xl bg-brand-50 px-3 py-2.5 text-sm font-semibold text-brand-800"><CheckCircle2 className="h-4 w-4 shrink-0" /><span className="truncate">{d.name}</span></li>)}
            </ul>
          )}
          {e.docs.length > 0 && <p className="mt-3 flex items-center gap-2 text-[13px] text-ink-mute"><Clock className="h-3.5 w-3.5" />Waiting for {m.name} to confirm they have them.</p>}
          <label className="mt-4 flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink text-sm font-semibold text-white transition active:scale-[0.98] focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2">
            <Upload className="h-5 w-5" />{e.docs.length ? "Add another document" : "Add a document"}
            <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(ev) => {
              const f = ev.target.files?.[0]; ev.target.value = "";
              if (!f) return;
              if (f.size > 10 * 1024 * 1024) return toast("File is over 10 MB", "warn");
              addDoc(e.id, f);
            }} />
          </label>
          <p className="mt-2 text-center text-xs text-ink-faint">Photos or PDF · up to 10 MB</p>
        </div>
      )}

      {/* Visit code ticket */}
      {!closed && e.done > 1 && (
        <div className="relative overflow-hidden rounded-3xl bg-white shadow-raise">
          <div className="bg-ink p-5 pb-6 text-center text-white">
            <div className="text-[13px] font-semibold text-white/65">Show this code at {m.name}</div>
            <div className="num mt-2 font-display text-[56px] font-bold leading-none tracking-[0.18em] [text-indent:0.18em]" aria-label={`Visit code ${visitCode(e).split("").join(" ")}`}>{visitCode(e)}</div>
          </div>
          <div className="ticket-notch relative border-t-2 border-dashed border-line-strong" />
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="min-w-0"><div className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">For</div><div className="truncate text-sm font-bold">{p.steps[e.done]}</div></div>
            <CopyButton text={visitCode(e)} label="Copy code" />
          </div>
        </div>
      )}

      {!closed && <Bring items={p.bring} />}

      <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <div className="mb-4 font-bold">Your steps</div>
        <CareTimeline steps={p.steps} done={e.done} confirms={e.confirms} />
      </div>
    </section>
  );
}

export default function PassHome() {
  const { episodes, beneficiaries, activePassId } = useStore();
  const b = beneficiaries.find((x) => x.id === activePassId) ?? beneficiaries[0];
  const mine = episodes.filter((e) => e.beneficiaryId === b.id);
  const [sel, setSel] = useState<string>("");
  const cur = mine.find((e) => e.id === sel) ?? mine[0];

  return (
    <div className="animate-fade-in space-y-5 px-5 pb-8 pt-5">
      <header className="flex items-center gap-3">
        <Avatar initials={b.initials} hue={b.hue} size={46} />
        <div className="min-w-0 flex-1 leading-tight"><div className="text-[13px] font-medium text-ink-mute">{greet()}</div><div className="truncate font-display text-[22px] font-bold">{b.name}</div></div>
        <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft shadow-card"><MapPin className="h-3.5 w-3.5 text-brand-600" />{b.city}</span>
      </header>

      {mine.length === 0 && (
        <div className="rounded-3xl border border-line bg-white shadow-card">
          <Empty icon={<HeartPulse />} title="No care started yet" sub="When your family sets up a care package, your steps will show here." action={<Link href="/pass/help" className="text-sm font-bold text-brand-700">How does this work?</Link>} />
        </div>
      )}

      {mine.length > 1 && (
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {mine.map((e) => (
            <button key={e.id} onClick={() => setSel(e.id)} aria-pressed={cur?.id === e.id}
              className={clsx("h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition", cur?.id === e.id ? "bg-ink text-white" : "bg-white text-ink-soft shadow-card")}>{pkgOf(e.packageId).name}</button>
          ))}
        </div>
      )}

      {cur && <Episode key={cur.id} e={cur} />}
    </div>
  );
}
