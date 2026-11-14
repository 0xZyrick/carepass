"use client";

import { useEffect, useMemo, useState } from "react";
import { Keypair } from "@stellar/stellar-sdk";
import { Check, ExternalLink, Loader2, Play, ShieldCheck, ShieldX, X } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/ui";
import {
  ChainResult, TestnetConfig, checkOnChain, explorerContract, explorerTx, loadTestnetConfig, settleOnChain, shortId, vaultBalance,
} from "@/lib/testnet";
import { usd } from "@/lib/format";

const AMOUNTS = [25, 50, 120, 400];

/** Renders nothing unless `public/testnet.json` exists (i.e. the contracts have been deployed). */
export function OnChainLab() {
  const [cfg, setCfg] = useState<TestnetConfig | null>(null);
  useEffect(() => { loadTestnetConfig().then(setCfg); }, []);
  return cfg ? <Panel cfg={cfg} /> : null;
}

function Panel({ cfg }: { cfg: TestnetConfig }) {
  const stranger = useMemo(() => Keypair.random().publicKey(), []);
  const [dest, setDest] = useState(cfg.merchants[0].address);
  const [amount, setAmount] = useState(50);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<ChainResult | null>(null);
  const [err, setErr] = useState("");
  const [settle, setSettle] = useState<"idle" | "signing" | { hash: string } | { error: string }>("idle");
  const [bal, setBal] = useState<number | null>(null);

  const refreshBal = () => vaultBalance(cfg).then(setBal).catch(() => setBal(null));
  useEffect(() => { refreshBal(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const options = [...cfg.merchants.slice(0, 3).map((m) => ({ label: m.name, value: m.address, bad: false })), { label: "Random wallet", value: stranger, bad: true }];
  const reset = () => { setRes(null); setErr(""); setSettle("idle"); };

  async function run() {
    reset(); setBusy(true);
    try { setRes(await checkOnChain(cfg, dest, amount)); }
    catch (e) { setErr(e instanceof Error ? e.message : "Could not reach the Stellar test network"); }
    finally { setBusy(false); }
  }

  async function doSettle() {
    setSettle("signing");
    try { const { hash } = await settleOnChain(cfg, dest, amount); setSettle({ hash }); refreshBal(); }
    catch (e) { setSettle({ error: e instanceof Error ? e.message : "Settlement failed" }); }
  }

  return (
    <section className="container-x pb-10" aria-label="Live Stellar testnet">
      <div className="relative overflow-hidden rounded-[32px] bg-brand-950 p-6 text-white sm:p-8">
        <div className="grain absolute inset-0" />
        <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/20 px-3 py-1.5 text-[11px] font-bold tracking-wider text-brand-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-400" /> LIVE · STELLAR TESTNET
            </span>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Run it on the real contract.</h2>
            <p className="mt-3 max-w-md text-white/65">These checks run inside the deployed Soroban pass contract on Stellar's test network. No real money.</p>
            <dl className="mt-6 space-y-2.5 text-sm">
              <div className="flex justify-between gap-4 border-b border-white/10 pb-2.5"><dt className="text-white/50">Pass contract</dt><dd><a className="inline-flex items-center gap-1.5 font-mono text-brand-300 hover:text-white" href={explorerContract(cfg.passId)} target="_blank" rel="noreferrer">{shortId(cfg.passId)} <ExternalLink className="h-3.5 w-3.5" /></a></dd></div>
              <div className="flex justify-between gap-4 border-b border-white/10 pb-2.5"><dt className="text-white/50">Registry contract</dt><dd><a className="inline-flex items-center gap-1.5 font-mono text-brand-300 hover:text-white" href={explorerContract(cfg.registryId)} target="_blank" rel="noreferrer">{shortId(cfg.registryId)} <ExternalLink className="h-3.5 w-3.5" /></a></dd></div>
              <div className="flex justify-between gap-4"><dt className="text-white/50">Vault balance (test USDC)</dt><dd className="num font-bold">{bal === null ? "—" : usd(bal)}</dd></div>
            </dl>
          </div>

          <div className="rounded-3xl bg-white/[0.06] p-5 ring-1 ring-white/10">
            <div className="eyebrow !text-white/50">Pay to</div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {options.map((o) => (
                <button key={o.label} onClick={() => { setDest(o.value); reset(); }} className={clsx("h-10 rounded-full border px-4 text-sm font-semibold transition", dest === o.value ? (o.bad ? "border-[#FF8C80] bg-[#FF8C80]/15 text-[#FF8C80]" : "border-brand-400 bg-brand-400/15 text-brand-200") : "border-white/15 text-white/70 hover:border-white/40")}>{o.label}</button>
              ))}
            </div>
            <input value={dest} onChange={(e) => { setDest(e.target.value); reset(); }} spellCheck={false} aria-label="Destination Stellar address" className="mt-3 h-12 w-full rounded-2xl border border-white/15 bg-black/25 px-4 font-mono text-[13px] text-white outline-none focus:border-brand-400" />
            <div className="eyebrow mt-5 !text-white/50">Amount</div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {AMOUNTS.map((a) => <button key={a} onClick={() => { setAmount(a); reset(); }} className={clsx("h-10 rounded-full border px-5 text-sm font-bold", amount === a ? "border-white bg-white text-ink" : "border-white/15 text-white/70 hover:border-white/40")}>${a}</button>)}
            </div>
            <Button size="lg" full variant="primary" className="mt-6" disabled={busy} onClick={run} icon={busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}>{busy ? "Asking the contract…" : `Check ${usd(amount, 0)} on testnet`}</Button>
            {err && <p className="mt-4 rounded-xl bg-rose-500/15 p-3 text-sm text-[#FFB1A8]">{err}</p>}
          </div>
        </div>

        {res && (
          <div className="relative mt-8 animate-scale-in rounded-3xl bg-white p-5 text-ink sm:p-6" role="status">
            <div className={clsx("flex items-center gap-3", res.approved ? "text-brand-700" : "text-rose-700")}>
              {res.approved ? <ShieldCheck className="h-9 w-9" /> : <ShieldX className="h-9 w-9" />}
              <div><div className="font-display text-2xl font-extrabold leading-tight">{res.approved ? "Contract would approve" : "Blocked by the contract"}</div><div className="text-sm text-ink-mute">{res.approved ? "Every rule passed on-chain." : res.error}</div></div>
            </div>
            <ol className="mt-5 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              {res.checks.map((c) => (
                <li key={c.id} className="flex items-start gap-3">
                  <span className={clsx("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white", c.status === "pass" ? "bg-brand-500" : c.status === "fail" ? "bg-rose-500" : "bg-line-strong")}>
                    {c.status === "pass" ? <Check className="h-3 w-3" strokeWidth={4} /> : c.status === "fail" ? <X className="h-3 w-3" strokeWidth={4} /> : <span className="h-0.5 w-2 rounded bg-white" />}
                  </span>
                  <div className="text-sm leading-snug"><div className={clsx("font-bold", c.status === "skipped" && "text-ink-faint")}>{c.label}</div><div className="text-ink-mute">{c.detail}</div></div>
                </li>
              ))}
            </ol>
            {res.approved && (
              <div className="mt-6 border-t border-line pt-5">
                {settle === "idle" && <Button onClick={doSettle} variant="dark">Settle for real on testnet</Button>}
                {settle === "signing" && <p className="flex items-center gap-2 text-sm font-semibold"><Loader2 className="h-4 w-4 animate-spin" /> Signing and submitting to Stellar…</p>}
                {typeof settle === "object" && "hash" in settle && <p className="text-sm font-semibold text-brand-700">Settled on Stellar testnet. <a className="inline-flex items-center gap-1 underline" href={explorerTx(settle.hash)} target="_blank" rel="noreferrer">View transaction <ExternalLink className="h-3.5 w-3.5" /></a></p>}
                {typeof settle === "object" && "error" in settle && <p className="text-sm font-medium text-rose-700">{settle.error}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
