"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, ChevronRight, CreditCard, KeyRound, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Avatar, Button, PageHeader, Toggle } from "@/components/ui/ui";
import { useStore } from "@/lib/store";

export default function Settings() {
  const router = useRouter();
  const { toast, me, signOut, seedDemo, previewEnabled } = useStore();
  const initials = (me?.name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const [n, setN] = useState({ pay: true, block: true, low: true, weekly: false });
  const [twofa, setTwofa] = useState(true);
  const set = (k: keyof typeof n) => (v: boolean) => { setN({ ...n, [k]: v }); toast("Preference saved"); };

  const Row = ({ icon: I, title, sub, right }: { icon: typeof Bell; title: string; sub?: string; right: React.ReactNode }) => (
    <div className="flex items-center gap-4 px-5 py-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-canvas text-ink-soft"><I className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1"><div className="font-semibold">{title}</div>{sub && <div className="text-sm text-ink-mute">{sub}</div>}</div>
      {right}
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <PageHeader title="Settings" />
      <section className="card flex items-center gap-4 p-5">
        <Avatar initials={initials} hue="sun" size={60} />
        <div className="min-w-0 flex-1"><div className="truncate text-lg font-bold">{me?.name}</div><div className="truncate text-sm text-ink-mute">{me?.email}</div></div>
        <Button variant="outline" size="sm" onClick={() => toast("Profile editing is not available yet", "warn")}>Edit</Button>
      </section>

      <h2 className="mb-2 mt-8 px-1 font-sans text-[13px] font-bold uppercase tracking-wider text-ink-mute">Notifications</h2>
      <div className="card divide-y divide-line/70">
        <Row icon={Bell} title="Clinic payments" sub="When a pass is used at a clinic" right={<Toggle label="Clinic payments" checked={n.pay} onChange={set("pay")} />} />
        <Row icon={ShieldCheck} title="Blocked attempts" sub="When a guardrail rejects a payment" right={<Toggle label="Blocked attempts" checked={n.block} onChange={set("block")} />} />
        <Row icon={Bell} title="Low balance" sub="When a pass drops under $25" right={<Toggle label="Low balance" checked={n.low} onChange={set("low")} />} />
        <Row icon={Bell} title="Weekly summary" sub="Every Monday morning" right={<Toggle label="Weekly summary" checked={n.weekly} onChange={set("weekly")} />} />
      </div>

      <h2 className="mb-2 mt-8 px-1 font-sans text-[13px] font-bold uppercase tracking-wider text-ink-mute">Payments & security</h2>
      <div className="card divide-y divide-line/70">
        <Row icon={CreditCard} title="Payment methods" sub="Visa •••• 4242 · Bank account" right={<ChevronRight className="h-5 w-5 text-ink-faint" />} />
        <Row icon={KeyRound} title="Two-factor authentication" sub="Extra protection when you sign in" right={<Toggle label="Two-factor authentication" checked={twofa} onChange={(v) => { setTwofa(v); toast(v ? "2FA enabled" : "2FA disabled", v ? "ok" : "warn"); }} />} />
        <Row icon={UserRound} title="Guardrail lab" sub="See how every payment is checked" right={<Link href="/guardrails" className="rounded-lg px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50">Open</Link>} />
      </div>

      {previewEnabled && (
        <Button variant="outline" size="lg" full className="mt-8" onClick={async () => { if (confirm("Replace your family passes with the sample family? This deletes your current passes and history.") && (await seedDemo(true))) toast("Sample data loaded"); }}>
          Reset to sample data
        </Button>
      )}
      <Button variant="danger" size="lg" full className="mt-4" icon={<LogOut className="h-5 w-5" />} onClick={async () => { await signOut(); router.push("/signin"); }}>Sign out</Button>
    </div>
  );
}
