"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, ExternalLink, Loader2 } from "lucide-react";
import { Button, Stamp } from "@/components/ui/ui";
import { useStore } from "@/lib/store";
import { dayLabel, usd } from "@/lib/format";
import { receiptUrl } from "@/lib/site";

type Payout = { id: string; status: "pending" | "sent" | "completed" | "failed"; amountUsd: number; sentTx: string | null; at: string };
type Info = { enabled: boolean; balanceUsd: number; payouts: Payout[] };

async function api<T>(url: string, method = "GET"): Promise<{ ok: boolean; json: T & { error?: string } }> {
  try {
    const r = await fetch(url, { method, headers: { "content-type": "application/json" } });
    return { ok: r.ok, json: await r.json().catch(() => ({})) };
  } catch { return { ok: false, json: { error: "You appear to be offline." } as T & { error?: string } }; }
}

/** Cash out received USDC through Stellar's anchor. Hidden when the network isn't connected. */
export function CashOut({ verified, refreshKey }: { verified: boolean; refreshKey: number }) {
  const { toast } = useStore();
  const [info, setInfo] = useState<Info | null>(null);
  const [waiting, setWaiting] = useState<{ id: string; url: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { const r = await api<Info>("/api/clinic/payout"); if (r.ok) setInfo(r.json); }, []);
  useEffect(() => { load(); }, [load, refreshKey]);

  useEffect(() => {
    if (!waiting) return;
    let alive = true;
    const tick = async () => {
      const r = await api<{ payout: Payout }>(`/api/clinic/payout/${waiting.id}/sync`, "POST");
      if (!alive || !r.ok) return;
      const s = r.json.payout.status;
      if (s === "completed") { toast("Cash-out complete."); setWaiting(null); load(); }
      else if (s === "failed") { toast("The cash-out didn't go through. Nothing was sent.", "warn"); setWaiting(null); load(); }
      else if (s === "sent") load();
    };
    tick();
    const t = setInterval(tick, 4000);
    return () => { alive = false; clearInterval(t); };
  }, [waiting, toast, load]);

  async function start() {
    setBusy(true);
    const win = window.open("", "_blank"); // opened first so the browser doesn't block it
    const r = await api<{ id: string; url: string }>("/api/clinic/payout", "POST");
    setBusy(false);
    if (!r.ok) { win?.close(); toast(r.json.error ?? "Couldn't start the cash-out.", "warn"); return; }
    if (win) win.location.href = r.json.url;
    setWaiting({ id: r.json.id, url: r.json.url });
  }

  if (!info?.enabled) return null;
  const label = (p: Payout) => (p.status === "completed" ? <Stamp tone="ok">Paid out</Stamp> : p.status === "failed" ? <Stamp tone="no">Failed</Stamp> : <Stamp tone="wait">Processing</Stamp>);

  return (
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-ink-mute">Ready to cash out</div>
          <div className="num mt-1 text-3xl font-extrabold">{usd(info.balanceUsd)}</div>
        </div>
        {!waiting && <Button disabled={busy || !verified || info.balanceUsd < 1} onClick={start} icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}>Cash out</Button>}
      </div>
      {!verified && <p className="mt-3 text-[13px] text-ink-mute">Cash-out opens once your clinic is verified.</p>}
      {waiting && (
        <div className="mt-4 rounded-2xl bg-brand-50 p-4 text-[13px] text-brand-800">
          <div className="flex items-center gap-2 font-semibold"><Loader2 className="h-4 w-4 animate-spin" /> Finish in the cash-out window</div>
          <p className="mt-1">Choose your amount there. We send your USDC to the anchor automatically and this page updates when it's done.</p>
          <div className="mt-3 flex gap-4 font-semibold">
            <button onClick={() => window.open(waiting.url, "_blank")} className="inline-flex items-center gap-1 underline"><ExternalLink className="h-3.5 w-3.5" /> Reopen window</button>
            <button onClick={() => setWaiting(null)} className="text-ink-mute underline">Hide</button>
          </div>
        </div>
      )}
      {info.payouts.length > 0 && (
        <ul className="mt-4 divide-y divide-line border-t border-line text-sm">
          {info.payouts.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0"><span className="num font-bold">{p.amountUsd > 0 ? usd(p.amountUsd) : "Cash-out"}</span>
                <span className="text-ink-mute"> · {dayLabel(Math.floor((Date.now() - new Date(p.at).getTime()) / 864e5))}{p.sentTx && <> · <a href={receiptUrl(p.sentTx)} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 underline">Network receipt</a></>}</span></div>
              {label(p)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
