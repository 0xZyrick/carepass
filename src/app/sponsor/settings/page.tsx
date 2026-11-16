"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Avatar, Button, PageHeader } from "@/components/ui/ui";
import { useStore } from "@/lib/store";

export default function Settings() {
  const router = useRouter();
  const { toast, me, signOut, seedDemo, previewEnabled, beneficiaries } = useStore();
  const initials = (me?.name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <PageHeader title="Settings" />
      <section className="card flex items-center gap-4 p-5">
        <Avatar initials={initials} hue="sun" size={60} />
        <div className="min-w-0 flex-1"><div className="truncate text-lg font-bold">{me?.name}</div><div className="truncate text-sm text-ink-mute">{me?.email}</div></div>
      </section>

      <div className="card mt-6 divide-y divide-line/70 text-[15px] font-semibold">
        <Link href="/terms" className="block px-5 py-4 hover:bg-canvas">Terms of use</Link>
        <Link href="/privacy" className="block px-5 py-4 hover:bg-canvas">Privacy policy</Link>
        <Link href="/about" className="block px-5 py-4 hover:bg-canvas">How CarePass works</Link>
      </div>

      {previewEnabled && (
        <section className="mt-8 rounded-3xl border border-dashed border-line-strong p-5">
          <h2 className="font-sans text-sm font-bold">Sample data</h2>
          <p className="mt-1 text-sm text-ink-mute">For trying CarePass out. Adds a sample family with a few weeks of history.</p>
          <Button variant="outline" className="mt-4" onClick={async () => {
            const has = beneficiaries.length > 0;
            if (has && !confirm("Replace your family members with the sample family? This deletes your current passes and history.")) return;
            if (await seedDemo(has)) toast("Sample data loaded");
          }}>{beneficiaries.length ? "Replace with sample family" : "Load sample family"}</Button>
        </section>
      )}
      <Button variant="danger" size="lg" full className="mt-8" icon={<LogOut className="h-5 w-5" />} onClick={async () => { await signOut(); router.push("/signin"); }}>Sign out</Button>
    </div>
  );
}
