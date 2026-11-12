"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, HeartPulse, LayoutDashboard, Plus, Settings, ShieldCheck, Smartphone, Users, Wallet, X } from "lucide-react";
import clsx from "clsx";
import { Avatar, Logo } from "@/components/ui/ui";
import { SPONSOR } from "@/lib/data";

const NAV = [
  { href: "/sponsor", label: "Overview", icon: LayoutDashboard },
  { href: "/sponsor/care", label: "Care", icon: HeartPulse },
  { href: "/sponsor/family", label: "Family", icon: Users },
  { href: "/sponsor/settings", label: "Settings", icon: Settings },
];

const FOCUS: { prefix: string; exit: string; title: string }[] = [
  { prefix: "/sponsor/fund", exit: "/sponsor/care", title: "Fund care" },
  { prefix: "/sponsor/care/new", exit: "/sponsor/care", title: "Start care" },
  { prefix: "/sponsor/family/new", exit: "/sponsor/family", title: "Add family member" },
];

export function SponsorShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isActive = (h: string) => (h === "/sponsor" ? path === h : path.startsWith(h));
  const focus = FOCUS.find((f) => path.startsWith(f.prefix));

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-white px-4 py-6 lg:flex">
        <Link href="/" className="w-fit px-2" aria-label="CarePass home"><Logo /></Link>
        <Link href="/sponsor/fund" className="mt-8 flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-bold text-white shadow-btn transition hover:bg-brand-700 active:scale-[0.98]">
          <Wallet className="h-[18px] w-[18px]" /> Fund care
        </Link>

        <nav className="mt-6 flex flex-col gap-0.5" aria-label="Sponsor">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined}
              className={clsx("flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition", isActive(n.href) ? "bg-brand-50 text-brand-800" : "text-ink-soft hover:bg-canvas hover:text-ink")}>
              <n.icon className={clsx("h-5 w-5", isActive(n.href) ? "text-brand-600" : "text-ink-mute")} />{n.label}
            </Link>
          ))}
        </nav>

        <div className="mt-7 px-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">Demo views</div>
        <div className="mt-2 flex flex-col gap-0.5">
          <Link href="/pass" className="flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold text-ink-soft transition hover:bg-canvas hover:text-ink">
            <Smartphone className="h-5 w-5 text-ink-mute" /> Family pass
          </Link>
          <Link href="/provider" className="flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold text-ink-soft transition hover:bg-canvas hover:text-ink">
            <ShieldCheck className="h-5 w-5 text-ink-mute" /> Provider desk
          </Link>
        </div>

        <Link href="/sponsor/settings" className="mt-auto flex items-center gap-3 rounded-xl border border-line p-3 transition hover:bg-canvas">
          <Avatar initials={SPONSOR.initials} hue="sun" size={38} />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-bold">{SPONSOR.name}</div>
            <div className="truncate text-xs text-ink-mute">Sponsor · {SPONSOR.location}</div>
          </div>
          <ChevronRight className="h-4 w-4 text-ink-faint" />
        </Link>
      </aside>

      <div className="min-w-0">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-canvas/85 px-4 backdrop-blur-xl sm:px-8 lg:hidden" style={{ paddingTop: "var(--safe-top)", height: "calc(3.5rem + var(--safe-top))" }}>
          {focus ? (
            <>
              <span className="text-[15px] font-bold">{focus.title}</span>
              <Link href={focus.exit} aria-label="Close" className="-mr-2 grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-canvas-2"><X className="h-5 w-5" /></Link>
            </>
          ) : (
            <>
              <Link href="/" aria-label="CarePass home"><Logo /></Link>
              <div className="flex items-center gap-1">
                <Link href="/pass" aria-label="Preview family pass" className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-canvas-2"><Smartphone className="h-5 w-5" /></Link>
                <Link href="/sponsor/settings" aria-label="Settings" className="grid h-10 w-10 place-items-center rounded-full hover:bg-canvas-2"><Avatar initials={SPONSOR.initials} hue="sun" size={30} /></Link>
              </div>
            </>
          )}
        </header>

        <main className={clsx("mx-auto w-full max-w-[1100px] px-4 pt-6 sm:px-8 lg:pt-10", focus ? "pb-28 lg:pb-16" : "pb-32 lg:pb-16")}>{children}</main>

        {/* Mobile bottom nav */}
        {!focus && (
          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/90backdrop-blur-xl lg:hidden" aria-label="Sponsor" style={{ paddingBottom: "var(--safe-bottom)" }}>
            <ul className="mx-auto grid max-w-md grid-cols-5 items-end px-2">
              {[NAV[0], NAV[1], null, NAV[2], NAV[3]].map((n, i) =>
                n ? (
                  <li key={n.href}>
                    <Link href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={clsx("flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition", isActive(n.href) ? "text-brand-700" : "text-ink-mute")}>
                      <n.icon className={clsx("h-[22px] w-[22px]", isActive(n.href) && "stroke-[2.4]")} />{n.label}
                    </Link>
                  </li>
                ) : (
                  <li key={i} className="flex justify-center">
                    <Link href="/sponsor/fund" aria-label="Fund care" className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-glow ring-4 ring-white transition active:scale-95">
                      <Plus className="h-7 w-7" strokeWidth={2.6} />
                    </Link>
                  </li>
                )
              )}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
