"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/ui";
import { useStore } from "@/lib/store";

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="grid min-h-[50dvh] place-items-center text-ink-mute" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm font-semibold"><Loader2 className="h-5 w-5 animate-spin text-brand-500" />{label}</div>
    </div>
  );
}

/** Shown to a sponsor with no passes yet. */
export function FirstFamily() {
  const { seedDemo, previewEnabled, me } = useStore();
  const [busy, setBusy] = useState(false);
  return (
    <div className="mx-auto max-w-md animate-fade-up py-10 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-brand-50 text-brand-700"><UserPlus className="h-8 w-8" /></span>
      <h1 className="mt-6 text-3xl font-extrabold">Welcome{me?.name ? `, ${me.name.split(" ")[0]}` : ""}</h1>
      <p className="mt-2 text-ink-mute">Add the family member you support. You set the rules, and funds can only be spent at verified clinics, labs and pharmacies.</p>
      <div className="mt-8 grid gap-3">
        <Button href="/sponsor/family/new" size="lg" full icon={<UserPlus className="h-5 w-5" />}>Add a family member</Button>
        {previewEnabled && (
          <Button size="lg" full variant="outline" disabled={busy} icon={busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            onClick={async () => { setBusy(true); await seedDemo(); setBusy(false); }}>
            Load a sample family
          </Button>
        )}
      </div>
      {previewEnabled && <p className="mt-4 text-xs text-ink-mute">Sample data adds two passes with a few weeks of history so you can explore every screen.</p>}
    </div>
  );
}

export function NoPassYet() {
  const { me, signOut } = useStore();
  return (
    <div className="px-6 py-16 text-center">
      <h1 className="font-display text-2xl font-extrabold">No pass yet</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-mute">Ask your sponsor to create a CarePass for <strong className="break-all text-ink">{me?.email}</strong>. It will appear here as soon as they do.</p>
      <button onClick={async () => { await signOut(); window.location.href = "/signin"; }} className="mt-6 text-sm font-bold text-brand-700">Sign out</button>
    </div>
  );
}
