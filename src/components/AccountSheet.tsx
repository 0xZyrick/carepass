"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { Avatar, Button, Sheet } from "@/components/ui/ui";
import { useStore } from "@/lib/store";

/** Who's signed in, legal links and sign out. Used by the family and clinic apps. */
export function AccountSheet({ open, onClose, phone }: { open: boolean; onClose: () => void; phone?: boolean }) {
  const { me, signOut } = useStore();
  const initials = (me?.name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <Sheet open={open} onClose={onClose} title="Your account" phone={phone}>
      <div className="flex items-center gap-4">
        <Avatar initials={initials} hue="brand" size={56} />
        <div className="min-w-0"><div className="truncate text-lg font-bold">{me?.name}</div><div className="truncate text-sm text-ink-mute">{me?.email}</div></div>
      </div>
      <div className="mt-6 divide-y divide-line rounded-2xl border border-line text-sm font-semibold">
        <Link href="/terms" className="block px-4 py-3.5 hover:bg-canvas">Terms of use</Link>
        <Link href="/privacy" className="block px-4 py-3.5 hover:bg-canvas">Privacy policy</Link>
      </div>
      <Button variant="danger" size="lg" full className="mt-6" icon={<LogOut className="h-5 w-5" />} onClick={async () => { await signOut(); window.location.href = "/signin"; }}>Sign out</Button>
    </Sheet>
  );
}
