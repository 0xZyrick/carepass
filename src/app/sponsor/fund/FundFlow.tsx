"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Banknote, Check, CreditCard, Lock, ShieldCheck } from "lucide-react";
import clsx from "clsx";
import { Avatar, Button, Empty, PageHeader, PkgIcon, Row } from "@/components/ui/ui";
import { ChoiceCard, Stepper } from "@/components/ui/forms";
import { useStore } from "@/lib/store";
import { CareEpisode, isClosed, payableSteps, pkgOf, stepPayout } from "@/lib/care";
import { merchantOf } from "@/lib/data";
import { MIN_FUND, fundingFee, fxLabel, ngn, usd } from "@/lib/format";

const MAX_FUND = 10000;
const STEPS = ["Care", "Amount", "Review"];
const METHODS = [
  { id: "Visa •••• 4242", t: "Visa •••• 4242", d: "Instant · no extra fee", icon: CreditCard },
  { id: "Bank transfer", t: "Bank transfer", d: "1–2 business days", icon: Banknote },
];

export function FundFlow() {
  const q = useSearchParams();
  const { episodes, beneficiaries, fundEpisode, toast } = useStore();
  const open = episodes.filter((e) => !isClosed(e));
  const wanted = open.find((e) => e.id === q.get("care")) ?? open.find((e) => e.beneficiaryId === q.get("to"));
  const preselected = !!wanted;

  const [id, setId] = useState(wanted?.id ?? (open.length === 1 ? open[0].id : ""));
  const [step, setStep] = useState(preselected || open.length === 1 ? 1 : 0);
  const [amt, setAmt] = useState("");
  const [method, setMethod] = useState(METHODS[0].id);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{ ref: string; fee: number; amount: number; ep: CareEpisode; method: string } | null>(null);

  const ep = open.find((e) => e.id === id);
  const p = ep && pkgOf(ep.packageId);
  const who = (bid: string) => beneficiaries.find((b) => b.id === bid);
  const amount = Math.round((parseFloat(amt) || 0) * 100) / 100;
  const fee = fundingFee(amount);
  const tooLow = amt !== "" && amount < MIN_FUND;
  const tooHigh = amount > MAX_FUND;
  const amountOk = amount >= MIN_FUND && !tooHigh;
  const perStep = p ? +(amount / payableSteps(p)).toFixed(2) : 0;

  function go(n: number) { setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function pay() {
    if (!ep || !amountOk) return;
    setBusy(true);
    setTimeout(() => {
      const r = fundEpisode(ep.id, amount, method);
      setBusy(false);
      if (!r) return toast("Something went wrong. Please try again.", "warn");
      setReceipt({ ref: r.ref, fee: r.fee, amount, ep, method });
      window.scrollTo({ top: 0 });
    }, 900);
  }

  /* ---------- Success ---------- */
  if (receipt) {
    const rp = pkgOf(receipt.ep.packageId), rb = who(receipt.ep.beneficiaryId), rm = merchantOf(receipt.ep.providerId);
    const total = +(receipt.amount + receipt.fee).toFixed(2);
    return (
      <div className="mx-auto max-w-md animate-fade-up pt-2 text-center sm:pt-8">
        <span className="mx-auto grid h-16 w-16 animate-pop place-items-center rounded-full bg-brand-600 text-white shadow-glow"><Check className="h-8 w-8" strokeWidth={3} /></span>
        <h1 className="num mt-6 text-4xl font-bold">{usd(receipt.amount)} funded</h1>
        <p className="mt-2 text-ink-mute">It’s held for {rb?.name}’s {rp.name.toLowerCase()} and released as each step is confirmed.</p>
        <div className="card mt-8 divide-y divide-line px-5 text-left">
          <Row label="Reference" value={<span className="font-mono text-[13px]">{receipt.ref}</span>} />
          <Row label="Care" value={`${rp.name} · ${rb?.name}`} />
          <Row label="Provider" value={rm?.name} />
          <Row label="Paid with" value={receipt.method} />
          <Row label="Amount held" value={usd(receipt.amount)} />
          <Row label="Fee" value={usd(receipt.fee)} />
          <Row label="Total charged" value={usd(total)} strong />
        </div>
        <div className="mt-8 flex flex-col gap-3">
          <Button href={`/sponsor/care/${receipt.ep.id}`} size="lg" full>Track this care</Button>
          <Button href="/sponsor" variant="ghost" size="lg" full>Back to overview</Button>
        </div>
      </div>
    );
  }

  if (open.length === 0)
    return (
      <div className="card mx-auto mt-4 max-w-lg">
        <Empty icon={<ShieldCheck />} title="Nothing to fund yet" sub="Start a care package first. Then you can fund it and follow each step." action={<Button href="/sponsor/care/new">Start a care package</Button>} />
      </div>
    );

  const backStep = step === 1 && (preselected || open.length === 1) ? null : step - 1;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Fund care" sub="Money is held against the package and released as the provider confirms each step." />
      <Stepper steps={STEPS} current={step} />

      {/* ---------- 1. Choose care ---------- */}
      {step === 0 && (
        <section className="animate-fade-in" aria-label="Choose care">
          <h2 className="mb-4 text-xl font-bold">Which care are you funding?</h2>
          <div role="radiogroup" aria-label="Care package" className="space-y-3">
            {open.map((e) => {
              const b = who(e.beneficiaryId), pk = pkgOf(e.packageId);
              return (
                <ChoiceCard key={e.id} selected={id === e.id} onSelect={() => { setId(e.id); setAmt(""); }}>
                  <div className="flex items-center gap-3.5 pr-8">
                    {b && <Avatar initials={b.initials} hue={b.hue} size={46} />}
                    <div className="min-w-0">
                      <div className="truncate font-bold">{pk.name} for {b?.name}</div>
                      <div className="text-[13px] text-ink-mute">{merchantOf(e.providerId)?.name} · funded so far <span className="num font-semibold text-ink">{usd(e.funded)}</span></div>
                    </div>
                  </div>
                </ChoiceCard>
              );
            })}
          </div>
        </section>
      )}

      {/* ---------- 2. Amount ---------- */}
      {step === 1 && ep && p && (
        <section className="animate-fade-in" aria-label="Amount">
          <div className="card mb-6 flex items-center gap-3.5 p-4">
            <PkgIcon id={p.icon} size={42} />
            <div className="min-w-0 flex-1"><div className="truncate font-bold">{p.name} for {who(ep.beneficiaryId)?.name}</div><div className="text-[13px] text-ink-mute">Typical band {usd(p.price[0], 0)} – {usd(p.price[1], 0)} · funded so far {usd(ep.funded)}</div></div>
          </div>

          <label htmlFor="amt" className="text-sm font-semibold">How much would you like to add?</label>
          <div className={clsx("mt-2 flex h-[72px] items-center rounded-2xl border bg-white px-5 transition focus-within:ring-4", tooLow || tooHigh ? "border-rose-500 focus-within:ring-rose-500/15" : "border-line-strong focus-within:border-brand-600 focus-within:ring-brand-500/15")}>
            <span className="num text-3xl font-bold text-ink-faint">$</span>
            <input id="amt" value={amt} inputMode="decimal" autoComplete="off" placeholder="0.00" aria-invalid={tooLow || tooHigh || undefined} aria-describedby="amt-d"
              onChange={(e) => { const v = e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1").replace(/^(\d*\.\d{0,2}).*$/, "$1"); setAmt(v); }}
              className="num h-full min-w-0 flex-1 bg-transparent px-2 text-4xl font-bold outline-none placeholder:text-canvas-3" />
            <span className="text-sm font-semibold text-ink-mute">USD</span>
          </div>
          <p id="amt-d" className={clsx("mt-2 text-[13px]", tooLow || tooHigh ? "font-medium text-rose-700" : "text-ink-mute")}>
            {tooLow ? `The minimum is ${usd(MIN_FUND, 0)}.` : tooHigh ? `The maximum is ${usd(MAX_FUND, 0)} per payment.` : amountOk ? `Provider receives about ${ngn(amount)} (${fxLabel()}).` : `Minimum ${usd(MIN_FUND, 0)}.`}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {[["Lower end", p.price[0]], ["Typical", Math.round((p.price[0] + p.price[1]) / 2)], ["Full package", p.price[1]]].map(([l, v]) => (
              <button key={l as string} type="button" onClick={() => setAmt(String(v))}
                className={clsx("rounded-xl border p-3 text-left transition", amt === String(v) ? "border-brand-600 bg-brand-50 shadow-[0_0_0_3px_rgba(15,154,163,.14)]" : "border-line bg-white hover:border-line-strong")}>
                <div className="text-[11.5px] font-semibold text-ink-mute">{l as string}</div>
                <div className="num text-lg font-bold">{usd(v as number, 0)}</div>
              </button>
            ))}
          </div>

          {amountOk && (
            <div className="mt-6 flex animate-fade-in items-start gap-3 rounded-xl bg-canvas-2/70 p-4 text-[13px] leading-relaxed text-ink-soft">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <span>This releases about <b className="num">{usd(perStep)}</b> to the provider for each of the {payableSteps(p)} steps, only after each is confirmed.</span>
            </div>
          )}
        </section>
      )}

      {/* ---------- 3. Review ---------- */}
      {step === 2 && ep && p && (
        <section className="animate-fade-in" aria-label="Review">
          <h2 className="mb-4 text-xl font-bold">Review and pay</h2>
          <div className="card divide-y divide-line px-5">
            <Row label="Care" value={`${p.name} · ${who(ep.beneficiaryId)?.name}`} />
            <Row label="Held for care" value={usd(amount)} />
            <Row label={`Funding fee (1%, min ${usd(0.5)})`} value={usd(fee)} />
            <Row label="You pay" value={usd(amount + fee)} strong />
            <Row label={`Provider receives (approx.)`} value={ngn(amount)} mute />
          </div>

          <h3 className="mb-3 mt-7 font-bold">Pay with</h3>
          <div role="radiogroup" aria-label="Payment method" className="space-y-3">
            {METHODS.map((m) => (
              <ChoiceCard key={m.id} selected={method === m.id} onSelect={() => setMethod(m.id)}>
                <div className="flex items-center gap-3.5 pr-8">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-canvas text-ink-soft"><m.icon className="h-5 w-5" /></span>
                  <div><div className="font-bold">{m.t}</div><div className="text-[13px] text-ink-mute">{m.d}</div></div>
                </div>
              </ChoiceCard>
            ))}
          </div>

          <details className="card group mt-6 px-5">
            <summary className="flex h-14 cursor-pointer list-none items-center justify-between text-sm font-bold">
              How this is released
              <span className="text-xs font-semibold text-brand-700 group-open:hidden">Show schedule</span>
            </summary>
            <ul className="divide-y divide-line border-t border-line pb-2">
              {p.steps.slice(1).map((s, i) => (
                <li key={s} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="flex items-center gap-2.5"><span className="grid h-5 w-5 place-items-center rounded-full bg-canvas-2 text-[11px] font-bold text-ink-mute">{i + 1}</span>{s}</span>
                  <span className="num font-semibold">{usd(perStep)}</span>
                </li>
              ))}
            </ul>
          </details>

          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-ink-mute"><Lock className="h-3.5 w-3.5" />Demo only. No real money moves in this prototype.</p>
        </section>
      )}

      {/* ---------- Actions ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-line bg-white/90 px-4 pb-safe pt-3 backdrop-blur-xl lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        {backStep !== null && step > 0 && <Button variant="outline" size="lg" onClick={() => go(backStep)} icon={<ArrowLeft className="h-5 w-5" />}>Back</Button>}
        {step < 2 ? (
          <Button size="lg" className="flex-1" disabled={step === 0 ? !id : !amountOk} onClick={() => go(step + 1)}>
            Continue{step === 1 && amountOk ? ` · ${usd(amount)}` : ""} <ArrowRight className="h-5 w-5" />
          </Button>
        ) : (
          <Button size="lg" className="flex-1" loading={busy} onClick={pay} icon={<Lock className="h-[18px] w-[18px]" />}>Pay {usd(amount + fee)}</Button>
        )}
      </div>
    </div>
  );
}
