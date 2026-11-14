"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Clock, Home, MapPin, QrCode, Repeat } from "lucide-react";
import clsx from "clsx";
import { Avatar, Logo, Sheet } from "@/components/ui/ui";
import { DemoPill } from "@/components/DemoPill";
import { Loading, NoPassYet } from "@/components/States";
import { useStore } from "@/lib/store";

const TABS = [
  { href: "/pass", label: "Home", icon: Home },
  { href: "/pass/clinics", label: "Clinics", icon: MapPin },
  { href: "/pass/activity", label: "Activity", icon: Clock },
];

function Personas({ onPick }: { onPick?: () => void }) {
  const { beneficiaries, activePassId, setActivePassId } = useStore();
  return (
    <div className="space-y-2">
      {beneficiaries.map((b) => (
        <button key={b.id} onClick={() => { setActivePassId(b.id); onPick?.(); }}
          className={clsx("flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition", activePassId === b.id ? "border-brand-500 bg-brand-50/60" : "border-line bg-white hover:border-line-strong")}>
          <Avatar initials={b.initials} hue={b.hue} size={40} />
          <div className="min-w-0 flex-1 leading-tight"><div className="truncate font-bold">{b.fullName}</div><div className="text-xs text-ink-mute">{b.relation} · {b.city}</div></div>
        </button>
      ))}
    </div>
  );
}

export function PassShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { beneficiaries, activePassId, me: user, loading, signOut } = useStore();
  const isSponsor = user?.role === "sponsor";
  const [switcher, setSwitcher] = useState(false);
  const me = beneficiaries.find((b) => b.id === activePassId) ?? beneficiaries[0];
  const out = async () => { await signOut(); window.location.href = "/signin"; };
  const paying = path.startsWith("/pass/pay");
  const active = (h: string) => (h === "/pass" ? path === h : path.startsWith(h));

  return (
    <div className="min-h-dvh lg:flex lg:items-center lg:justify-center lg:gap-20 lg:px-10 lg:py-8">
      {/* Desktop explainer */}
      <aside className="hidden w-[340px] shrink-0 lg:block">
        <Link href="/" aria-label="CarePass home"><Logo /></Link>
        <DemoPill className="mt-8" />
        <h1 className="mt-5 text-4xl font-extrabold leading-[1.1]">The family pass.</h1>
        <p className="mt-4 leading-relaxed text-ink-mute">What your family member sees on their phone — one big button to pay, verified clinics nearby, and a clear balance in dollars and Naira.</p>
        <div className="eyebrow mb-3 mt-9">{isSponsor ? "Previewing as" : "Signed in as"}</div>
        {isSponsor || beneficiaries.length > 1 ? <Personas /> : <p className="text-sm font-semibold">{user?.name}</p>}
        {isSponsor ? <Link href="/sponsor" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:underline">Switch to sponsor view <ArrowRight className="h-4 w-4" /></Link> : <button onClick={out} className="mt-8 text-sm font-bold text-brand-700 hover:underline">Sign out</button>}
      </aside>

      {/* Phone */}
      <div className={clsx("relative flex h-dvh w-full flex-col overflow-hidden bg-[#F8F7F2] lg:h-[820px] lg:w-[390px] lg:shrink-0 lg:rounded-[52px] lg:border-[10px] lg:border-ink lg:shadow-pop lg:[transform:translateZ(0)]")}>
        <div className="hidden h-9 shrink-0 items-center justify-between px-8 text-[12px] font-bold lg:flex">
          <span>9:41</span><span className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" /><span>5G ▮▮▮</span>
        </div>
        {/* demo bar */}
        <div className="flex shrink-0 items-center justify-between gap-3 bg-ink px-4 py-2 text-xs font-semibold text-white lg:hidden" style={{ paddingTop: "max(0.5rem, var(--safe-top))" }}>
          <button onClick={() => setSwitcher(true)} className="flex min-w-0 items-center gap-1.5"><Repeat className="h-3.5 w-3.5 shrink-0 text-brand-300" /> <span className="truncate">{isSponsor ? "Preview · " : ""}{me?.name ?? user?.name ?? ""}</span></button>
          {isSponsor ? <Link href="/sponsor" className="shrink-0 text-brand-300">Sponsor view →</Link> : <button onClick={out} className="shrink-0 text-brand-300">Sign out</button>}
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain">{loading ? <Loading /> : !me ? <NoPassYet /> : children}</div>

        {!paying && (
          <nav className="relative z-0 shrink-0 border-t border-line bg-white/95 backdrop-blur-xl" aria-label="Pass" style={{ paddingBottom: "var(--safe-bottom)" }}>
            <ul className="grid grid-cols-4 items-end px-2">
              {[TABS[0], TABS[1]].map((t) => <TabItem key={t.href} t={t} on={active(t.href)} />)}
              <li className="flex justify-center">
                <Link href="/pass/pay" aria-label="Pay" className="-mt-6 grid h-[60px] w-[60px] place-items-center rounded-full bg-brand-500 text-white shadow-glow ring-4 ring-white transition active:scale-95"><QrCode className="h-7 w-7" /></Link>
              </li>
              <TabItem t={TABS[2]} on={active(TABS[2].href)} />
            </ul>
          </nav>
        )}
        <Sheet phone open={switcher} onClose={() => setSwitcher(false)} title={isSponsor ? "Preview as…" : "Your passes"}><Personas onPick={() => setSwitcher(false)} />{isSponsor && <Link href="/sponsor" className="mt-4 flex h-12 items-center justify-center rounded-2xl bg-canvas font-semibold">Open sponsor view</Link>}</Sheet>
      </div>
    </div>
  );
}

function TabItem({ t, on }: { t: (typeof TABS)[number]; on: boolean }) {
  return (
    <li>
      <Link href={t.href} aria-current={on ? "page" : undefined} className={clsx("flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold", on ? "text-brand-700" : "text-ink-mute")}>
        <t.icon className={clsx("h-[22px] w-[22px]", on && "stroke-[2.4]")} />{t.label}
      </Link>
    </li>
  );
}
