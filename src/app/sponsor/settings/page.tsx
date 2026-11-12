"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, ChevronRight, CircleHelp, CreditCard, KeyRound, LogOut, Mail, ScrollText } from "lucide-react";
import { Avatar, Button, IconTile, PageHeader, Toggle } from "@/components/ui/ui";
import { useStore } from "@/lib/store";
import { SPONSOR } from "@/lib/data";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 px-1 text-[12px] font-bold uppercase tracking-[0.12em] text-ink-mute">{title}</h2>
      <div className="card divide-y divide-line">{children}</div>
    </section>
  );
}

function Item({ icon: I, title, sub, right, href, onClick }: { icon: typeof Bell; title: string; sub?: string; right?: React.ReactNode; href?: string; onClick?: () => void }) {
  const inner = (
    <>
      <IconTile tone="ink" size={40}><I className="h-5 w-5" /></IconTile>
      <div className="min-w-0 flex-1 text-left"><div className="text-[15px] font-semibold">{title}</div>{sub && <div className="text-[13px] text-ink-mute">{sub}</div>}</div>
      {right ?? <ChevronRight className="h-5 w-5 text-ink-faint" />}
    </>
  );
  const cls = "flex w-full items-center gap-4 px-4 py-3.5 sm:px-5";
  if (href) return <Link href={href} className={cls + " transition hover:bg-canvas/60"}>{inner}</Link>;
  if (onClick) return <button onClick={onClick} className={cls + " transition hover:bg-canvas/60"}>{inner}</button>;
  return <div className={cls}>{inner}</div>;
}

export default function Settings() {
  const { toast } = useStore();
  const [n, setN] = useState({ pay: true, weekly: false, email: true });
  const [twofa, setTwofa] = useState(true);
  const set = (k: keyof typeof n) => (v: boolean) => { setN({ ...n, [k]: v }); toast("Preference saved"); };

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <PageHeader title="Settings" />
      <section className="card flex items-center gap-4 p-5">
        <Avatar initials={SPONSOR.initials} hue="sun" size={60} />
        <div className="min-w-0 flex-1"><div className="text-lg font-bold">{SPONSOR.name}</div><div className="truncate text-sm text-ink-mute">{SPONSOR.email} · {SPONSOR.location}</div></div>
        <Button variant="outline" size="sm" onClick={() => toast("Profile editing is coming soon", "warn")}>Edit</Button>
      </section>

      <Group title="Notifications">
        <Item icon={Bell} title="Step confirmed" sub="When a provider confirms a step" right={<Toggle label="Step confirmed" checked={n.pay} onChange={set("pay")} />} />
        <Item icon={Mail} title="Email receipts" sub="For every payment you make" right={<Toggle label="Email receipts" checked={n.email} onChange={set("email")} />} />
        <Item icon={Bell} title="Weekly summary" sub="Every Monday morning" right={<Toggle label="Weekly summary" checked={n.weekly} onChange={set("weekly")} />} />
      </Group>

      <Group title="Payments & security">
        <Item icon={CreditCard} title="Payment methods" sub="Visa •••• 4242 · Bank account" onClick={() => toast("Managing payment methods is coming soon", "warn")} />
        <Item icon={KeyRound} title="Two-factor authentication" sub="Extra protection when you sign in" right={<Toggle label="Two-factor authentication" checked={twofa} onChange={(v) => { setTwofa(v); toast(v ? "2FA enabled" : "2FA disabled", v ? "ok" : "warn"); }} />} />
      </Group>

      <Group title="Help">
        <Item icon={ScrollText} title="Care packages" sub="Browse packages and providers" href="/packages" />
        <Item icon={CircleHelp} title="How CarePass works" sub="Questions and answers" href="/#faq" />
      </Group>

      <Button href="/signin" variant="danger" size="lg" full className="mt-8" icon={<LogOut className="h-5 w-5" />}>Sign out</Button>
      <p className="mt-6 text-center text-xs text-ink-faint">CarePass prototype · demo data only</p>
    </div>
  );
}
