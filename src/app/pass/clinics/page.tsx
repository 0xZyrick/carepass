"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, MapPin, Navigation, Phone, Search } from "lucide-react";
import clsx from "clsx";
import { Badge, CatIcon, Empty, Toggle } from "@/components/ui/ui";
import { Chip } from "@/components/ui/forms";
import { useStore } from "@/lib/store";
import { CATEGORIES, Category, MERCHANTS } from "@/lib/data";

export default function Clinics() {
  const { beneficiaries, activePassId, episodes } = useStore();
  const b = beneficiaries.find((x) => x.id === activePassId) ?? beneficiaries[0];
  const myProviders = new Set(episodes.filter((e) => e.beneficiaryId === b.id).map((e) => e.providerId));
  const [cat, setCat] = useState<"all" | Category>("all");
  const [q, setQ] = useState("");
  const [openOnly, setOpenOnly] = useState(false);

  const list = useMemo(
    () => MERCHANTS
      .filter((m) => m.city === b.city && (cat === "all" || m.type === cat) && (!openOnly || m.open) && (!q || (m.name + m.area).toLowerCase().includes(q.toLowerCase())))
      .sort((a, c) => Number(myProviders.has(c.id)) - Number(myProviders.has(a.id)) || a.distKm - c.distKm),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [b.city, b.id, cat, q, openOnly, episodes]
  );

  return (
    <div className="animate-fade-in px-5 pb-8 pt-6">
      <h1 className="text-[28px] font-bold">Vetted providers</h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-mute"><MapPin className="h-4 w-4" />Verified partners in {b.city}</p>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search providers" placeholder="Search by name or area" type="search"
          className="h-12 w-full rounded-xl border border-line-strong bg-white pl-11 pr-4 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-500/15" />
      </div>
      <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5" role="group" aria-label="Category">
        {[{ id: "all", plural: "All" }, ...CATEGORIES].map((c) => (
          <Chip key={c.id} on={cat === c.id} onClick={() => setCat(c.id as "all" | Category)}>{c.plural}</Chip>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-card">
        <span className="text-sm font-semibold text-ink-soft">Open now</span>
        <Toggle label="Open now" checked={openOnly} onChange={setOpenOnly} />
      </div>

      <div className="mt-5 space-y-3">
        {list.length === 0 && <div className="rounded-2xl bg-white shadow-card"><Empty icon={<Search />} title="No providers found" sub="Try a different category or clear your search." /></div>}
        {list.map((m) => (
          <article key={m.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-start gap-3.5">
              <CatIcon type={m.type} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5"><h2 className="truncate font-sans text-[15px] font-bold leading-tight">{m.name}</h2><BadgeCheck className="h-4 w-4 shrink-0 text-brand-600" aria-label="Verified" /></div>
                <div className="mt-0.5 text-[13px] text-ink-mute">{m.area} · {m.distKm} km away</div>
                <div className={clsx("mt-1 text-[13px] font-semibold", m.open ? "text-brand-700" : "text-ink-faint")}>{m.hours}</div>
              </div>
              {myProviders.has(m.id) && <Badge tone="brand">Your care</Badge>}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-canvas text-sm font-semibold text-ink-soft transition active:scale-[0.98]"><Phone className="h-4 w-4" />Call</a>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.name + " " + m.area + " " + m.city)}`} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white transition active:scale-[0.98]"><Navigation className="h-4 w-4" />Directions</a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
