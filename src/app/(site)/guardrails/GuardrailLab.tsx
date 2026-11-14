"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, Check, Copy, Loader2, Play, Search, ShieldCheck, ShieldX, X } from "lucide-react";
import clsx from "clsx";
import { Avatar, Button, CatIcon } from "@/components/ui/ui";
import { OnChainLab } from "@/components/OnChainLab";
import { CATEGORIES, Category, MERCHANTS, PERSONAL_SHORT, SEED_BENEFICIARIES, SEED_TXS } from "@/lib/data";
import { Decision, evaluatePayment } from "@/lib/guardrail";
import { ngn, usd } from "@/lib/format";

const SCENARIOS = [
  { label: "Lagoon Hospital", value: MERCHANTS[0].short, tone: "ok" },
  { label: "HealthPlus Pharmacy", value: MERCHANTS[2].short, tone: "ok" },
  { label: "Smile Lagos Dental", value: MERCHANTS[4].short, tone: "maybe" },
  { label: "Personal wallet", value: PERSONAL_SHORT, tone: "bad" },
  { label: "Bad address", value: "hello-world", tone: "bad" },
] as const;
const AMOUNTS = [50, 120, 180, 400];

export function GuardrailLab() {
  // The public lab runs on fixed sample passes, so it needs no account. Signed-in rules run on the server.
  const beneficiaries = SEED_BENEFICIARIES;
  const spent = (id: string) => SEED_TXS.filter((t) => t.kind === "payment" && t.beneficiaryId === id && t.daysAgo < 30).reduce((s, t) => s + t.amount, 0);
  const [pid, setPid] = useState(beneficiaries[0].id);
  const [dest, setDest] = useState<string>(SCENARIOS[3].value);
  const [amount, setAmount] = useState(50);
  const [running, setRunning] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [shown, setShown] = useState(0);
  const [txId, setTxId] = useState("");
  const [fq, setFq] = useState("");
  const [fc, setFc] = useState<"all" | Category>("all");
  const [copied, setCopied] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);
  const b = beneficiaries.find((x) => x.id === pid)!;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function run() {
    timers.current.forEach(clearTimeout);
    setRunning(true); setDecision(null); setShown(0);
    const d = evaluatePayment(b, dest, amount, spent(b.id));
    timers.current.push(setTimeout(() => {
      setDecision(d); setRunning(false);
      setTxId(Math.random().toString(16).slice(2, 10) + "…" + Math.random().toString(16).slice(2, 6));
      d.checks.forEach((_, i) => timers.current.push(setTimeout(() => setShown(i + 1), 160 * (i + 1))));
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    }, 650));
  }

  const list = useMemo(
    () => MERCHANTS.filter((m) => (fc === "all" || m.type === fc) && (!fq || (m.name + m.area + m.city).toLowerCase().includes(fq.toLowerCase()))),
    [fq, fc]
  );
  const copy = (t: string) => { navigator.clipboard?.writeText(t).catch(() => {}); setCopied(t); setTimeout(() => setCopied(""), 1400); };

  return (
    <>
      <section className="container-x pb-10 pt-10 lg:pt-16">
        <div className="eyebrow">Guardrail lab</div>
        <h1 className="mt-3 max-w-3xl text-balance text-[40px] font-extrabold leading-[1.05] sm:text-6xl">Watch the guardrail work.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
          Try to pay a hospital, a pharmacy — or a personal wallet. See every check the Soroban smart contract runs before a single dollar moves.
        </p>
      </section>

      <OnChainLab />

      <section className="container-x grid grid-cols-1 gap-6 pb-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:pb-24">
        {/* Simulator */}
        <div className="card p-5 sm:p-7">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Try a payment</h2><span className="rounded-full bg-sun-50 px-3 py-1 text-[11px] font-bold text-sun-600">SIMULATION</span></div>

          <div className="eyebrow mb-2.5 mt-6">1 · Paying from</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {beneficiaries.map((p) => (
              <button key={p.id} onClick={() => { setPid(p.id); setDecision(null); }} className={clsx("flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition", pid === p.id ? "border-brand-500 bg-brand-50/60" : "border-line hover:border-line-strong")}>
                <Avatar initials={p.initials} hue={p.hue} size={38} />
                <div className="min-w-0 leading-tight"><div className="truncate text-sm font-bold">{p.name}'s pass</div><div className="text-xs text-ink-mute">{usd(p.balance)} · {p.frozen ? "Frozen" : "Active"}</div></div>
              </button>
            ))}
          </div>

          <div className="eyebrow mb-2.5 mt-6">2 · Destination</div>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {SCENARIOS.map((s) => (
              <button key={s.label} onClick={() => { setDest(s.value); setDecision(null); }} className={clsx("h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition", dest === s.value ? (s.tone === "bad" ? "border-rose-500 bg-rose-50 text-rose-700" : "border-brand-500 bg-brand-50 text-brand-800") : "border-line-strong hover:border-ink-faint")}>{s.label}</button>
            ))}
          </div>
          <input value={dest} onChange={(e) => { setDest(e.target.value); setDecision(null); }} spellCheck={false} aria-label="Destination address" placeholder="Stellar address (G…)"
            className="mt-3 h-[52px] w-full rounded-2xl border border-line-strong bg-canvas/50 px-4 font-mono text-[15px] outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/15" />

          <div className="eyebrow mb-2.5 mt-6">3 · Amount</div>
          <div className="flex flex-wrap gap-2">
            {AMOUNTS.map((a) => <button key={a} onClick={() => { setAmount(a); setDecision(null); }} className={clsx("h-10 rounded-full border px-5 text-sm font-bold transition", amount === a ? "border-ink bg-ink text-white" : "border-line-strong hover:border-ink-faint")}>${a}</button>)}
          </div>
          <p className="mt-2 text-[13px] text-ink-mute">{b.name}'s rules: {usd(b.perTxLimit, 0)} per payment · {usd(b.monthlyLimit, 0)} per month · {b.allowed.length} care types</p>

          <Button size="lg" full className="mt-7" onClick={run} disabled={running} variant="dark" icon={running ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}>
            {running ? "Checking whitelist…" : `Attempt payment of ${usd(amount, 0)}`}
          </Button>

          {decision && (
            <div ref={resultRef} className={clsx("mt-6 animate-scale-in rounded-3xl border-2 p-5", decision.approved ? "border-brand-200 bg-brand-50" : "border-rose-100 bg-rose-50")} role="status">
              <div className={clsx("flex items-center gap-3", decision.approved ? "text-brand-700" : "text-rose-700")}>
                {decision.approved ? <ShieldCheck className="h-9 w-9" /> : <ShieldX className="h-9 w-9" />}
                <div><div className="font-display text-2xl font-extrabold leading-tight">{decision.headline}</div><div className="text-sm font-medium opacity-80">{decision.approved ? `${decision.merchant?.name} · ${usd(amount)}` : "No funds moved"}</div></div>
              </div>
              <ol className="mt-5 space-y-3">
                {decision.checks.map((c, i) => (
                  <li key={c.id} className={clsx("flex items-start gap-3 transition-all duration-300", i < shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0")}>
                    <span className={clsx("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white", c.status === "pass" ? "bg-brand-500" : c.status === "fail" ? "bg-rose-500" : "bg-line-strong")}>
                      {c.status === "pass" ? <Check className="h-3 w-3" strokeWidth={4} /> : c.status === "fail" ? <X className="h-3 w-3" strokeWidth={4} /> : <span className="h-0.5 w-2 rounded bg-white" />}
                    </span>
                    <div className="min-w-0 text-sm leading-snug"><div className={clsx("font-bold", c.status === "skipped" && "font-semibold text-ink-faint")}>{c.label}</div><div className="text-ink-mute">{c.detail}</div></div>
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-sm leading-relaxed text-ink-soft">{decision.reason}</p>
              <p className="mt-3 font-mono text-[11px] text-ink-mute">
                {decision.approved ? `tx: ${txId} · settled ${ngn(amount)}` : `rule: ${decision.checks.find((c) => c.status === "fail")?.id}-v1 · rejected`}
              </p>
            </div>
          )}
        </div>

        {/* Whitelist */}
        <div className="card h-fit p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">On-chain whitelist (Soroban)</h2><span className="flex items-center gap-1.5 text-xs font-bold text-brand-700"><span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />{MERCHANTS.length} verified</span></div>
          <div className="relative mt-5">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input value={fq} onChange={(e) => setFq(e.target.value)} aria-label="Search merchants" placeholder="Search merchants" className="h-11 w-full rounded-xl border border-line-strong bg-canvas/50 pl-10 pr-3 outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/15" />
          </div>
          <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            {[{ id: "all", label: "All" }, ...CATEGORIES.map((c) => ({ id: c.id, label: c.label }))].map((c) => (
              <button key={c.id} onClick={() => setFc(c.id as "all" | Category)} className={clsx("h-8 shrink-0 rounded-full px-3.5 text-[13px] font-bold", fc === c.id ? "bg-ink text-white" : "bg-canvas-2 text-ink-soft")}>{c.label}</button>
            ))}
          </div>
          <ul className="mt-4 divide-y divide-line">
            {list.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3.5">
                <CatIcon type={m.type} className="!h-10 !w-10" />
                <button className="min-w-0 flex-1 text-left" onClick={() => { setDest(m.short); setDecision(null); window.scrollTo({ top: 120, behavior: "smooth" }); }} title="Use as destination">
                  <div className="flex items-center gap-1.5"><span className="truncate text-sm font-bold">{m.name}</span><BadgeCheck className="h-4 w-4 shrink-0 text-brand-500" /></div>
                  <div className="truncate font-mono text-[11px] text-ink-mute">{m.short} · {m.area}, {m.city}</div>
                </button>
                <button onClick={() => copy(m.short)} aria-label={`Copy address of ${m.name}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-mute hover:bg-canvas">{copied === m.short ? <Check className="h-4 w-4 text-brand-600" /> : <Copy className="h-4 w-4" />}</button>
              </li>
            ))}
            {list.length === 0 && <li className="py-10 text-center text-sm text-ink-mute">No merchants match.</li>}
          </ul>
        </div>
      </section>

      {/* explainer */}
      <section className="border-t border-line bg-white py-16 lg:py-20">
        <div className="container-x">
          <h2 className="max-w-xl text-3xl font-extrabold sm:text-4xl">How every payment is decided</h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[["1", "Pass check", "Is the pass active, or has the sponsor frozen it?"], ["2", "Merchant check", "Is the destination a verified provider on the on-chain whitelist?"], ["3", "Rule check", "Is the care type allowed and the amount inside payment and monthly limits?"], ["4", "Settle", "USDC settles on Stellar in seconds, then Yellow Card pays out Naira."]].map(([n, t, d]) => (
              <div key={n} className="rounded-3xl bg-canvas p-6"><span className="num text-4xl font-extrabold text-brand-500">{n}</span><h3 className="mt-3 text-lg font-bold">{t}</h3><p className="mt-1.5 text-sm leading-relaxed text-ink-mute">{d}</p></div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
