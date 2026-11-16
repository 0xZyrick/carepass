"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Hospital, Landmark, Loader2, Smartphone } from "lucide-react";
import clsx from "clsx";
import { Button, Logo } from "@/components/ui/ui";
import { PassCard } from "@/components/PassCard";
import { authClient } from "@/lib/auth-client";
import { useStore } from "@/lib/store";

type Role = "sponsor" | "family" | "clinic";
const HOME: Record<Role, string> = { sponsor: "/sponsor", family: "/pass", clinic: "/clinic" };

export function SignInFlow() {
  const router = useRouter();
  const { refresh } = useStore();
  const params = useSearchParams();
  const signup = params.get("mode") === "signup";
  const [role, setRole] = useState<Role>("sponsor");
  const [step, setStep] = useState<"id" | "otp">("id");
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const email = id.trim().toLowerCase();
  const valid = /^\S+@\S+\.\S+$/.test(email) && (!signup || name.trim().length > 1);

  async function requestCode() {
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    if (error) { setErr(error.message ?? "Couldn't send the code. Try again."); return false; }
    // Demo mode (no email provider yet): the server exposes the code so anyone can try the app.
    try {
      const r = await fetch(`/api/demo-otp?email=${encodeURIComponent(email)}`, { cache: "no-store" });
      setDemoCode(r.ok ? ((await r.json()).otp as string | null) : null);
    } catch { setDemoCode(null); }
    return true;
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return setErr(signup && name.trim().length < 2 ? "Enter your full name." : "Enter a valid email address.");
    setErr(""); setBusy(true);
    const ok = await requestCode();
    setBusy(false);
    if (ok) { setStep("otp"); setCooldown(30); setTimeout(() => refs.current[0]?.focus(), 50); }
  }

  async function resend() {
    setErr(""); setCooldown(30);
    await requestCode();
  }

  async function verify(c = code) {
    const otp = c.join("");
    if (otp.length < 6 || busy) return;
    setBusy(true); setErr("");
    const { error } = await authClient.signIn.emailOtp({ email, otp });
    if (error) {
      setBusy(false); setCode(Array(6).fill("")); refs.current[0]?.focus();
      return setErr(/expired/i.test(error.message ?? "") ? "That code has expired. Request a new one." : "That code isn't right. Check it and try again.");
    }
    // First sign-in: record whether this is a sponsor or a family member. An existing account keeps its role.
    const r = await fetch("/api/me/role", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, name: name.trim() }) });
    const j = await r.json().catch(() => ({}));
    const finalRole: Role = r.ok || r.status === 409 ? (j.role as Role) : role;
    await refresh(); // load this account's data into the app before navigating
    const next = params.get("next");
    router.replace(next && next.startsWith(HOME[finalRole]) ? next : HOME[finalRole]);
    router.refresh();
  }

  function setDigit(i: number, v: string) {
    const d = v.replace(/\D/g, "");
    if (d.length > 1) {
      const next = d.slice(0, 6).split("").concat(Array(6).fill("")).slice(0, 6);
      setCode(next); refs.current[Math.min(d.length, 5)]?.focus();
      if (d.length >= 6) verify(next);
      return;
    }
    const next = [...code]; next[i] = d; setCode(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
    if (next.every(Boolean)) verify(next);
  }

  return (
    <div className="grid grid-cols-1 min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-brand-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="grain absolute inset-0" />
        <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl" />
        <Link href="/" className="relative"><Logo light /></Link>
        <div className="relative">
          <div className="mx-auto mb-12 max-w-[360px] -rotate-3"><PassCard name="Adebola Okonkwo" balance={186.4} last4="8842" /></div>
          <h2 className="max-w-md text-4xl font-extrabold leading-tight">Every dollar you send reaches care.</h2>
          <p className="mt-4 max-w-md text-white/60">Money for care can only be spent at verified clinics, labs and pharmacies, and you see every payment.</p>
        </div>
        <div className="relative text-sm text-white/40">© 2026 CarePass</div>
      </aside>

      <main className="flex flex-col px-5 pb-8 pt-5 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" className="lg:hidden"><Logo /></Link>
          <Link href="/" className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-canvas-2">← Back to site</Link>
        </div>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-8">
          {step === "id" ? (
            <form onSubmit={sendCode} className="animate-fade-up">
              <h1 className="text-[34px] font-extrabold leading-tight">{signup ? "Create your account" : "Welcome back"}</h1>
              <p className="mt-2 text-ink-mute">{signup ? "Pick how you will use CarePass." : "Sign in to continue to CarePass."}</p>

              <div className="mt-8 grid grid-cols-3 gap-2 rounded-2xl bg-canvas-2 p-1.5" role="tablist" aria-label="I am a">
                {([["sponsor", "I'm sending support", Landmark], ["family", "I'm receiving care", Smartphone], ["clinic", "I run a clinic", Hospital]] as const).map(([r, l, I]) => (
                  <button key={r} type="button" role="tab" aria-selected={role === r} onClick={() => { setRole(r); setErr(""); }}
                    className={clsx("flex flex-col items-center gap-1.5 rounded-xl px-2 py-3.5 text-[13px] font-bold transition", role === r ? "bg-white text-ink shadow-card" : "text-ink-mute hover:text-ink")}>
                    <I className={clsx("h-5 w-5", role === r && "text-brand-600")} />{l}
                  </button>
                ))}
              </div>

              {signup && (
                <label className="mt-6 block">
                  <span className="text-sm font-semibold">Full name</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="e.g. Tunde Okonkwo"
                    className="mt-2 h-[52px] w-full rounded-2xl border border-line-strong bg-white px-4 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15" />
                </label>
              )}
              <label className="mt-5 block">
                <span className="text-sm font-semibold">Email address</span>
                <input value={id} onChange={(e) => { setId(e.target.value); setErr(""); }} inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
                  placeholder="you@example.com"
                  className={clsx("mt-2 h-[52px] w-full rounded-2xl border bg-white px-4 outline-none transition focus:ring-4", err ? "border-rose-500 focus:ring-rose-500/15" : "border-line-strong focus:border-brand-500 focus:ring-brand-500/15")} />
                {err && <span className="mt-2 block text-sm font-medium text-rose-700">{err}</span>}
              </label>

              <Button type="submit" size="lg" full className="mt-6" disabled={busy}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Continue <ArrowRight className="h-5 w-5" /></>}
              </Button>
              <p className="mt-5 text-center text-sm text-ink-mute">
                {signup ? "Already have an account? " : "New to CarePass? "}
                <Link href={signup ? "/signin" : "/signin?mode=signup"} className="font-bold text-brand-700 hover:underline">{signup ? "Sign in" : "Create an account"}</Link>
              </p>
            </form>
          ) : (
            <div className="animate-fade-up">
              <button onClick={() => { setStep("id"); setCode(Array(6).fill("")); setErr(""); setDemoCode(null); }} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back</button>
              <h1 className="text-[34px] font-extrabold leading-tight">Check your inbox</h1>
              <p className="mt-2 text-ink-mute">We sent a 6-digit code to <strong className="text-ink">{id}</strong>.</p>

              <div className="mt-8 flex justify-between gap-2" onPaste={(e) => { e.preventDefault(); setDigit(0, e.clipboardData.getData("text")); }}>
                {code.map((c, i) => (
                  <input key={i} ref={(el) => { refs.current[i] = el; }} value={c} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} maxLength={6} aria-label={`Digit ${i + 1}`}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => e.key === "Backspace" && !code[i] && i > 0 && refs.current[i - 1]?.focus()}
                    className="h-[60px] w-full min-w-0 rounded-2xl border border-line-strong bg-white text-center font-display text-2xl font-bold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15" />
                ))}
              </div>
              {demoCode && (
                <div className="mt-4 rounded-xl bg-sun-50 px-3.5 py-3 text-[13px] font-medium text-sun-600">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0" /> Demo mode: email delivery isn't connected yet.</div>
                  <button type="button" onClick={() => { const d = demoCode.split(""); setCode(d); void verify(d); }} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 font-mono text-base font-bold tracking-[0.3em] text-ink shadow-card">{demoCode}<span className="font-sans text-xs font-bold tracking-normal text-brand-700">Use code</span></button>
                </div>
              )}
              {err && <p role="alert" className="mt-4 text-sm font-medium text-rose-700">{err}</p>}

              <Button size="lg" full className="mt-6" disabled={busy || code.join("").length < 6} onClick={() => verify()}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & continue"}
              </Button>
              <p className="mt-5 text-center text-sm text-ink-mute">
                {cooldown > 0 ? `Resend code in ${cooldown}s` : <button onClick={resend} className="font-bold text-brand-700 hover:underline">Resend code</button>}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
