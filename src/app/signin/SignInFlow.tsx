"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, Landmark, Lock, Smartphone, Wallet } from "lucide-react";
import clsx from "clsx";
import { Button, Logo } from "@/components/ui/ui";
import { Field } from "@/components/ui/forms";
import { CareTimeline } from "@/components/CareTimeline";
import { pkgOf } from "@/lib/care";
import { formatNgPhone, phoneDigits } from "@/lib/format";

type Role = "sponsor" | "family";

const ROLES = [
  { id: "sponsor" as const, icon: Landmark, t: "I’m arranging care", d: "Fund and follow care for family" },
  { id: "family" as const, icon: Smartphone, t: "I’m receiving care", d: "See my next step and visit code" },
];

export function SignInFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const signup = params.get("mode") === "signup";
  const [role, setRole] = useState<Role>("sponsor");
  const [step, setStep] = useState<"id" | "otp">("id");
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sponsor = role === "sponsor";
  const emailOk = /^\S+@\S+\.\S+$/.test(id.trim());
  const nameOk = name.trim().length > 1;
  const phoneOk = phoneDigits(id).length >= 13; // +234 + 10 digits
  const valid = sponsor ? emailOk && (!signup || nameOk) : phoneOk;

  function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setErr(sponsor ? (!emailOk ? "Enter a valid email address." : "Enter your full name.") : "Enter a valid Nigerian phone number.");
      setShake(true); setTimeout(() => setShake(false), 400);
      return;
    }
    setErr(""); setBusy(true);
    setTimeout(() => { setBusy(false); setStep("otp"); setCooldown(30); setTimeout(() => refs.current[0]?.focus(), 60); }, 700);
  }

  function verify(c = code) {
    if (c.join("").length < 6 || busy) return;
    setBusy(true);
    setTimeout(() => { setOk(true); setTimeout(() => router.push(sponsor ? "/sponsor" : "/pass"), 650); }, 650);
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
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 to-brand-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="grain absolute inset-0" />
        <Link href="/" className="relative w-fit"><Logo light /></Link>
        <div className="relative">
          <div className="mx-auto mb-12 max-w-[380px] rounded-3xl bg-white p-6 text-ink shadow-pop">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">Diagnostic workup</div>
                <div className="text-xs text-ink-mute">Lagoon Hospital, Ikeja</div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11.5px] font-semibold text-brand-800"><BadgeCheck className="h-3.5 w-3.5" />Verified</span>
            </div>
            <CareTimeline steps={pkgOf("diagnostic").steps} done={3} compact />
          </div>
          <h2 className="max-w-md text-[40px] font-bold leading-[1.08]">Know the care happened.</h2>
          <ul className="mt-6 max-w-md space-y-3 text-white/75">
            {[[Wallet, "Pay only as each step is confirmed"], [Lock, "Medical details stay private"], [BadgeCheck, "Vetted providers in Lagos and Abuja"]].map(([I, t]) => {
              const Icon = I as typeof Wallet;
              return <li key={t as string} className="flex items-center gap-3"><Icon className="h-[18px] w-[18px] text-brand-300" />{t as string}</li>;
            })}
          </ul>
        </div>
        <div className="relative text-sm text-white/40">© 2026 CarePass · Demo prototype</div>
      </aside>

      <main className="flex flex-col px-5 pb-8 pt-5 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:hidden" aria-label="CarePass home"><Logo /></Link>
          <Link href="/" className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-ink-soft hover:bg-canvas-2"><ArrowLeft className="h-4 w-4" />Back to site</Link>
        </div>

        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-8">
          {step === "id" ? (
            <form onSubmit={sendCode} noValidate className="animate-fade-up">
              <h1 className="text-[32px] font-bold leading-tight sm:text-[36px]">{signup ? "Create your account" : "Welcome back"}</h1>
              <p className="mt-2 text-ink-mute">{signup ? "Start arranging care for your family in minutes." : "Sign in to continue to CarePass."}</p>

              <div className="mt-8 grid grid-cols-2 gap-3" role="radiogroup" aria-label="I am">
                {ROLES.map((r) => (
                  <button key={r.id} type="button" role="radio" aria-checked={role === r.id} onClick={() => { setRole(r.id); setId(""); setErr(""); }}
                    className={clsx("rounded-2xl border p-4 text-left transition", role === r.id ? "border-brand-600 bg-brand-50/70 shadow-[0_0_0_3px_rgba(15,154,163,.14)]" : "border-line bg-white hover:border-line-strong")}>
                    <span className={clsx("grid h-9 w-9 place-items-center rounded-lg", role === r.id ? "bg-brand-600 text-white" : "bg-canvas-2 text-ink-soft")}><r.icon className="h-[18px] w-[18px]" /></span>
                    <span className="mt-3 block text-[13.5px] font-bold leading-tight">{r.t}</span>
                    <span className="mt-1 block text-xs leading-snug text-ink-mute">{r.d}</span>
                  </button>
                ))}
              </div>

              <div className={clsx("mt-6 space-y-5", shake && "animate-shake")}>
                {signup && sponsor && (
                  <Field label="Full name" value={name} onChange={(e) => { setName(e.target.value); setErr(""); }} autoComplete="name" placeholder="e.g. Tunde Okonkwo" />
                )}
                {sponsor ? (
                  <Field label="Email address" value={id} onChange={(e) => { setId(e.target.value); setErr(""); }} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" error={err} />
                ) : (
                  <Field label="Phone number" value={id} onChange={(e) => { setId(formatNgPhone(e.target.value)); setErr(""); }} type="tel" inputMode="tel" autoComplete="tel" placeholder="+234 802 555 0142" error={err} hint="We’ll text you a 6-digit code." />
                )}
              </div>

              <Button type="submit" size="lg" full className="mt-6" loading={busy}>Continue <ArrowRight className="h-5 w-5" /></Button>
              <p className="mt-6 text-center text-sm text-ink-mute">
                {signup ? "Already have an account? " : "New to CarePass? "}
                <Link href={signup ? "/signin" : "/signin?mode=signup"} className="font-bold text-brand-700 hover:underline">{signup ? "Sign in" : "Create an account"}</Link>
              </p>
              <p className="mt-3 text-center text-sm text-ink-mute">
                Work at a hospital or lab? <Link href="/provider" className="font-bold text-brand-700 hover:underline">Open the provider desk</Link>
              </p>
            </form>
          ) : (
            <div className="animate-fade-up">
              <button onClick={() => { setStep("id"); setCode(Array(6).fill("")); setBusy(false); setOk(false); }} className="mb-6 inline-flex h-9 items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4" />Back</button>
              <h1 className="text-[32px] font-bold leading-tight sm:text-[36px]">Check your {sponsor ? "inbox" : "messages"}</h1>
              <p className="mt-2 text-ink-mute">We sent a 6-digit code to <strong className="font-semibold text-ink">{id}</strong>.</p>

              <div className="mt-8 flex justify-between gap-2 sm:gap-2.5" onPaste={(e) => { e.preventDefault(); setDigit(0, e.clipboardData.getData("text")); }}>
                {code.map((c, i) => (
                  <input key={i} ref={(el) => { refs.current[i] = el; }} value={c} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} maxLength={6} aria-label={`Digit ${i + 1}`} disabled={busy || ok}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => e.key === "Backspace" && !code[i] && i > 0 && refs.current[i - 1]?.focus()}
                    className={clsx("h-[60px] w-full min-w-0 rounded-xl border bg-white text-center font-display text-2xl font-bold outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-500/15 disabled:opacity-70",
                      c ? "border-ink-faint" : "border-line-strong")} />
                ))}
              </div>
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-sun-50 px-3.5 py-2.5 text-[13px] font-medium text-sun-700"><Check className="h-4 w-4 shrink-0" />Demo: enter any 6 digits to continue.</p>

              <Button size="lg" full className="mt-6" loading={busy && !ok} disabled={code.join("").length < 6 || ok} onClick={() => verify()}
                icon={ok ? <Check className="h-5 w-5" /> : undefined}>
                {ok ? "Verified" : "Verify & continue"}
              </Button>
              <p className="mt-5 text-center text-sm text-ink-mute">
                {cooldown > 0 ? `Resend code in ${cooldown}s` : <button onClick={() => setCooldown(30)} className="font-bold text-brand-700 hover:underline">Resend code</button>}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
