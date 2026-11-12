"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CircleHelp, Home, MapPin, Repeat } from "lucide-react";
import clsx from "clsx";
import { Avatar, Logo, Sheet } from "@/components/ui/ui";
import { useStore } from "@/lib/store";

const TABS = [
  { href: "/pass", label: "My care", icon: Home },
  { href: "/pass/clinics", label: "Providers", icon: MapPin },
  { href: "/pass/help", label: "Help", icon: CircleHelp },
];

function Personas({ onPick }: { onPick?: () => void }) {
  const { beneficiaries, activePassId, setActivePassId } = useStore();
  return (
    <div className="space-y-2">
      {beneficiaries.map((b) => (
        <button key={b.id} onClick={() => { setActivePassId(b.id); onPick?.(); }} aria-pressed={activePassId === b.id}
          className={clsx("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition", activePassId === b.id ? "border-brand-600 bg-brand-50/60 shadow-[0_0_0_3px_rgba(15,154,163,.12)]" : "border-line bg-white hover:border-line-strong")}>
          <Avatar initials={b.initials} hue={b.hue} size={40} />
          <div className="min-w-0 flex-1 leading-tight"><div className="truncate text-sm font-bold">{b.fullName}</div><div className="text-xs text-ink-mute">{b.relation} · {b.city}</div></div>
        </button>
      ))}
    </div>
  );
}

export function PassShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { beneficiaries, activePassId } = useStore();
  const [switcher, setSwitcher] = useState(false);
  const me = beneficiaries.find((b) => b.id === activePassId) ?? beneficiaries[0];
  const active = (h: string) => (h === "/pass" ? path === h : path.startsWith(h));

  return (
    <div className="min-h-dvh lg:flex lg:items-center lg:justify-center lg:gap-24 lg:px-10 lg:py-8">
      {/* Desktop explainer */}
      <aside className="hidden w-[340px] shrink-0 lg:block">
        <Link href="/" aria-label="CarePass home" className="inline-block"><Logo /></Link>
        <div className="eyebrow mt-12">Family pass</div>
        <h1 className="mt-2 text-[40px] font-bold leading-[1.08]">What your family sees on their phone.</h1>
        <p className="mt-4 leading-relaxed text-ink-mute">The next step, the provider, what to bring and a visit code to show. Nothing more, nothing confusing.</p>
        <div className="eyebrow mb-3 mt-9">Viewing as</div>
        <Personas />
        <Link href="/sponsor" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:underline">Switch to sponsor view <ArrowRight className="h-4 w-4" /></Link>
      </aside>

      {/* Phone */}
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#F7F9FC] lg:h-[820px] lg:w-[390px] lg:shrink-0 lg:rounded-[52px] lg:border-[10px] lg:border-ink lg:shadow-pop lg:[transform:translateZ(0)]">
        <div className="relative hidden h-10 shrink-0 items-center justify-between px-8 text-[12px] font-bold lg:flex">
          <span>9:41</span><span className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" /><span>5G</span>
        </div>
        {/* demo bar (mobile only) */}
        <div className="flex shrink-0 items-center justify-between gap-3 bg-ink px-4 py-2 text-xs font-semibold text-white lg:hidden" style={{ paddingTop: "max(0.5rem, var(--safe-top))" }}>
          <button onClick={() => setSwitcher(true)} className="flex h-8 items-center gap-1.5"><Repeat className="h-3.5 w-3.5 text-brand-300" />Demo · viewing as {me.name}</button>
          <Link href="/sponsor" className="flex h-8 items-center text-brand-300">Sponsor view →</Link>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain">{children}</div>

        <nav className="relative z-20 shrink-0 border-t border-line bg-white/95 backdrop-blur-xl" aria-label="Family pass" style={{ paddingBottom: "var(--safe-bottom)" }}>
          <ul className="grid grid-cols-3 px-2">
            {TABS.map((t) => (
              <li key={t.href}>
                <Link href={t.href} aria-current={active(t.href) ? "page" : undefined}
                  className={clsx("relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition", active(t.href) ? "text-brand-700" : "text-ink-mute")}>
                  {active(t.href) && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-600" />}
                  <t.icon className={clsx("h-[22px] w-[22px]", active(t.href) && "stroke-[2.4]")} />{t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Sheet phone open={switcher} onClose={() => setSwitcher(false)} title="Preview as…">
          <Personas onPick={() => setSwitcher(false)} />
          <Link href="/sponsor" className="mt-4 flex h-12 items-center justify-center rounded-xl bg-canvas font-semibold">Open sponsor view</Link>
        </Sheet>
      </div>
    </div>
  );
}
