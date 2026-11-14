"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Building, Check, CreditCard, ExternalLink, Loader2, Lock, ShieldCheck, Wallet, X } from "lucide-react";
import clsx from "clsx";
import { Avatar, Button } from "@/components/ui/ui";
import { PassCard } from "@/components/PassCard";
import { useStore } from "@/lib/store";
import { FX_RATE, fundingFee, ngn, usd } from "@/lib/format";

const METHODS = [
  { id: "Visa •••• 4242", title: "Visa •••• 4242", sub: "Instant · Debit card", icon: CreditCard },
  { id: "Bank transfer", title: "Bank transfer", sub: "Faster Payments · Usually under 1 hour", icon: Building },
  { id: "USDC wallet", title: "USDC wallet", sub: "Pay directly from your wallet", icon: Wallet },
];
const PRESETS = [25, 50, 100, 200, 300];
const STEPS = ["Who", "Amount", "Review"];

export function FundFlow() {
  const router = useRouter();
  const q = useSearchParams();
  const { beneficiaries, topUp, setActivePassId, fundingProvider, startFunding, syncFunding, toast } = useStore();
  const live = fundingProvider === "moonpay";
  const [waiting, setWaiting] = useState<{ id: string; url: string } | null>(null);
  const initial = beneficiaries.find((b) => b.id === q.get("to"));
  const [step, setStep] = useState(initial ? 1 : 0);
  const [toId, setToId] = useState(initial?.id ?? "");
  const [amountStr, setAmountStr] = useState(q.get("amount") ?? "100");
  const [method, setMethod] = useState(METHODS[0].id);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ ref: string } | null>(null);

  const to = beneficiaries.find((b) => b.id === toId);
  const amount = Math.max(0, parseFloat(amountStr) || 0);
  const fee = fundingFee(amount);
  const total = amount + fee;
  const minAmt = live ? 20 : 10;
  const amountErr = amount < minAmt ? `Minimum top-up is $${minAmt}` : amount > 1000 ? "Maximum top-up is $1,000" : "";

  // MoonPay: open the hosted checkout, then watch for it to complete. The pass is credited by the server.
  async function startCheckout() {
    if (!to) return;
    setBusy(true);
    const win = window.open("", "_blank"); // opened first so the browser doesn't block it
    const f = await startFunding(to.id, amount);
    setBusy(false);
    if (!f) { win?.close(); return; }
    if (win) win.location.href = f.url;
    setWaiting(f);
  }

  useEffect(() => {
    if (!waiting) return;
    let alive = true;
    const tick = async () => { if (await syncFunding(waiting.id) && alive) { setDone({ ref: "MP-" + waiting.id.slice(0, 6).toUpperCase() }); setWaiting(null); } };
    const t = setInterval(tick, 4000);
    return () => { alive = false; clearInterval(t); };
  }, [waiting, syncFunding]);

  async function pay() {
    if (!to) return;
    setBusy(true);
    const [tx] = await Promise.all([topUp(to.id, amount, method), new Promise((r) => setTimeout(r, 900))]);
    setBusy(false);
    if (tx) setDone({ ref: tx.ref });
  }

  /* ---------- Waiting for MoonPay ---------- */
  if (waiting && to) {
    return (
      <div className="mx-auto max-w-md animate-fade-up py-8 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-700"><Loader2 className="h-8 w-8 animate-spin" /></span>
        <h1 className="mt-6 text-3xl font-extrabold">Finish in the MoonPay window</h1>
        <p className="mt-3 text-ink-mute">Complete the purchase there. This page updates on its own the moment MoonPay confirms, and {to.name}'s pass is credited.</p>
        <div className="mt-6 rounded-2xl bg-sun-50 p-4 text-left text-[13px] font-medium text-sun-600">
          Sandbox: use test card <span className="font-mono font-bold">4000 0200 0000 0000</span> (US) or <span className="font-mono font-bold">4242 4242 4242 4242</span> (UK), any future expiry and any 3-digit CVV. Nothing is charged.
        </div>
        <div className="mt-6 grid gap-3">
          <Button size="lg" full variant="outline" icon={<ExternalLink className="h-4 w-4" />} onClick={() => window.open(waiting.url, "_blank")}>Reopen MoonPay</Button>
          <Button size="lg" full variant="ghost" onClick={async () => { const ok = await syncFunding(waiting.id); if (ok) { setDone({ ref: "MP-" + waiting.id.slice(0, 6).toUpperCase() }); setWaiting(null); } else toast("Not confirmed yet. Give it a few seconds.", "warn"); }}>I've finished, check now</Button>
          <button onClick={() => setWaiting(null)} className="text-sm font-semibold text-ink-mute hover:text-ink">Cancel</button>
        </div>
      </div>
    );
  }

  /* ---------- Success ---------- */
  if (done && to) {
    return (
      <div className="mx-auto max-w-md animate-fade-up py-6 text-center">
        <div className="relative mx-auto grid h-24 w-24 place-items-center">
          <span className="absolute inset-0 animate-ring rounded-full bg-brand-500/40" />
          <span className="relative grid h-24 w-24 place-items-center rounded-full bg-brand-500 text-white shadow-glow">
            <svg viewBox="0 0 24 24" className="h-11 w-11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24" strokeDashoffset="24" className="animate-draw" />
            </svg>
          </span>
        </div>
        <h1 className="mt-7 text-3xl font-extrabold">{usd(amount)} sent to {to.name}</h1>
        <p className="mt-2 text-ink-mute">{to.name}'s care credit is available right now — {ngn(amount)} for hospitals, labs and pharmacies.</p>
        <div className="mx-auto mt-7 max-w-[320px]"><PassCard name={to.fullName} balance={to.balance} last4={to.last4} hue={to.hue} compact /></div>
        <dl className="mt-7 divide-y divide-line rounded-2xl border border-line bg-white text-left text-sm">
          {[["Reference", done.ref], ["Paid with", live ? "MoonPay (sandbox)" : method], ["Total charged", usd(total)]].map(([k, v]) => (
            <div key={k} className="flex justify-between px-4 py-3"><dt className="text-ink-mute">{k}</dt><dd className="font-semibold">{v}</dd></div>
          ))}
        </dl>
        <div className="mt-7 grid gap-3">
          <Button size="lg" full onClick={() => router.push("/sponsor")}>Back to overview</Button>
          <Button size="lg" full variant="outline" onClick={() => { setActivePassId(to.id); router.push("/pass"); }}>See it on {to.name}'s pass</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <button onClick={() => (step === 0 ? router.push("/sponsor") : setStep(step - 1))} className="flex h-11 items-center gap-2 rounded-xl pr-3 text-sm font-semibold text-ink-soft hover:text-ink" aria-label="Back">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-card"><ArrowLeft className="h-5 w-5" /></span>
          <span className="hidden sm:inline">Back</span>
        </button>
        <ol className="flex flex-1 items-center justify-center gap-2 sm:gap-3" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2 sm:gap-3">
              <span className={clsx("grid h-8 w-8 place-items-center rounded-full text-[13px] font-bold transition", i < step ? "bg-brand-500 text-white" : i === step ? "bg-ink text-white" : "bg-canvas-2 text-ink-faint")}>
                {i < step ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className={clsx("text-sm font-semibold", i === step ? "text-ink" : "hidden text-ink-faint sm:inline")}>{s}</span>
              {i < 2 && <span className="h-px w-5 bg-line-strong sm:w-10" />}
            </li>
          ))}
        </ol>
        <Link href="/sponsor" aria-label="Cancel" className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-canvas-2"><X className="h-5 w-5" /></Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="animate-fade-in" key={step}>
          {step === 0 && (
            <>
              <h1 className="text-3xl font-extrabold sm:text-4xl">Who are you funding?</h1>
              <p className="mt-2 text-ink-mute">Choose the family member who needs care credit.</p>
              <div className="mt-7 space-y-3" role="radiogroup" aria-label="Beneficiary">
                {beneficiaries.map((b) => (
                  <button key={b.id} role="radio" aria-checked={toId === b.id} onClick={() => setToId(b.id)}
                    className={clsx("flex w-full items-center gap-4 rounded-3xl border-2 bg-white p-4 text-left transition sm:p-5", toId === b.id ? "border-brand-500 ring-4 ring-brand-500/10" : "border-line hover:border-line-strong")}>
                    <Avatar initials={b.initials} hue={b.hue} size={52} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">{b.fullName}</div>
                      <div className="text-sm text-ink-mute">{b.relation} · {b.city} · Balance {usd(b.balance)}</div>
                    </div>
                    <span className={clsx("grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition", toId === b.id ? "border-brand-500 bg-brand-500 text-white" : "border-line-strong")}>
                      {toId === b.id && <Check className="h-3.5 w-3.5" strokeWidth={3.5} />}
                    </span>
                  </button>
                ))}
                <Link href="/sponsor/family/new" className="flex items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-line-strong p-4 text-sm font-semibold text-ink-mute transition hover:border-brand-500 hover:text-brand-700">+ Add someone new</Link>
              </div>
            </>
          )}

          {step === 1 && to && (
            <>
              <h1 className="text-3xl font-extrabold sm:text-4xl">How much for {to.name}?</h1>
              <p className="mt-2 text-ink-mute">You'll see the exact fee and Naira value before paying.</p>
              <div className="card mt-7 p-6 text-center sm:p-8">
                <label className="eyebrow" htmlFor="amt">Amount (USD)</label>
                <div className="mt-3 flex items-center justify-center gap-1">
                  <span className="num text-5xl font-extrabold text-ink-faint sm:text-6xl">$</span>
                  <input id="amt" inputMode="decimal" value={amountStr} aria-invalid={!!amountErr} onChange={(e) => setAmountStr(e.target.value.replace(/[^\d.]/g, "").slice(0, 7))}
                    className="num w-[7ch] max-w-full bg-transparent text-center text-5xl font-extrabold outline-none sm:text-6xl" style={{ width: `${Math.max(2, amountStr.length + 1)}ch` }} />
                </div>
                <div className="mt-2 text-lg font-semibold text-brand-700">≈ {ngn(amount)}</div>
                {amountErr && <p className="mt-2 text-sm font-medium text-rose-700">{amountErr}</p>}
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {PRESETS.map((p) => (
                    <button key={p} onClick={() => setAmountStr(String(p))} className={clsx("h-11 rounded-full border px-5 text-sm font-bold transition", amount === p ? "border-brand-500 bg-brand-50 text-brand-800" : "border-line-strong hover:border-ink-faint")}>${p}</button>
                  ))}
                </div>
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm text-ink-mute"><ShieldCheck className="h-4 w-4 text-brand-600" /> Only spendable at verified {to.allowed.join(", ")} merchants.</p>
            </>
          )}

          {step === 2 && to && (
            <>
              <h1 className="text-3xl font-extrabold sm:text-4xl">Review & pay</h1>
              <p className="mt-2 text-ink-mute">{live ? "You'll pay securely with MoonPay." : "Choose how you'd like to pay."}</p>
              {live ? (
                <div className="mt-7 flex items-center gap-4 rounded-2xl border-2 border-brand-500 bg-white p-4 ring-4 ring-brand-500/10">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-canvas text-ink-soft"><CreditCard className="h-5 w-5" /></span>
                  <div className="flex-1"><div className="font-bold">Card or bank via MoonPay</div><div className="text-sm text-ink-mute">Licensed checkout · opens in a new window</div></div>
                  <Check className="h-5 w-5 text-brand-600" strokeWidth={3} />
                </div>
              ) : (
              <div className="mt-7 space-y-3" role="radiogroup" aria-label="Payment method">
                {METHODS.map((m) => (
                  <button key={m.id} role="radio" aria-checked={method === m.id} onClick={() => setMethod(m.id)}
                    className={clsx("flex w-full items-center gap-4 rounded-2xl border-2 bg-white p-4 text-left transition", method === m.id ? "border-brand-500 ring-4 ring-brand-500/10" : "border-line hover:border-line-strong")}>
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-canvas text-ink-soft"><m.icon className="h-5 w-5" /></span>
                    <div className="flex-1"><div className="font-bold">{m.title}</div><div className="text-sm text-ink-mute">{m.sub}</div></div>
                    <span className={clsx("grid h-6 w-6 place-items-center rounded-full border-2", method === m.id ? "border-brand-500 bg-brand-500 text-white" : "border-line-strong")}>{method === m.id && <Check className="h-3.5 w-3.5" strokeWidth={3.5} />}</span>
                  </button>
                ))}
              </div>
              )}
              <p className="mt-5 flex items-center gap-2 text-sm text-ink-mute"><Lock className="h-4 w-4" /> Encrypted. Funds go to {to.name}'s merchant-locked wallet, never to cash.</p>
              <p className="mt-2 flex items-center gap-2 rounded-xl bg-sun-50 px-3.5 py-2.5 text-[13px] font-medium text-sun-600">{live ? "MoonPay sandbox: test cards only, no real money moves." : "Sandbox funding: no real card is charged and no real money moves."}</p>
            </>
          )}
        </div>

        {/* summary */}
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <div className="card p-5 sm:p-6">
            <div className="eyebrow">Summary</div>
            {to ? (
              <div className="mt-4 flex items-center gap-3">
                <Avatar initials={to.initials} hue={to.hue} size={44} />
                <div className="leading-tight"><div className="font-bold">{to.fullName}</div><div className="text-sm text-ink-mute">{to.city} · •••• {to.last4}</div></div>
              </div>
            ) : <p className="mt-4 text-sm text-ink-mute">Select who you're funding to continue.</p>}
            {to && step >= 1 && (
              <dl className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
                <div className="flex justify-between"><dt className="text-ink-mute">Care credit</dt><dd className="num font-semibold">{usd(amount)}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-mute">Funding fee ({amount > 0 ? "1%" : "—"})</dt><dd className="num font-semibold">{usd(fee)}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-mute">Exchange rate</dt><dd className="font-semibold">$1 = ₦{FX_RATE.toLocaleString()}</dd></div>
                <div className="flex justify-between border-t border-line pt-4 text-base"><dt className="font-bold">You pay</dt><dd className="num font-extrabold">{usd(total)}</dd></div>
                <div className="flex justify-between rounded-xl bg-brand-50 px-3.5 py-3 text-brand-800"><dt className="font-semibold">{to.name} receives</dt><dd className="font-bold">{ngn(amount)}</dd></div>
              </dl>
            )}
          </div>

          <div className="mt-4">
            {step === 0 && <Button size="lg" full disabled={!to} onClick={() => setStep(1)}>Continue <ArrowRight className="h-5 w-5" /></Button>}
            {step === 1 && <Button size="lg" full disabled={!!amountErr} onClick={() => setStep(2)}>Review {usd(amount)} <ArrowRight className="h-5 w-5" /></Button>}
            {step === 2 && (
              <Button size="lg" full disabled={busy} onClick={live ? startCheckout : pay}>
                {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> {live ? "Opening MoonPay…" : "Processing…"}</> : <><Lock className="h-4 w-4" /> {live ? `Continue to MoonPay · ${usd(total)}` : `Pay ${usd(total)}`}</>}
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
