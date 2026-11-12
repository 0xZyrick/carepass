"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Wallet } from "lucide-react";
import clsx from "clsx";
import { Avatar, Badge, PkgIcon, ProgressRing } from "@/components/ui/ui";
import { Beneficiary, merchantOf } from "@/lib/data";
import { CareEpisode, EpisodeState, held, pkgOf, progressPct, released, stateOf } from "@/lib/care";
import { usd } from "@/lib/format";

export const STATE_META: Record<EpisodeState, { label: string; tone: "sun" | "brand" | "iris" | "rose" | "ink"; hint: string }> = {
  "needs-funding": { label: "Needs funding", tone: "sun", hint: "Fund to let the provider begin" },
  "awaiting-intake": { label: "Awaiting documents", tone: "iris", hint: "Waiting for documents from the family" },
  "in-progress": { label: "In progress", tone: "brand", hint: "On track" },
  completed: { label: "Completed", tone: "ink", hint: "All steps confirmed" },
};

/** Summary card for one care episode. Links to the detail page. */
export function EpisodeCard({ e, who }: { e: CareEpisode; who?: Beneficiary }) {
  const p = pkgOf(e.packageId);
  const m = merchantOf(e.providerId);
  const st = stateOf(e);
  const meta = STATE_META[st];
  const pct = progressPct(e);
  const next = st === "completed" ? "All steps confirmed" : p.steps[e.done];

  return (
    <Link href={`/sponsor/care/${e.id}`} className="card card-hover group block p-5">
      <div className="flex items-start gap-3.5">
        {who ? <Avatar initials={who.initials} hue={who.hue} size={44} /> : <PkgIcon id={p.icon} />}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold">{p.name}</div>
          <div className="truncate text-[13px] text-ink-mute">for {who?.name ?? "family"}</div>
        </div>
        <Badge tone={meta.tone} dot>{meta.label}</Badge>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <ProgressRing pct={pct} size={58} />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute">{st === "completed" ? "Status" : "Next step"}</div>
          <div className="truncate text-[15px] font-bold">{next}</div>
          <div className="mt-0.5 flex items-center gap-1 truncate text-[13px] text-ink-mute"><MapPin className="h-3.5 w-3.5 shrink-0" />{m?.name}, {m?.area}</div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-canvas px-3.5 py-3">
        <div className="flex items-center gap-2.5 text-[13px]">
          <Wallet className={clsx("h-4 w-4", e.funded > 0 ? "text-brand-600" : "text-sun-600")} />
          {e.funded > 0 ? (
            <span><b className="num">{usd(released(e), 0)}</b> <span className="text-ink-mute">paid</span> · <b className="num">{usd(held(e), 0)}</b> <span className="text-ink-mute">held</span></span>
          ) : (
            <span className="font-semibold text-sun-700">Not funded yet</span>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />
      </div>
    </Link>
  );
}
