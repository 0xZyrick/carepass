"use client";

import { useState } from "react";
import { ArrowRight, Check, CheckCircle2, ClipboardCheck, FileText, Hourglass, KeyRound, Paperclip, Search, Wallet } from "lucide-react";
import clsx from "clsx";
import { Avatar, Badge, Button, CatIcon, Empty, PageHeader, Sheet } from "@/components/ui/ui";
import { Chip, CodeInput } from "@/components/ui/forms";
import { CareTimeline } from "@/components/CareTimeline";
import { useStore } from "@/lib/store";
import { CareEpisode, PACKAGES, held, isClosed, pkgOf, released, stepPayout, visitCode } from "@/lib/care";
import { MERCHANTS } from "@/lib/data";
import { usd } from "@/lib/format";

type Action = "code" | "intake" | "waiting" | "done";
const actionOf = (e: CareEpisode): Action => (isClosed(e) ? "done" : e.done > 1 ? "code" : e.docs.length > 0 ? "intake" : "waiting");

/* ---------- Confirm sheet ---------- */
function ConfirmSheet({ e, onClose }: { e: CareEpisode | null; onClose: () => void }) {
  const { beneficiaries, confirmVisit } = useStore();
  const [code, setCode] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [bad, setBad] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ payout: number; completed: boolean; step: string } | null>(null);

  function close() { setCode(""); setReceipt(null); setBad(false); setResult(null); onClose(); }
  if (!e) return null;

  const p = pkgOf(e.packageId), b = beneficiaries.find((x) => x.id === e.beneficiaryId);
  const intake = e.done === 1;
  const step = p.steps[e.done];

  function confirm() {
    if (!e) return;
    if (!intake && code.length < 4) return;
    setBusy(true);
    setTimeout(() => {
      const r = confirmVisit(e.id, code, receipt);
      setBusy(false);
      if (!r.ok) { setBad(true); setTimeout(() => setBad(false), 500); return; }
      setResult({ payout: r.payout ?? 0, completed: !!r.completed, step });
    }, 500);
  }

  return (
    <Sheet open onClose={close} title={result ? "Step confirmed" : intake ? "Confirm intake" : "Confirm visit"}
      footer={result ? <Button full size="lg" onClick={close}>Done</Button> : (
        <Button full size="lg" loading={busy} disabled={!intake && code.length < 4} onClick={confirm} icon={<Check className="h-5 w-5" />}>
          {intake ? "Confirm intake received" : `Confirm “${step}”`}
        </Button>
      )}>
      {result ? (
        <div className="py-4 text-center">
          <span className="mx-auto grid h-16 w-16 animate-pop place-items-center rounded-full bg-brand-600 text-white shadow-glow"><Check className="h-8 w-8" strokeWidth={3} /></span>
          <h3 className="mt-5 text-xl font-bold">{result.completed ? "Package completed" : `${result.step} confirmed`}</h3>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-ink-mute">{result.payout > 0 ? <><b className="num text-ink">{usd(result.payout)}</b> has been released to you for this step.</> : "No funds were held for this step."}</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl bg-canvas p-3.5">
            {b && <Avatar initials={b.initials} hue={b.hue} size={40} />}
            <div className="min-w-0"><div className="truncate font-bold">{b?.fullName}</div><div className="text-[13px] text-ink-mute">{p.name} · {step}</div></div>
          </div>

          {intake ? (
            <div>
              <div className="mb-2 text-sm font-bold">Documents from the family</div>
              <ul className="space-y-2">
                {e.docs.map((d) => (
                  <li key={d.url + d.name}>
                    <a href={d.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-line p-3 text-sm font-semibold transition hover:bg-canvas">
                      <FileText className="h-5 w-5 text-brand-600" /><span className="min-w-0 flex-1 truncate">{d.name}</span><span className="text-xs text-brand-700">Open</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <div>
                <div className="mb-1 text-sm font-bold">Enter the patient’s 4-digit code</div>
                <p className="mb-4 text-[13px] text-ink-mute">They’ll show it on their phone at the visit.</p>
                <CodeInput value={code} onChange={(v) => { setCode(v); setBad(false); }} invalid={bad} label="Visit code" autoFocus />
                <div className="mt-3 flex min-h-5 items-center justify-center text-center text-[13px]">
                  {bad ? <span className="font-medium text-rose-700">That code doesn’t match. Check with the patient.</span> : (
                    <button type="button" onClick={() => setCode(visitCode(e))} className="font-semibold text-ink-mute underline decoration-line-strong underline-offset-2 hover:text-ink">Demo code: {visitCode(e)} · tap to fill</button>
                  )}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-baseline justify-between text-sm font-bold">Invoice or receipt<span className="text-xs font-medium text-ink-mute">Optional</span></div>
                <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-line-strong px-4 py-3 text-sm font-semibold text-ink-soft transition hover:bg-canvas focus-within:ring-2 focus-within:ring-brand-500">
                  <Paperclip className="h-5 w-5 shrink-0" /><span className="min-w-0 flex-1 truncate">{receipt ? receipt.name : "Attach a file"}</span>
                  <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(ev) => setReceipt(ev.target.files?.[0] ?? null)} />
                </label>
                <p className="mt-2 text-xs text-ink-mute">Must not contain clinical results. Sponsors can see it.</p>
              </div>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}

/* ---------- Case card ---------- */
function CaseCard({ e, onOpen }: { e: CareEpisode; onOpen: () => void }) {
  const { beneficiaries } = useStore();
  const p = pkgOf(e.packageId), b = beneficiaries.find((x) => x.id === e.beneficiaryId);
  const a = actionOf(e);
  const meta = {
    code: { label: "Needs confirmation", tone: "sun" as const, cta: `Confirm “${p.steps[e.done]}”`, hint: "Waiting for the patient’s visit code." },
    intake: { label: "Documents received", tone: "iris" as const, cta: "Review & confirm intake", hint: "Documents are ready to review." },
    waiting: { label: "Awaiting documents", tone: "ink" as const, cta: "", hint: "The family hasn’t sent documents yet." },
    done: { label: "Completed", tone: "brand" as const, cta: "", hint: "All steps confirmed." },
  }[a];

  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-start gap-3.5">
        {b && <Avatar initials={b.initials} hue={b.hue} size={44} />}
        <div className="min-w-0 flex-1"><div className="truncate font-bold">{b?.fullName}</div><div className="truncate text-[13px] text-ink-mute">{p.name} · {b?.city}</div></div>
        <Badge tone={meta.tone} dot>{meta.label}</Badge>
      </div>

      <div className="mt-4 rounded-xl bg-canvas p-3.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">{a === "done" ? "Status" : "Current step"}</div>
        <div className="mt-0.5 flex items-center justify-between gap-3">
          <span className="font-semibold">{a === "done" ? "Package completed" : p.steps[e.done]}</span>
          {e.funded > 0 && a !== "done" && <span className="num shrink-0 text-sm font-bold text-brand-700">+{usd(stepPayout(e))}</span>}
        </div>
        <div className="mt-1 text-[13px] text-ink-mute">{e.funded === 0 && a !== "done" ? "Not funded yet: nothing will release on confirmation." : meta.hint}</div>
      </div>

      {meta.cta ? (
        <Button className="mt-4" full onClick={onOpen} icon={a === "code" ? <KeyRound className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}>{meta.cta}</Button>
      ) : (
        <div className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong text-sm font-semibold text-ink-mute">
          {a === "waiting" ? <><Hourglass className="h-4 w-4" />Waiting on the family</> : <><CheckCircle2 className="h-4 w-4" />Nothing to do</>}
        </div>
      )}

      <details className="group mt-3">
        <summary className="flex h-10 cursor-pointer list-none items-center justify-between rounded-lg px-1 text-sm font-semibold text-ink-soft">All steps<ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" /></summary>
        <div className="pt-3"><CareTimeline steps={p.steps} done={e.done} confirms={e.confirms} payout={e.funded > 0 ? stepPayout(e) : undefined} /></div>
      </details>
    </article>
  );
}

/* ---------- Page ---------- */
export default function ProviderDesk() {
  const { episodes, beneficiaries } = useStore();
  const ids = new Set(PACKAGES.flatMap((p) => p.providerIds));
  const providers = MERCHANTS.filter((m) => ids.has(m.id));
  const [pid, setPid] = useState("m1");
  const [filter, setFilter] = useState<"action" | "all">("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const me = providers.find((m) => m.id === pid)!;
  const mine = episodes.filter((e) => e.providerId === pid);
  const paid = mine.reduce((s, e) => s + released(e), 0);
  const holdTotal = mine.reduce((s, e) => s + held(e), 0);
  const open = mine.filter((e) => !isClosed(e));
  const needs = mine.filter((e) => ["code", "intake"].includes(actionOf(e)));
  const shown = (filter === "action" ? needs : mine).filter((e) => {
    if (!q) return true;
    const b = beneficiaries.find((x) => x.id === e.beneficiaryId);
    return (b?.fullName + pkgOf(e.packageId).name).toLowerCase().includes(q.toLowerCase());
  });
  const sheetEp = episodes.find((e) => e.id === openId) ?? null;

  const stat = (l: string, v: string, I: typeof Wallet, tone = "text-brand-700 bg-brand-50") => (
    <div className="card flex items-center gap-4 p-4 sm:p-5">
      <span className={clsx("grid h-11 w-11 shrink-0 place-items-center rounded-xl", tone)}><I className="h-5 w-5" /></span>
      <div className="min-w-0"><div className="num text-2xl font-bold leading-none sm:text-[28px]">{v}</div><div className="mt-1 truncate text-[13px] font-medium text-ink-mute">{l}</div></div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader eyebrow="Provider desk" title={me.name} sub="Confirm each step with the patient’s visit code. Payment is released the moment you confirm." />

      {/* Facility switcher */}
      <div className="mb-6">
        <div className="eyebrow mb-2.5">Viewing as</div>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Facility">
          {providers.map((m) => (
            <Chip key={m.id} on={pid === m.id} onClick={() => setPid(m.id)} className="gap-2 pl-2.5">
              <CatIcon type={m.type} boxed={false} className="h-4 w-4" />{m.name}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {stat("Open care packages", String(open.length), ClipboardCheck, "bg-iris-50 text-iris-700")}
        {stat("Paid out to you", usd(paid), Wallet)}
        {stat("Held for upcoming steps", usd(holdTotal), Hourglass, "bg-sun-50 text-sun-600")}
      </div>

      {/* Toolbar */}
      <div className="mb-5 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Chip on={filter === "all"} onClick={() => setFilter("all")}>All patients · {mine.length}</Chip>
          <Chip on={filter === "action"} onClick={() => setFilter("action")}>Needs action · {needs.length}</Chip>
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} type="search" aria-label="Search patients" placeholder="Search patients"
            className="h-11 w-full rounded-xl border border-line-strong bg-white pl-10 pr-3 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-500/15" />
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="card"><Empty icon={<ClipboardCheck />} title={mine.length === 0 ? "No care packages yet" : "Nothing here"} sub={mine.length === 0 ? "Packages assigned to this facility will appear here." : "No patients match this view."} /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((e) => <CaseCard key={e.id} e={e} onOpen={() => setOpenId(e.id)} />)}
        </div>
      )}

      <ConfirmSheet key={sheetEp?.id ?? "none"} e={sheetEp} onClose={() => setOpenId(null)} />
    </div>
  );
}
