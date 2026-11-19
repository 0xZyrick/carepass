"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Loader2, Lock, ShieldCheck, X } from "lucide-react";
import clsx from "clsx";
import { Avatar, Button } from "@/components/ui/ui";
import { PassCard } from "@/components/PassCard";
import { useStore } from "@/lib/store";
import { FX_RATE, ngn, usd } from "@/lib/format";

const PRESETS = [25, 50, 100, 200, 300];
const STEPS = ["Who", "Amount", "Pay"];
const MIN = 5;

export function FundFlow() {
  const router = useRouter();
  const q = useSearchParams();
  const { beneficiaries, topUp, setActivePassId, fundingProviders, startFunding, syncFunding, toast } = useStore();
  const live = fundingProviders.includes("anchor");
  const METHOD = live ? "Stellar USDC" : "Test funds";
  const [waiting, setWaiting] = useState<{ id: string; url: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const initial = beneficiaries.find((b) => b.id === q.get("to"));
  const [step, setStep] = useState(initial ? 1 : 0);
  const [toId, setToId] = useState(initial?.id ?? "");
  const [amountStr, setAmountStr] = useState(q.get("amount") ?? "100");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ ref: string } | null>(null);
  const finish = (id: string) => { setDone({ ref: "SA-" + id.slice(0, 6).toUpperCase() }); setWaiting(null); };

  const to = beneficiaries.find((b) => b.id === toId);
  const amount = Math.max(0, parseFloat(amountStr) || 0);
  const amountErr = amount < MIN ? `Minimum is $${MIN}` : amount > 1000 ? "Maximum is $1,000" : "";

  // Opens Stellar's secure deposit window, then watches for it to finish. The server credits the pass.
  async function startDeposit() {
    if (!to) return;
    setBusy(true); setFailed(false);
    const win = window.open("", "_blank"); // opened first so the browser doesn't block it
    const f = await startFunding(to.id, amount, "anchor");
    setBusy(false);
    if (!f) { win?.close(); return; }
    if (win) win.location.href = f.url;
    setWaiting(f);
  }

  useEffect(() => {
    if (!waiting) return;
    let alive = true;
    const tick = async () => {
      const r = await syncFunding(waiting.id);
      if (!alive) return;
      if (r === "done") finish(waiting.id);
      else if (r === "failed") { setWaiting(null); setFailed(true); }
    };
    const t = setInterval(tick, 4000);
    return () => { alive = false; clearInterval(t); };
  }, [waiting, syncFunding]);

  async function addTestFunds() {
    if (!to) return;
    setBusy(true);
    const [tx] = await Promise.all([topUp(to.id, amount, METHOD), new Promise((r) => setTimeout(r, 900))]);
    setBusy(false);
    if (tx) setDone({ ref: tx.ref });
  }

  /* ---------- Waiting for the deposit ---------- */
  if (waiting && to) {
    return (
      <div className="mx-auto max-w-md animate-fade-up py-8 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-700"><Loader2 className="h-8 w-8 animate-spin" /></span>
        <h1 className="mt-6 font-display text-3xl font-semibold">Finish in the deposit window</h1>
        <p className="mt-3 text-ink-mute">Complete your {usd(amount)} deposit in the window that just opened. This page updates by itself, and {to.name}'s pass is topped up as soon as it arrives.</p>
        <div className="mt-6 rounded-2xl bg-sun-50 p-4 text-left text-[13px] font-medium text-sun-600">
          Test network: no real money moves. If the window didn't open, use the button below.
        </div>
        <div className="mt-6 grid gap-3">
          <Button size="lg" full variant="outline" icon={<ExternalLink className="h-4 w-4" />} onClick={() => window.open(waiting.url, "_blank")}>Reopen deposit window</Button>
          <Button size="lg" full variant="ghost" onClick={async () => {
            const r = await syncFunding(waiting.id);
            if (r === "done") finish(waiting.id);
            else if (r === "failed") { setWaiting(null); setFailed(true); }
            else toast("Not arrived yet. Give it a few seconds.", "warn");
          }}>I've finished, check now</Button>
          <button onClick={() => setWaiting(null)} className="text-sm font-semibold text-ink-mute hover:text-ink">Cancel</button>
        </div>
      </div>
    );
  }

  /* ---------- Didn't go through ---------- */
  if (failed && to) {
    return (
      <div className="mx-auto max-w-md animate-fade-up py-8 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-700"><X className="h-8 w-8" /></span>
        <h1 className="mt-6 font-display text-3xl font-semibold">The deposit didn't go through</h1>
        <p className="mt-3 text-ink-mute">Nothing was added to {to.name}'s pass. This usually means the test deposit service is busy. Try again in a moment.</p>
        <div className="mt-6 grid gap-3">
          <Button size="lg" full onClick={() => { setFailed(false); startDeposit(); }}>Try again</Button>
          <button onClick={() => { setFailed(false); setStep(1); }} className="text-sm font-semibold text-ink-mute hover:text-ink">Change the amount</button>
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
        <h1 className="mt-7 font-display text-3xl font-semibold">You sent {usd(amount)} to {to.name}</h1>
        <p className="mt-2 text-ink-mute">{to.name}'s pass has {ngn(amount)} more to spend at verified hospitals, labs and pharmacies.</p>
        <div className="mx-auto mt-7 max-w-[320px]"><PassCard name={to.fullName} balance={to.balance} last4={to.last4} hue={to.hue} compact /></div>
        <dl className="mt-7 divide-y divide-line rounded-2xl border border-line bg-white text-left text-sm">
          {[["Reference", done.ref], ["Paid with", live ? "USDC on Stellar" : "Test funds"], ["Amount", usd(amount)]].map(([k, v]) => (
            <div key={k} className="flex justify-between px-4 py-3"><dt className="text-ink-mute">{k}</dt><dd className="font-semibold">{v}</dd></div>
          ))}
        </dl>
        <div className="mt-7 grid gap-3">
          <Button size="lg" full onClick={() => router.push("/sponsor")}>Done</Button>
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
              <h1 className="font-display text-3xl font-semibold sm:text-4xl">Who is it for?</h1>
              <p className="mt-2 text-ink-mute">Choose the family member you're supporting.</p>
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
              <h1 className="font-display text-3xl font-semibold sm:text-4xl">How much for {to.name}?</h1>
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
              <p className="mt-4 flex items-center gap-2 text-sm text-ink-mute"><ShieldCheck className="h-4 w-4 text-brand-600" /> Can only be spent at verified providers ({to.allowed.join(", ")}).</p>
            </>
          )}

          {step === 2 && to && (
            <>
              <h1 className="font-display text-3xl font-semibold sm:text-4xl">Confirm and send</h1>
              <p className="mt-2 text-ink-mute">{live ? `You'll add ${usd(amount)} to ${to.name}'s pass with USDC on Stellar. No fees.` : `Add ${usd(amount)} to ${to.name}'s pass.`}</p>
              {live ? (
                <ol className="card mt-7 divide-y divide-line">
                  {[["Open the deposit window", "A secure Stellar page opens in a new tab."], ["Enter your details", `Choose how to send ${usd(amount)} there.`], [`${to.name}'s pass is topped up`, "This page updates by itself when it arrives."]].map(([t, d], i) => (
                    <li key={t} className="flex items-start gap-4 p-4 sm:p-5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-800">{i + 1}</span>
                      <div><div className="font-bold">{t}</div><div className="text-sm text-ink-mute">{d}</div></div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-7 rounded-2xl bg-sun-50 px-4 py-3 text-[13px] font-medium text-sun-600">Test mode: the funds are added instantly and no real money moves.</p>
              )}
              <p className="mt-5 flex items-center gap-2 text-sm text-ink-mute"><Lock className="h-4 w-4" /> The money goes into {to.name}'s pass and can only be spent on care.</p>
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
            ) : <p className="mt-4 text-sm text-ink-mute">Choose who you're sending to.</p>}
            {to && step >= 1 && (
              <dl className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
                <div className="flex justify-between"><dt className="text-ink-mute">Added to pass</dt><dd className="num font-semibold">{usd(amount)}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-mute">Rate</dt><dd className="font-semibold">$1 = ₦{FX_RATE.toLocaleString()}</dd></div>
                <div className="flex justify-between border-t border-line pt-4 text-base"><dt className="font-bold">Total</dt><dd className="num font-extrabold">{usd(amount)}</dd></div>
                <div className="flex justify-between rounded-xl bg-brand-50 px-3.5 py-3 text-brand-800"><dt className="font-semibold">{to.name} can spend</dt><dd className="font-bold">{ngn(amount)}</dd></div>
              </dl>
            )}
          </div>

          <div className="mt-4">
            {step === 0 && <Button size="lg" full disabled={!to} onClick={() => setStep(1)}>Continue <ArrowRight className="h-5 w-5" /></Button>}
            {step === 1 && <Button size="lg" full disabled={!!amountErr} onClick={() => setStep(2)}>Review {usd(amount)} <ArrowRight className="h-5 w-5" /></Button>}
            {step === 2 && (
              <Button size="lg" full disabled={busy} onClick={live ? startDeposit : addTestFunds}>
                {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> {live ? "Opening deposit window…" : "Adding…"}</> : live ? <>Continue to deposit <ArrowRight className="h-5 w-5" /></> : <>Add {usd(amount)} to {to?.name}'s pass</>}
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
