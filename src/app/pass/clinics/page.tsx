"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeCheck, Lock, MapPin, Navigation, Search } from "lucide-react";
import clsx from "clsx";
import { CatIcon, Empty } from "@/components/ui/ui";
import { useStore } from "@/lib/store";
import { CATEGORIES, Category } from "@/lib/data";

export default function Clinics() {
  const { beneficiaries, activePassId, merchants } = useStore();
  const b = beneficiaries.find((x) => x.id === activePassId) ?? beneficiaries[0];
  const [cat, setCat] = useState<"all" | Category>("all");
  const [q, setQ] = useState("");
  const [openOnly, setOpenOnly] = useState(false);

  const list = useMemo(
    () => merchants.filter((m) => m.city === b.city && (cat === "all" || m.type === cat) && (!openOnly || m.open) && (!q || (m.name + m.area).toLowerCase().includes(q.toLowerCase()))).sort((a, c) => a.distKm - c.distKm),
    [merchants, b.city, cat, q, openOnly]
  );

  return (
    <div className="animate-fade-in px-5 pb-8 pt-6">
      <h1 className="text-[28px] font-extrabold">Verified clinics</h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-mute"><MapPin className="h-4 w-4" /> Near {b.city}</p>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search clinics" placeholder="Search by name or area" className="h-12 w-full rounded-2xl border border-line-strong bg-white pl-11 pr-4 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15" />
      </div>
      <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
        {[{ id: "all", plural: "All" }, ...CATEGORIES].map((c) => (
          <button key={c.id} onClick={() => setCat(c.id as "all" | Category)} className={clsx("h-10 shrink-0 rounded-full px-4 text-sm font-bold", cat === c.id ? "bg-ink text-white" : "bg-white text-ink-soft shadow-card")}>{c.plural}</button>
        ))}
      </div>
      <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-ink-soft"><input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} className="h-5 w-5 accent-brand-500" /> Open now</label>

      <div className="mt-5 space-y-3">
        {list.length === 0 && <Empty icon={<Search className="h-6 w-6" />} title={merchants.length ? "No clinics found" : "No clinics have joined yet"} sub={merchants.length ? "Try a different category or clear your search." : "Verified clinics will appear here as they join CarePass."} />}
        {list.map((m) => {
          const ok = b.allowed.includes(m.type);
          return (
            <article key={m.id} className="rounded-3xl bg-white p-4 shadow-card">
              <div className="flex items-start gap-3.5">
                <CatIcon type={m.type} className={clsx(!ok && "!bg-canvas !text-ink-faint")} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5"><h2 className="truncate font-sans text-[15px] font-bold">{m.name}</h2><BadgeCheck className="h-4 w-4 shrink-0 text-brand-500" aria-label="Verified" /></div>
                  <div className="text-[13px] text-ink-mute">{m.area} · {m.distKm} km</div>
                  <div className={clsx("mt-1 text-[13px] font-semibold", m.open ? "text-brand-700" : "text-ink-faint")}>{m.hours}</div>
                </div>
              </div>
              {ok ? (
                <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                  <Link href={`/pass/pay?m=${m.id}`} className="grid h-11 place-items-center rounded-xl bg-brand-500 text-sm font-bold text-white active:scale-[0.98]">Pay here</Link>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.name + " " + m.area + " " + m.city)}`} target="_blank" rel="noreferrer" aria-label={`Directions to ${m.name}`} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas text-ink-soft"><Navigation className="h-5 w-5" /></a>
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-canvas px-3.5 py-3 text-[13px] font-semibold text-ink-mute"><Lock className="h-4 w-4" /> Not covered by your pass</div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
