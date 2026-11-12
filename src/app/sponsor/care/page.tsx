"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ClipboardList, Plus } from "lucide-react";
import { Badge, Button, Empty, PageHeader, PkgIcon, SectionTitle } from "@/components/ui/ui";
import { Segmented } from "@/components/ui/forms";
import { EpisodeCard } from "@/components/EpisodeCard";
import { useStore } from "@/lib/store";
import { PACKAGES, isClosed } from "@/lib/care";
import { usd } from "@/lib/format";

export default function CarePage() {
  const { beneficiaries, episodes } = useStore();
  const [tab, setTab] = useState<"active" | "done">("active");
  const active = episodes.filter((e) => !isClosed(e));
  const done = episodes.filter(isClosed);
  const list = tab === "active" ? active : done;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Care" sub="Every package you’ve started, and the next ones you can begin."
        action={<Button href="/sponsor/care/new" icon={<Plus className="h-[18px] w-[18px]" />}>Start a package</Button>} />

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <Segmented label="Filter" value={tab} onChange={setTab} className="w-full sm:w-72"
            options={[{ value: "active", label: `In progress · ${active.length}` }, { value: "done", label: `Completed · ${done.length}` }]} />
        </div>
        {list.length === 0 ? (
          <div className="card">
            <Empty icon={<ClipboardList />} title={tab === "active" ? "No care in progress" : "No completed packages yet"}
              sub={tab === "active" ? "Start a package to follow each step to completion." : "Packages appear here once every step is confirmed."}
              action={tab === "active" ? <Button href="/sponsor/care/new">Start a package</Button> : undefined} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {list.map((e) => <EpisodeCard key={e.id} e={e} who={beneficiaries.find((b) => b.id === e.beneficiaryId)} />)}
          </div>
        )}
      </section>

      <SectionTitle className="mt-12">Start a care package</SectionTitle>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PACKAGES.map((p) => (
          <Link key={p.id} href={`/sponsor/care/new?package=${p.id}`} className="card card-hover group flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <PkgIcon id={p.icon} />
              <Badge tone="ink">{p.timeline}</Badge>
            </div>
            <h3 className="mt-4 text-[17px] font-bold">{p.name}</h3>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-mute">{p.blurb}</p>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
              <div className="num text-[15px] font-bold">{usd(p.price[0], 0)} – {usd(p.price[1], 0)}</div>
              <ArrowRight className="h-4 w-4 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
