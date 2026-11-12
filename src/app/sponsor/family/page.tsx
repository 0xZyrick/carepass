"use client";

import Link from "next/link";
import { MapPin, Phone, Plus, Smartphone, Users } from "lucide-react";
import { Avatar, Badge, Button, Empty, PageHeader } from "@/components/ui/ui";
import { useStore } from "@/lib/store";
import { isClosed, released } from "@/lib/care";
import { usd } from "@/lib/format";

export default function FamilyPage() {
  const { beneficiaries, episodes, setActivePassId } = useStore();
  return (
    <div className="animate-fade-in">
      <PageHeader title="Family" sub="The people you arrange care for."
        action={<Button href="/sponsor/family/new" icon={<Plus className="h-[18px] w-[18px]" />}>Add family member</Button>} />
      {beneficiaries.length === 0 ? (
        <div className="card"><Empty icon={<Users />} title="No one added yet" sub="Add a family member to start arranging their care." action={<Button href="/sponsor/family/new">Add family member</Button>} /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {beneficiaries.map((b) => {
            const mine = episodes.filter((e) => e.beneficiaryId === b.id);
            const n = mine.filter((e) => !isClosed(e)).length;
            const paid = mine.reduce((s, e) => s + released(e), 0);
            return (
              <article key={b.id} className="card p-5">
                <div className="flex items-start gap-4">
                  <Avatar initials={b.initials} hue={b.hue} size={52} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-bold">{b.fullName}</h2>
                    <p className="text-sm text-ink-mute">{b.relation}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-soft">
                      <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-ink-mute" />{b.city}</span>
                      <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-ink-mute" />{b.phone}</span>
                    </div>
                  </div>
                  <Badge tone={n ? "sun" : "ink"} dot>{n ? `${n} in progress` : "No care yet"}</Badge>
                </div>
                <dl className="mt-5 grid grid-cols-2 divide-x divide-line rounded-xl bg-canvas py-3 text-center">
                  <div><dt className="text-[11.5px] font-semibold text-ink-mute">Packages</dt><dd className="num text-lg font-bold">{mine.length}</dd></div>
                  <div><dt className="text-[11.5px] font-semibold text-ink-mute">Paid to providers</dt><dd className="num text-lg font-bold">{usd(paid, 0)}</dd></div>
                </dl>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <Button href={`/sponsor/care/new?for=${b.id}`}>Start care</Button>
                  <Button href={`/sponsor/fund?to=${b.id}`} variant="outline">Fund care</Button>
                </div>
                <Link href="/pass" onClick={() => setActivePassId(b.id)} className="mt-3 flex h-10 items-center justify-center gap-2 rounded-lg text-[13px] font-semibold text-ink-soft transition hover:bg-canvas">
                  <Smartphone className="h-4 w-4" />Preview {b.name}’s pass
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
