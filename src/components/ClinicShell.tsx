"use client";

import { useState } from "react";
import { Logo } from "@/components/ui/ui";
import { AccountSheet } from "@/components/AccountSheet";
import { ClinicSkeleton } from "@/components/Skeletons";
import { useStore } from "@/lib/store";

/** The clinic app: a single, calm column with the clinic's name and account menu on top. */
export function ClinicShell({ children }: { children: React.ReactNode }) {
  const { loading, myClinic, me } = useStore();
  const [account, setAccount] = useState(false);
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Logo />
          <button onClick={() => setAccount(true)} className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-ink-soft shadow-card">{myClinic?.name ?? me?.name ?? "Account"}</button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-16 pt-6">{loading ? <ClinicSkeleton /> : children}</main>
      <AccountSheet open={account} onClose={() => setAccount(false)} />
    </div>
  );
}
