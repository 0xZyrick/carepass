"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Home, MapPin, ScanLine } from "lucide-react";
import clsx from "clsx";
import { NoPassYet } from "@/components/States";
import { PassSkeleton } from "@/components/Skeletons";
import { useStore } from "@/lib/store";

const TABS = [
  { href: "/pass", label: "Home", icon: Home },
  { href: "/pass/clinics", label: "Clinics", icon: MapPin },
  { href: "/pass/activity", label: "Activity", icon: Clock },
];

/** The family app. A phone-width column on every screen size (centred on desktop). */
export function PassShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { beneficiaries, activePassId, loading } = useStore();
  const me = beneficiaries.find((b) => b.id === activePassId) ?? beneficiaries[0];
  const paying = path.startsWith("/pass/pay");
  const active = (h: string) => (h === "/pass" ? path === h : path.startsWith(h));

  return (
    <div className="min-h-dvh bg-canvas-2 lg:flex lg:justify-center">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-canvas lg:w-[460px] lg:border-x lg:border-line lg:shadow-pop lg:[transform:translateZ(0)]">
        <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain" style={{ paddingTop: "var(--safe-top)" }}>
          {loading ? <PassSkeleton /> : !me ? <NoPassYet /> : children}
        </div>

        {!paying && me && (
          <nav className="relative z-0 shrink-0 border-t border-line bg-white/95 backdrop-blur-xl" aria-label="Pass" style={{ paddingBottom: "var(--safe-bottom)" }}>
            <ul className="grid grid-cols-4 items-end px-2">
              <TabItem t={TABS[0]} on={active(TABS[0].href)} />
              <TabItem t={TABS[1]} on={active(TABS[1].href)} />
              <li className="flex justify-center">
                <Link href="/pass/pay" aria-label="Pay a clinic" className="-mt-6 grid h-[60px] w-[60px] place-items-center rounded-full bg-brand-500 text-white shadow-glow ring-4 ring-white transition active:scale-95"><ScanLine className="h-7 w-7" /></Link>
              </li>
              <TabItem t={TABS[2]} on={active(TABS[2].href)} />
            </ul>
          </nav>
        )}
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
