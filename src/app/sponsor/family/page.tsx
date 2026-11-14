"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, Button, PageHeader, Progress } from "@/components/ui/ui";
import { PassCard } from "@/components/PassCard";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/data";
import { usd } from "@/lib/format";

export default function FamilyPage() {
  const { beneficiaries, spent } = useStore();
  return (
    <div className="animate-fade-in">
      <PageHeader title="Family" sub="Each person has their own merchant-locked pass, limits and activity."
        action={<Button href="/sponsor/family/new" icon={<Plus className="h-4 w-4" />}>Add family member</Button>} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {beneficiaries.map((b) => {
          const s = spent(b.id);
          return (
            <article key={b.id} className="card overflow-hidden p-5">
              <PassCard name={b.fullName} balance={b.balance} last4={b.last4} hue={b.hue} frozen={b.frozen} />
              <div className="mt-5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold">{b.fullName}</h2>
                  <p className="text-sm text-ink-mute">{b.relation} · {b.city} · {b.phone}</p>
                </div>
                {b.lastActive === "Not yet active" ? <Badge tone="sun">Invite sent</Badge> : <Badge>Active</Badge>}
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {b.allowed.map((a) => <span key={a} className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-soft">{CATEGORIES.find((c) => c.id === a)?.label}</span>)}
              </div>
              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-xs font-semibold text-ink-mute"><span>Spent this month</span><span>{usd(s, 0)} of {usd(b.monthlyLimit, 0)}</span></div>
                <Progress value={s} max={b.monthlyLimit} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Button href={`/sponsor/fund?to=${b.id}`}>Top up</Button>
                <Button href={`/sponsor/family/${b.id}`} variant="outline">Rules & activity</Button>
              </div>
            </article>
          );
        })}
        <Link href="/sponsor/family/new" className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-line-strong text-ink-mute transition hover:border-brand-500 hover:bg-brand-50/50 hover:text-brand-700">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-canvas-2"><Plus className="h-6 w-6" /></span>
          <span className="font-bold">Add a family member</span>
        </Link>
      </div>
    </div>
  );
}
