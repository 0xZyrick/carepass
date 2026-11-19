"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, HeartPulse, Phone, Plus, Save, Smartphone, Snowflake } from "lucide-react";
import { Avatar, Badge, Button, Empty, Toggle } from "@/components/ui/ui";
import { CarePlanCard } from "@/components/CarePlanCard";
import { PassCard } from "@/components/PassCard";
import { RulesEditor, Rules } from "@/components/RulesEditor";
import { TxDetailSheet, TxRow } from "@/components/TxRow";
import { useStore } from "@/lib/store";
import { Tx } from "@/lib/data";
import { usd } from "@/lib/format";

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { carePlans, beneficiaries, txs, updateBeneficiary, toast, setActivePassId } = useStore();
  const b = beneficiaries.find((x) => x.id === id);
  const [rules, setRules] = useState<Rules | null>(null);
  const [open, setOpen] = useState<Tx | null>(null);
  useEffect(() => { if (b && !rules) setRules({ allowed: b.allowed }); }, [b, rules]);

  if (!b) return <Empty icon={<Phone />} title="Pass not found" sub="This family member doesn't exist." />;
  const dirty = !!rules && rules.allowed.join() !== b.allowed.join();
  const plan = carePlans.find((p) => p.passId === id && p.status === "active") ?? carePlans.find((p) => p.passId === id && p.status === "complete");
  const mine = txs.filter((t) => t.beneficiaryId === b.id);

  return (
    <div className="animate-fade-in pb-20 lg:pb-0">
      <Link href="/sponsor/family" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4" /> Family</Link>
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <Avatar initials={b.initials} hue={b.hue} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-3xl font-extrabold sm:text-4xl">{b.fullName}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-ink-mute">{b.relation} · {b.city} · {b.phone}</p>
        </div>
        {b.frozen && <Badge tone="iris"><Snowflake className="h-3.5 w-3.5" /> Frozen</Badge>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="space-y-6">
          <PassCard name={b.fullName} balance={b.balance} last4={b.last4} hue={b.hue} frozen={b.frozen} />
          <div className="grid grid-cols-2 gap-3">
            <Button href={`/sponsor/fund?to=${b.id}`} size="lg" icon={<Plus className="h-5 w-5" />}>Top up</Button>
            <Button size="lg" variant="outline" icon={<Smartphone className="h-5 w-5" />} onClick={() => { setActivePassId(b.id); router.push("/pass"); }}>View pass</Button>
          </div>

          {plan ? <CarePlanCard plan={plan} mode="sponsor" /> : (
            <Link href={`/sponsor/family/${b.id}/care`} className="card flex items-center gap-4 p-5 transition hover:shadow-lift">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700"><HeartPulse className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><div className="font-bold">Start a care plan</div><div className="text-sm text-ink-mute">Choose a package and a clinic. Each step is paid when the clinic confirms the visit.</div></div>
            </Link>
          )}

          <section className="card flex items-center gap-4 p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-iris-50 text-iris-700"><Snowflake className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><div className="font-bold">Freeze pass</div><div className="text-sm text-ink-mute">Instantly pause all payments. Balance stays safe.</div></div>
            <Toggle label="Freeze pass" checked={b.frozen} onChange={(v) => { updateBeneficiary(b.id, { frozen: v }); toast(v ? `${b.name}'s pass frozen` : `${b.name}'s pass unfrozen`, v ? "warn" : "ok"); }} />
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 pb-2 pt-5"><h2 className="text-lg font-bold">Activity</h2></div>
            {mine.length ? <div className="divide-y divide-line/70 pb-1">{mine.slice(0, 6).map((t) => <TxRow key={t.id} tx={t} who={b} showWho={false} onClick={() => setOpen(t)} />)}</div> : <Empty icon={<Smartphone />} title="No activity yet" sub="Payments and top-ups will appear here." />}
          </section>
        </div>

        <section className="card h-fit p-5 sm:p-7">
          <h2 className="text-xl font-bold">Care rules</h2>
          <p className="mb-7 mt-1 text-sm text-ink-mute">Checked on every payment.</p>
          {rules && <RulesEditor rules={rules} onChange={setRules} />}
          <div className={`sticky bottom-24 mt-7 grid grid-cols-[1fr_auto] gap-3 transition lg:static ${dirty ? "opacity-100" : "pointer-events-none opacity-40"}`}>
            <Button size="lg" full icon={<Save className="h-4 w-4" />} onClick={() => { updateBeneficiary(b.id, rules!); toast("Care rules saved"); }}>Save changes</Button>
            <Button size="lg" variant="outline" onClick={() => setRules({ allowed: b.allowed })}>Reset</Button>
          </div>
        </section>
      </div>
      <TxDetailSheet tx={open} who={b} onClose={() => setOpen(null)} />
    </div>
  );
}
