"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, BadgeCheck, Check, Loader2, Lock, ShieldCheck, ShieldX, X } from "lucide-react";
import clsx from "clsx";
import { Button, CatIcon } from "@/components/ui/ui";
import { Keypad } from "@/components/Keypad";
import { useStore } from "@/lib/store";
import { Beneficiary, Merchant, MERCHANTS, PERSONAL_SHORT, PERSONAL_WALLET } from "@/lib/data";
import type { Decision } from "@/lib/guardrail";
import { ngn, usd } from "@/lib/format";

type Dest = { name: string; short: string; addr: string; merchant?: Merchant };
type Step = "scan" | "amount" | "pin" | "checking" | "result";
const NOTES = ["Consultation", "Medicine", "Lab test", "Admission"];

const toDest = (m: Merchant): Dest => ({ name: m.name, short: m.short, addr: m.addr, merchant: m });
const UNKNOWN: Dest = { name: "Unknown terminal", short: PERSONAL_SHORT, addr: PERSONAL_WALLET };

export function PayFlow() {
  const router = useRouter();
  const q = useSearchParams();
  const { beneficiaries, activePassId, pay } = useStore();
  const b = (beneficiaries.find((x) => x.id === activePassId) ?? beneficiaries[0]) as Beneficiary;
  const preset = MERCHANTS.find((m) => m.id === q.get("m"));

  const [step, setStep] = useState<Step>(preset ? "amount" : "scan");
  const [dest, setDest] = useState<Dest | null>(preset ? toDest(preset) : null);
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState(NOTES[0]);
  const [pin, setPin] = useState("");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [ref, setRef] = useState("");

  const amount = parseFloat(amt) || 0;
  const cityMerchants = MERCHANTS.filter((m) => m.city === b.city);
  const scenarios: Dest[] = [
    toDest(cityMerchants.find((m) => m.type === "hospital")!),
    toDest(cityMerchants.find((m) => m.type === "pharmacy")!),
    UNKNOWN,
  ];

  const pick = (d: Dest) => { setDest(d); setStep("amount"); };
  const key = (k: string) => setAmt((a) => k === "del" ? a.slice(0, -1) : k === "." ? (a.includes(".") || !a ? a || "0." : a + ".") : a.length >= 6 || /\.\d{2}$/.test(a) ? a : a === "0" ? k : a + k);

  function pinKey(k: string) {
    if (k === "del") return setPin((p) => p.slice(0, -1));
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      setTimeout(async () => {
        setStep("checking");
        // The guardrail runs on the server; we only show its verdict.
        const [res] = await Promise.all([pay(b.id, dest!.addr, amount, note), new Promise((r) => setTimeout(r, 1100))]);
        if (!res) { setStep("amount"); return; }
        setDecision(res.decision);
        setRef(res.tx.ref);
        setStep("result");
      }, 250);
    }
  }

  useEffect(() => { if (step !== "pin") setPin(""); }, [step]);

  const Top = ({ onBack, title }: { onBack?: () => void; title: string }) => (
    <div className="flex items-center justify-between px-5 pb-2 pt-5">
      {onBack ? <button onClick={onBack} aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-card"><ArrowLeft className="h-5 w-5" /></button> : <span className="h-10 w-10" />}
      <h1 className="font-sans text-base font-bold">{title}</h1>
      <Link href="/pass" aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-card"><X className="h-5 w-5" /></Link>
    </div>
  );

  /* ---------- SCAN ---------- */
  if (step === "scan")
    return (
      <div className="flex min-h-full flex-col animate-fade-in bg-brand-950 text-white">
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <span className="h-10 w-10" /><h1 className="font-sans text-base font-bold">Scan to pay</h1>
          <Link href="/pass" aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><X className="h-5 w-5" /></Link>
        </div>
        <div className="relative mx-auto mt-4 aspect-square w-[72%] max-w-[300px]">
          {["left-0 top-0 border-l-4 border-t-4 rounded-tl-3xl", "right-0 top-0 border-r-4 border-t-4 rounded-tr-3xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-3xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-3xl"].map((c) => <span key={c} className={clsx("absolute h-12 w-12 border-brand-400", c)} />)}
          <span className="absolute inset-x-4 h-0.5 animate-scan rounded-full bg-brand-400 shadow-[0_0_20px_4px_rgba(47,185,133,.7)]" />
          <div className="absolute inset-6 grid place-items-center rounded-2xl bg-white/[0.04] text-center text-sm text-white/50">Point at the clinic's QR code</div>
        </div>
        <div className="mt-8 flex-1 rounded-t-[32px] bg-[#F8F7F2] px-5 pb-8 pt-6 text-ink">
          <div className="eyebrow">Demo · choose a QR to scan</div>
          <div className="mt-3 space-y-2.5">
            {scenarios.map((d) => (
              <button key={d.addr} onClick={() => pick(d)} className="flex w-full items-center gap-3.5 rounded-2xl bg-white p-3.5 text-left shadow-card transition active:scale-[0.99]">
                {d.merchant ? <CatIcon type={d.merchant.type} /> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-700"><AlertTriangle className="h-5 w-5" /></span>}
                <div className="min-w-0 flex-1"><div className="truncate text-[15px] font-bold">{d.merchant ? `${d.name} terminal` : "Personal wallet QR"}</div><div className="truncate font-mono text-xs text-ink-mute">{d.short}</div></div>
                {d.merchant ? <BadgeCheck className="h-5 w-5 text-brand-500" /> : <span className="text-xs font-bold text-rose-700">Unverified</span>}
              </button>
            ))}
          </div>
          <Link href="/pass/clinics" className="mt-5 block text-center text-sm font-semibold text-brand-700">Or pick a clinic from the list</Link>
        </div>
      </div>
    );

  /* ---------- AMOUNT ---------- */
  if (step === "amount" && dest)
    return (
      <div className="flex min-h-full animate-fade-in flex-col">
        <Top title="Enter amount" onBack={() => (preset ? router.back() : setStep("scan"))} />
        <div className="px-5">
          <div className={clsx("flex items-center gap-3.5 rounded-2xl p-3.5", dest.merchant ? "bg-white shadow-card" : "bg-rose-50 ring-1 ring-rose-100")}>
            {dest.merchant ? <CatIcon type={dest.merchant.type} /> : <span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-100 text-rose-700"><AlertTriangle className="h-5 w-5" /></span>}
            <div className="min-w-0 flex-1"><div className="truncate font-bold">{dest.name}</div><div className="truncate font-mono text-xs text-ink-mute">{dest.short}</div></div>
            {dest.merchant ? <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700"><BadgeCheck className="h-3.5 w-3.5" /> Verified</span> : <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700">Not verified</span>}
          </div>
          {!dest.merchant && <p className="mt-3 text-[13px] leading-relaxed text-rose-700">This isn't a verified care provider. CarePass will block this payment.</p>}
        </div>
        <div className="mt-6 flex-1 text-center">
          <div className="num text-[56px] font-extrabold leading-none"><span className="text-ink-faint">$</span>{amt || "0"}</div>
          <div className="mt-2 font-semibold text-brand-700">{amount > 0 ? `≈ ${ngn(amount)}` : "Enter an amount"}</div>
          <div className="no-scrollbar mt-4 flex justify-center gap-2 overflow-x-auto px-5">{NOTES.map((n) => <button key={n} onClick={() => setNote(n)} className={clsx("h-9 shrink-0 rounded-full border px-3.5 text-[13px] font-semibold", note === n ? "border-ink bg-ink text-white" : "border-line-strong bg-white")}>{n}</button>)}</div>
        </div>
        <div className="px-5 pb-6">
          <Keypad onKey={key} dot />
          <Button size="lg" full className="mt-3" disabled={amount <= 0} onClick={() => setStep("pin")}>{dest.merchant ? `Pay ${usd(amount)}` : `Attempt ${usd(amount)}`}</Button>
        </div>
      </div>
    );

  /* ---------- PIN ---------- */
  if (step === "pin")
    return (
      <div className="flex min-h-full animate-fade-in flex-col">
        <Top title="Confirm" onBack={() => setStep("amount")} />
        <div className="flex-1 px-5 pt-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Lock className="h-6 w-6" /></span>
          <h2 className="mt-5 font-display text-2xl font-extrabold">Enter your PIN</h2>
          <p className="mt-1 text-sm text-ink-mute">to pay {usd(amount)} to {dest?.name}</p>
          <div className="mt-8 flex justify-center gap-4" aria-label={`${pin.length} of 4 digits entered`}>
            {[0, 1, 2, 3].map((i) => <span key={i} className={clsx("h-4 w-4 rounded-full border-2 transition", i < pin.length ? "scale-110 border-brand-500 bg-brand-500" : "border-line-strong")} />)}
          </div>
          <p className="mt-6 text-xs font-medium text-sun-600">Demo: any 4 digits work as the PIN</p>
        </div>
        <div className="px-5 pb-8"><Keypad onKey={pinKey} /></div>
      </div>
    );

  /* ---------- CHECKING ---------- */
  if (step === "checking")
    return (
      <div className="grid min-h-full place-items-center px-8 text-center">
        <div>
          <div className="relative mx-auto grid h-20 w-20 place-items-center"><span className="absolute inset-0 animate-ring rounded-full bg-brand-500/30" /><Loader2 className="h-10 w-10 animate-spin text-brand-600" /></div>
          <h2 className="mt-6 font-display text-xl font-extrabold">Checking guardrails…</h2>
          <p className="mt-1 text-sm text-ink-mute">Verifying merchant and your limits</p>
        </div>
      </div>
    );

  /* ---------- RESULT ---------- */
  if (step === "result" && decision && dest) {
    const ok = decision.approved;
    return (
      <div className="min-h-full animate-fade-in px-5 pb-8 pt-10 text-center">
        <div className="relative mx-auto grid h-24 w-24 place-items-center">
          {ok && <span className="absolute inset-0 animate-ring rounded-full bg-brand-500/40" />}
          <span className={clsx("relative grid h-24 w-24 place-items-center rounded-full text-white", ok ? "bg-brand-500 shadow-glow" : "bg-rose-500 shadow-[0_12px_40px_-8px_rgba(229,89,75,.5)]")}>
            {ok ? <svg viewBox="0 0 24 24" className="h-11 w-11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24" strokeDashoffset="24" className="animate-draw" /></svg> : <ShieldX className="h-11 w-11" />}
          </span>
        </div>
        <h1 className="mt-6 text-[28px] font-extrabold leading-tight">{ok ? `${usd(amount)} paid` : decision.headline}</h1>
        <p className="mx-auto mt-2 max-w-[290px] text-[15px] leading-relaxed text-ink-mute">
          {ok ? `${dest.name} received ${ngn(amount)} in Naira.` : decision.reason}
        </p>
        {!ok && <p className="mx-auto mt-3 flex max-w-[290px] items-center justify-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-[13px] font-semibold text-brand-800"><ShieldCheck className="h-4 w-4 shrink-0" /> Your money is safe — nothing was spent.</p>}

        <div className="mt-7 rounded-3xl bg-white p-4 text-left shadow-card">
          <div className="eyebrow mb-3">What we checked</div>
          <ul className="space-y-3">
            {decision.checks.map((c, i) => (
              <li key={c.id} className="flex items-start gap-3 animate-fade-up" style={{ animationDelay: `${i * 90}ms` }}>
                <span className={clsx("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white", c.status === "pass" ? "bg-brand-500" : c.status === "fail" ? "bg-rose-500" : "bg-line-strong")}>
                  {c.status === "pass" ? <Check className="h-3 w-3" strokeWidth={4} /> : c.status === "fail" ? <X className="h-3 w-3" strokeWidth={4} /> : <span className="h-1 w-2 rounded bg-white" />}
                </span>
                <div className="min-w-0 text-sm leading-tight"><div className={clsx("font-semibold", c.status === "skipped" && "text-ink-faint")}>{c.label}</div><div className="mt-0.5 text-[13px] text-ink-mute">{c.detail}</div></div>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 font-mono text-xs text-ink-faint">Ref {ref}</p>
        <div className="mt-6 grid gap-3">
          <Button size="lg" full onClick={() => router.push("/pass")}>Done</Button>
          {!ok && <Button size="lg" full variant="outline" onClick={() => { setDest(null); setAmt(""); setStep("scan"); }}>Try another code</Button>}
        </div>
      </div>
    );
  }
  return null;
}
