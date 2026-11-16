"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, BadgeCheck, Check, Keyboard, Loader2, Lock, ShieldCheck, X } from "lucide-react";
import clsx from "clsx";
import { Button, CatIcon, Stamp } from "@/components/ui/ui";
import { Keypad } from "@/components/Keypad";
import { useStore } from "@/lib/store";
import type { Merchant } from "@/lib/data";
import type { Decision } from "@/lib/guardrail";
import { ngn, usd } from "@/lib/format";
import { receiptUrl } from "@/lib/site";

type Dest = { name: string; short: string; addr: string; merchant?: Merchant };
type Step = "scan" | "amount" | "pin" | "checking" | "result";
const NOTES = ["Consultation", "Medicine", "Lab test", "Admission"];

const toDest = (m: Merchant): Dest => ({ name: m.name, short: m.short, addr: m.addr, merchant: m });
const CODE = /^(?:carepass:clinic:)?(CL-[A-Z0-9]{6})$/i;

/* BarcodeDetector is available in Chromium browsers; elsewhere people type the code or pick from the list. */
type Detector = { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
const cameraSupported = () => typeof window !== "undefined" && "BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia;

export function PayFlow() {
  const router = useRouter();
  const q = useSearchParams();
  const { beneficiaries, activePassId, merchants, pay, createPin, me } = useStore();
  const b = beneficiaries.find((x) => x.id === activePassId) ?? beneficiaries[0];
  const preset = merchants.find((m) => m.id === q.get("m"));

  const [step, setStep] = useState<Step>(preset ? "amount" : "scan");
  const [dest, setDest] = useState<Dest | null>(preset ? toDest(preset) : null);
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState(NOTES[0]);
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [ref, setRef] = useState("");
  const [chainTx, setChainTx] = useState("");
  const [payErr, setPayErr] = useState("");
  const [typing, setTyping] = useState(false);
  const [code, setCode] = useState("");
  const [camErr, setCamErr] = useState("");
  const video = useRef<HTMLVideoElement>(null);

  const amount = parseFloat(amt) || 0;
  const creating = !me?.hasPin;

  const resolve = (raw: string): Dest => {
    const text = raw.trim();
    const m = merchants.find((x) => x.addr.toLowerCase() === text.toLowerCase() || x.short.toLowerCase() === text.toLowerCase() || (CODE.test(text) && x.id.toLowerCase() === text.match(CODE)![1].toLowerCase()));
    return m ? toDest(m) : { name: "Unrecognised code", short: text.length > 16 ? `${text.slice(0, 14)}…` : text, addr: text };
  };
  const pick = (d: Dest) => { setDest(d); setStep("amount"); };
  const key = (k: string) => setAmt((a) => k === "del" ? a.slice(0, -1) : k === "." ? (a.includes(".") || !a ? a || "0." : a + ".") : a.length >= 6 || /\.\d{2}$/.test(a) ? a : a === "0" ? k : a + k);

  /* camera scanning */
  useEffect(() => {
    if (step !== "scan" || typing || !cameraSupported()) return;
    let stop = false; let stream: MediaStream | null = null; let timer: ReturnType<typeof setInterval>;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stop || !video.current) return;
        video.current.srcObject = stream; await video.current.play();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const det: Detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        timer = setInterval(async () => {
          if (!video.current) return;
          const found = await det.detect(video.current).catch(() => []);
          if (found[0]?.rawValue) { clearInterval(timer); pick(resolve(found[0].rawValue)); }
        }, 450);
      } catch { setCamErr("We couldn't open the camera. You can type the clinic's code instead."); setTyping(true); }
    })();
    return () => { stop = true; clearInterval(timer); stream?.getTracks().forEach((t) => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, typing]);

  async function submit(pinValue: string) {
    setStep("checking");
    const [res] = await Promise.all([pay(b.id, dest!.addr, amount, note, pinValue), new Promise((r) => setTimeout(r, 900))]);
    if ("error" in res) {
      if (res.status === 403 || res.status === 429 || res.status === 428) { setPin(""); setPinMsg(res.error); setStep("pin"); return; }
      setPayErr(res.error); setStep("amount"); return;
    }
    setPayErr(""); setChainTx(res.tx.chainTx ?? "");
    setDecision(res.decision); setRef(res.tx.ref); setStep("result");
  }

  async function pinKey(k: string) {
    if (k === "del") return setPin((p) => p.slice(0, -1));
    if (pin.length >= 4) return;
    const next = pin + k; setPin(next); setPinMsg("");
    if (next.length < 4) return;
    if (creating) {
      if (!firstPin) { setTimeout(() => { setFirstPin(next); setPin(""); }, 200); return; }
      if (firstPin !== next) { setTimeout(() => { setFirstPin(""); setPin(""); setPinMsg("Those PINs didn't match. Try again."); }, 200); return; }
      if (!(await createPin(next))) { setFirstPin(""); setPin(""); return; }
      setPin(""); void submit(next); return;
    }
    setTimeout(() => void submit(next), 200);
  }

  useEffect(() => { if (step !== "pin") { setPin(""); } }, [step]);

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
      <div className="flex min-h-full animate-fade-in flex-col">
        <Top title="Pay a clinic" />
        <div className="px-5">
          {!typing && cameraSupported() ? (
            <div className="relative mx-auto mt-3 aspect-square w-full max-w-[340px] overflow-hidden rounded-[28px] bg-ink">
              <video ref={video} playsInline muted className="h-full w-full object-cover" />
              {["left-3 top-3 border-l-4 border-t-4 rounded-tl-2xl", "right-3 top-3 border-r-4 border-t-4 rounded-tr-2xl", "bottom-3 left-3 border-b-4 border-l-4 rounded-bl-2xl", "bottom-3 right-3 border-b-4 border-r-4 rounded-br-2xl"].map((c) => <span key={c} className={clsx("absolute h-10 w-10 border-white/90", c)} />)}
              <span className="absolute inset-x-6 h-0.5 animate-scan rounded-full bg-brand-400" />
            </div>
          ) : (
            <div className="mt-3 rounded-3xl bg-white p-5 shadow-card">
              <h2 className="font-display text-xl font-semibold">Enter the clinic's code</h2>
              <p className="mt-1 text-sm text-ink-mute">You'll find it under the QR code at the clinic. It looks like <span className="font-mono font-semibold text-ink">CL-7K2M9Q</span>.</p>
              {camErr && <p className="mt-3 rounded-xl bg-sun-50 px-3 py-2 text-[13px] font-medium text-sun-600">{camErr}</p>}
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="CL-XXXXXX" aria-label="Clinic code"
                className="mt-4 h-[52px] w-full rounded-2xl border border-line-strong bg-white px-4 font-mono text-lg uppercase tracking-wider outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15" />
              <Button size="lg" full className="mt-3" disabled={code.trim().length < 3} onClick={() => pick(resolve(code))}>Continue</Button>
            </div>
          )}
          <p className="mt-4 text-center text-sm text-ink-mute">{!typing && cameraSupported() ? "Point your camera at the clinic's QR code." : ""}</p>
          <div className="mt-5 grid gap-2.5">
            {!typing && cameraSupported() && <button onClick={() => setTyping(true)} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold shadow-card"><Keyboard className="h-4 w-4" /> Type the clinic's code instead</button>}
            {typing && cameraSupported() && <button onClick={() => { setTyping(false); setCamErr(""); }} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold shadow-card">Use the camera</button>}
            <Link href="/pass/clinics" className="flex h-12 items-center justify-center rounded-2xl bg-white text-sm font-semibold shadow-card">Choose a clinic from the list</Link>
          </div>
        </div>
      </div>
    );

  /* ---------- AMOUNT ---------- */
  if (step === "amount" && dest)
    return (
      <div className="flex min-h-full animate-fade-in flex-col">
        <Top title="How much?" onBack={() => (preset ? router.back() : setStep("scan"))} />
        <div className="px-5">
          <div className={clsx("flex items-center gap-3.5 rounded-2xl p-3.5", dest.merchant ? "bg-white shadow-card" : "bg-rose-50 ring-1 ring-rose-100")}>
            {dest.merchant ? <CatIcon type={dest.merchant.type} /> : <span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-100 text-rose-700"><AlertTriangle className="h-5 w-5" /></span>}
            <div className="min-w-0 flex-1"><div className="truncate font-bold">{dest.name}</div><div className="truncate font-mono text-xs text-ink-mute">{dest.short}</div></div>
            {dest.merchant ? <Stamp tone="ok"><BadgeCheck className="h-3.5 w-3.5" /> Verified</Stamp> : <Stamp tone="no">Not verified</Stamp>}
          </div>
          {payErr && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700">{payErr}</p>}
          {!dest.merchant && <p className="mt-3 text-[13px] leading-relaxed text-rose-700">This isn't a verified clinic, lab or pharmacy, so CarePass won't allow the payment.</p>}
        </div>
        <div className="mt-6 flex-1 text-center">
          <div className="num text-[56px] font-bold leading-none"><span className="text-ink-faint">$</span>{amt || "0"}</div>
          <div className="mt-2 font-semibold text-brand-700">{amount > 0 ? `about ${ngn(amount)}` : "Enter an amount"}</div>
          <div className="no-scrollbar mt-4 flex justify-center gap-2 overflow-x-auto px-5">{NOTES.map((n) => <button key={n} onClick={() => setNote(n)} className={clsx("h-9 shrink-0 rounded-full border px-3.5 text-[13px] font-semibold", note === n ? "border-ink bg-ink text-white" : "border-line-strong bg-white")}>{n}</button>)}</div>
        </div>
        <div className="px-5 pb-6">
          <Keypad onKey={key} dot />
          <Button size="lg" full className="mt-3" disabled={amount <= 0} onClick={() => setStep("pin")}>{`Pay ${usd(amount)}`}</Button>
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
          <h2 className="mt-5 font-display text-2xl font-semibold">{creating ? (firstPin ? "Enter it once more" : "Create your PIN") : "Enter your PIN"}</h2>
          <p className="mt-1 text-sm text-ink-mute">{creating ? "Choose 4 digits. You'll use it to confirm every payment." : `to pay ${usd(amount)} to ${dest?.name}`}</p>
          <div className="mt-8 flex justify-center gap-4" aria-label={`${pin.length} of 4 digits entered`}>
            {[0, 1, 2, 3].map((i) => <span key={i} className={clsx("h-4 w-4 rounded-full border-2 transition", i < pin.length ? "scale-110 border-brand-500 bg-brand-500" : "border-line-strong")} />)}
          </div>
          {pinMsg && <p role="alert" className="mx-auto mt-5 max-w-[280px] text-sm font-medium text-rose-700">{pinMsg}</p>}
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
          <h2 className="mt-6 font-display text-xl font-semibold">Checking your payment…</h2>
          <p className="mt-1 text-sm text-ink-mute">Confirming the clinic and your limits</p>
        </div>
      </div>
    );

  /* ---------- RESULT ---------- */
  if (step === "result" && decision && dest) {
    const ok = decision.approved;
    return (
      <div className="min-h-full animate-fade-in px-5 pb-8 pt-8">
        <div className="receipt-wrap">
          <div className="receipt px-6 pt-8 text-center">
            <Stamp tone={ok ? "ok" : "no"} className="!text-sm">{ok ? "Paid" : "Not allowed"}</Stamp>
            <div className="num mt-5 text-[46px] font-bold leading-none">{usd(amount)}</div>
            <div className="mt-1.5 font-medium text-ink-mute">about {ngn(amount)}</div>
            <p className="mx-auto mt-4 max-w-[280px] text-[15px] leading-relaxed text-ink-soft">
              {ok ? `${dest.name} has been paid.` : decision.reason}
            </p>
            <div className="tear mt-6" />
            <ul className="mt-5 space-y-3 text-left">
              {decision.checks.filter((c) => c.status !== "skipped").map((c, i) => (
                <li key={c.id} className="flex items-start gap-3 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <span className={clsx("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white", c.status === "pass" ? "bg-brand-500" : "bg-rose-500")}>
                    {c.status === "pass" ? <Check className="h-3 w-3" strokeWidth={4} /> : <X className="h-3 w-3" strokeWidth={4} />}
                  </span>
                  <div className="min-w-0 text-sm leading-tight"><div className="font-semibold">{c.label}</div><div className="mt-0.5 text-[13px] text-ink-mute">{c.detail}</div></div>
                </li>
              ))}
            </ul>
            <p className="mt-6 font-mono text-xs text-ink-faint">Ref {ref}</p>
            {ok && chainTx && <a href={receiptUrl(chainTx)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-brand-700 underline">Confirmed on the network ↗</a>}
          </div>
        </div>
        <div className="mt-6 grid gap-3">
          <Button size="lg" full onClick={() => router.push("/pass")}>Done</Button>
          {!ok && <Button size="lg" full variant="outline" onClick={() => { setDest(null); setAmt(""); setCode(""); setStep("scan"); }}>Try another clinic</Button>}
        </div>
      </div>
    );
  }
  return null;
}
