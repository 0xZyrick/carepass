"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LayoutDashboard, Plus, Receipt, Settings, ShieldCheck, Smartphone, Users } from "lucide-react";
import clsx from "clsx";
import { Avatar, Logo } from "@/components/ui/ui";
import { DemoPill } from "@/components/DemoPill";
import { FirstFamily, Loading } from "@/components/States";
import { useStore } from "@/lib/store";

const NAV = [
  { href: "/sponsor", label: "Overview", icon: LayoutDashboard },
  { href: "/sponsor/family", label: "Family", icon: Users },
  { href: "/sponsor/activity", label: "Activity", icon: Receipt },
  { href: "/sponsor/settings", label: "Settings", icon: Settings },
];

export function SponsorShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { requests, me, loading, beneficiaries } = useStore();
  const initials = (me?.name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const needsFirst = !loading && beneficiaries.length === 0 && !path.startsWith("/sponsor/family/new") && !path.startsWith("/sponsor/settings");
  const isActive = (h: string) => (h === "/sponsor" ? path === h : path.startsWith(h));
  const fundFlow = path.startsWith("/sponsor/fund");

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-white px-4 py-6 lg:flex">
        <Link href="/" className="px-3" aria-label="CarePass home"><Logo /></Link>
        <Link href="/sponsor/fund" className="mt-8 flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-500 text-sm font-bold text-white shadow-glow transition hover:bg-brand-600 active:scale-[0.98]">
          <Plus className="h-5 w-5" strokeWidth={2.6} /> Fund care
        </Link>
        <nav className="mt-6 flex flex-col gap-1" aria-label="Sponsor">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined}
              className={clsx("flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition", isActive(n.href) ? "bg-brand-50 text-brand-800" : "text-ink-soft hover:bg-canvas")}>
              <n.icon className="h-5 w-5" />{n.label}
              {n.href === "/sponsor" && requests.length > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">{requests.length}</span>}
            </Link>
          ))}
          <Link href="/guardrails" className="flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold text-ink-soft transition hover:bg-canvas">
            <ShieldCheck className="h-5 w-5" /> Guardrail lab
          </Link>
        </nav>

        <div className="mt-auto space-y-3">
          <DemoPill className="w-full justify-center" />
          <Link href="/pass" className="flex items-center gap-3 rounded-2xl bg-sun-50 p-3.5 text-sm font-semibold text-sun-600 transition hover:bg-sun-100">
            <Smartphone className="h-5 w-5" />
            <span className="leading-tight">Preview family pass<span className="block text-xs font-medium opacity-80">See what they see</span></span>
          </Link>
          <div className="flex items-center gap-3 rounded-2xl border border-line p-3">
            <Avatar initials={initials} hue="sun" size={38} />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-bold">{me?.name ?? "…"}</div>
              <div className="truncate text-xs text-ink-mute">Sponsor</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Mobile top bar */}
        {!fundFlow && (
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-canvas/90 px-5 backdrop-blur-xl lg:hidden" style={{ paddingTop: "var(--safe-top)" }}>
            <Link href="/" aria-label="CarePass home"><Logo /></Link>
            <div className="flex items-center gap-1">
              <Link href="/pass" aria-label="Preview family pass" className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-canvas-2"><Smartphone className="h-5 w-5" /></Link>
              <Link href="/sponsor" aria-label={`Notifications${requests.length ? `, ${requests.length} new` : ""}`} className="relative grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-canvas-2">
                <Bell className="h-5 w-5" />
                {requests.length > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-canvas" />}
              </Link>
            </div>
          </header>
        )}

        <main className={clsx("mx-auto w-full max-w-5xl px-5 pt-6 sm:px-8 lg:pt-10", fundFlow ? "pb-10" : "pb-32 lg:pb-16")}>{loading ? <Loading /> : needsFirst ? <FirstFamily /> : children}</main>

        {/* Mobile bottom nav */}
        {!fundFlow && (
          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-xl lg:hidden" aria-label="Sponsor" style={{ paddingBottom: "var(--safe-bottom)" }}>
            <ul className="mx-auto grid max-w-md grid-cols-5 items-end px-2">
              {[NAV[0], NAV[1], null, NAV[2], NAV[3]].map((n, i) =>
                n ? (
                  <li key={n.href}>
                    <Link href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={clsx("flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold", isActive(n.href) ? "text-brand-700" : "text-ink-mute")}>
                      <n.icon className={clsx("h-[22px] w-[22px]", isActive(n.href) && "stroke-[2.4]")} />{n.label}
                    </Link>
                  </li>
                ) : (
                  <li key={i} className="flex justify-center">
                    <Link href="/sponsor/fund" aria-label="Fund care" className="-mt-5 grid h-14 w-14 place-items-center rounded-full bg-brand-500 text-white shadow-glow ring-4 ring-white transition active:scale-95">
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
