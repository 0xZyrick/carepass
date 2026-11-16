"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { BadgeCheck, Clock, Download, Pencil, Printer, Receipt } from "lucide-react";
import clsx from "clsx";
import { Button, CatIcon, Empty, Money, Stamp } from "@/components/ui/ui";
import { useStore, type ClinicInput, type MyClinic } from "@/lib/store";
import { CATEGORIES, type Category } from "@/lib/data";
import { dayLabel, ngn, usd } from "@/lib/format";
import { receiptUrl } from "@/lib/site";

const BANKS = ["Access Bank", "GTBank", "Zenith Bank", "First Bank", "UBA", "Fidelity Bank", "Stanbic IBTC", "Wema Bank", "Other"];
const field = "mt-2 h-[52px] w-full rounded-2xl border border-line-strong bg-white px-4 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15";

export default function ClinicHome() {
  const { myClinic } = useStore();
  const [editing, setEditing] = useState(false);
  if (!myClinic || editing) return <Setup existing={myClinic} onDone={() => setEditing(false)} />;
  return <Dashboard clinic={myClinic} onEdit={() => setEditing(true)} />;
}

function Setup({ existing, onDone }: { existing: MyClinic | null; onDone: () => void }) {
  const { saveClinic, me } = useStore();
  const [f, setF] = useState<ClinicInput>({
    name: existing?.name ?? "", type: existing?.type ?? "hospital", city: existing?.city ?? "Lagos", area: existing?.area ?? "",
    bankName: existing?.bankName ?? BANKS[0], accountLast4: existing?.accountLast4 ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = <K extends keyof ClinicInput>(k: K, v: ClinicInput[K]) => { setF((x) => ({ ...x, [k]: v })); setErr(""); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.name.trim().length < 2) return setErr("Enter the name of your clinic.");
    if (f.accountLast4 && !/^\d{4}$/.test(f.accountLast4)) return setErr("Enter the last 4 digits of your account number.");
    setBusy(true);
    const ok = await saveClinic(f, !!existing);
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-lg animate-fade-up">
      <h1 className="font-display text-[32px] font-semibold leading-tight">{existing ? "Clinic details" : `Welcome${me?.name ? `, ${me.name.split(" ")[0]}` : ""}`}</h1>
      <p className="mt-2 text-ink-mute">{existing ? "Update how your clinic appears to patients." : "Tell us about your clinic. We'll give you a QR code so families can pay you."}</p>

      <label className="mt-8 block"><span className="text-sm font-semibold">Clinic name</span>
        <input className={field} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Lagoon Family Clinic" autoComplete="organization" /></label>

      <fieldset className="mt-5"><legend className="text-sm font-semibold">What kind of care do you provide?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" onClick={() => set("type", c.id as Category)} aria-pressed={f.type === c.id}
              className={clsx("flex h-12 items-center justify-center rounded-2xl border px-2 text-[13px] font-semibold", f.type === c.id ? "border-ink bg-ink text-white" : "border-line-strong bg-white")}>{c.label}</button>
          ))}
        </div></fieldset>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <label className="block"><span className="text-sm font-semibold">City</span>
          <select className={field} value={f.city} onChange={(e) => set("city", e.target.value as "Lagos" | "Abuja")}><option>Lagos</option><option>Abuja</option></select></label>
        <label className="block"><span className="text-sm font-semibold">Area</span>
          <input className={field} value={f.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Yaba" /></label>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_130px] gap-3">
        <label className="block"><span className="text-sm font-semibold">Bank for payouts</span>
          <select className={field} value={f.bankName} onChange={(e) => set("bankName", e.target.value)}>{BANKS.map((b) => <option key={b}>{b}</option>)}</select></label>
        <label className="block"><span className="text-sm font-semibold">Account ends in</span>
          <input className={clsx(field, "font-mono")} value={f.accountLast4} inputMode="numeric" maxLength={4} onChange={(e) => set("accountLast4", e.target.value.replace(/\D/g, ""))} placeholder="0000" /></label>
      </div>
      {err && <p role="alert" className="mt-4 text-sm font-medium text-rose-700">{err}</p>}
      <div className="mt-8 flex gap-3">
        <Button type="submit" size="lg" full disabled={busy}>{existing ? "Save changes" : "Create my clinic"}</Button>
        {existing && <Button type="button" size="lg" variant="outline" onClick={onDone}>Cancel</Button>}
      </div>
    </form>
  );
}

function Dashboard({ clinic, onEdit }: { clinic: MyClinic; onEdit: () => void }) {
  const { clinicPayments } = useStore();
  const [qr, setQr] = useState("");
  const payload = `carepass:clinic:${clinic.id}`;
  useEffect(() => { QRCode.toDataURL(payload, { margin: 1, width: 640, color: { dark: "#16241d", light: "#ffffff" } }).then(setQr).catch(() => setQr("")); }, [payload]);

  const { today, month, total } = useMemo(() => {
    const now = new Date();
    let today = 0, month = 0, total = 0;
    for (const p of clinicPayments) {
      const d = new Date(p.at); total += p.amount;
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) { month += p.amount; if (d.getDate() === now.getDate()) today += p.amount; }
    }
    return { today, month, total };
  }, [clinicPayments]);

  const pending = !clinic.verified;
  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5"><CatIcon type={clinic.type} />
          <div><h1 className="font-display text-[28px] font-semibold leading-tight">{clinic.name}</h1>
            <div className="text-sm text-ink-mute">{clinic.area ? `${clinic.area}, ` : ""}{clinic.city}</div></div></div>
        <button onClick={onEdit} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold shadow-card"><Pencil className="h-4 w-4" /> Edit</button>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[320px_1fr]">
        <section className="receipt-wrap">
          <div className="receipt px-6 pb-8 pt-7 text-center">
            {pending ? <Stamp tone="wait"><Clock className="h-3.5 w-3.5" /> In review</Stamp> : <Stamp tone="ok"><BadgeCheck className="h-3.5 w-3.5" /> Verified</Stamp>}
            <div className="mx-auto mt-5 grid aspect-square w-full max-w-[240px] place-items-center rounded-2xl bg-white p-2 ring-1 ring-line">
              {qr ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={qr} alt={`QR code for ${clinic.name}`} className="h-full w-full" /> : <span className="text-sm text-ink-mute">Preparing…</span>}
            </div>
            <div className="mt-4 font-mono text-lg font-semibold tracking-widest">{clinic.id}</div>
            <p className="mt-1 text-[13px] text-ink-mute">{pending ? "We're verifying your clinic. Payments open once you're approved." : "Show this at your desk. Families scan it to pay you."}</p>
            <div className="tear mt-5" />
            <div className="mt-4 grid grid-cols-2 gap-2 print:hidden">
              <Button variant="outline" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Print</Button>
              <a href={qr || undefined} download={`carepass-${clinic.id}.png`} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-line-strong bg-white px-4 text-sm font-semibold"><Download className="h-4 w-4" /> Save</a>
            </div>
          </div>
        </section>

        <section>
          <div className="grid grid-cols-3 gap-3">
            {[["Today", today], ["This month", month], ["All time", total]].map(([l, v]) => (
              <div key={l as string} className="rounded-2xl bg-white p-4 shadow-card">
                <div className="text-xs font-semibold text-ink-mute">{l}</div>
                <div className="num mt-1.5 text-xl font-bold">{usd(v as number, 0)}</div>
                <div className="text-xs text-ink-mute">{ngn(v as number)}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-ink-mute">{clinic.accountLast4 ? `Payouts go to ${clinic.bankName} ending ${clinic.accountLast4}.` : "Add your bank details under Edit to receive payouts."}</p>

          <h2 className="mt-7 font-display text-xl font-semibold">Payments received</h2>
          <div className="mt-3 space-y-2.5">
            {clinicPayments.length === 0 && <div className="rounded-3xl bg-white shadow-card"><Empty icon={<Receipt className="h-6 w-6" />} title="No payments yet" sub="When a family pays with your QR code, the receipt shows up here." /></div>}
            {clinicPayments.map((p) => (
              <article key={p.id} className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-card">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Receipt className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1"><div className="truncate font-bold">{p.patient}</div><div className="truncate text-[13px] text-ink-mute">{p.note || "Payment"} · {dayLabel(p.daysAgo)}, {p.time}{p.chainTx && <> · <a href={receiptUrl(p.chainTx)} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 underline">Network receipt</a></>}</div></div>
                <Money amount={p.amount} size="sm" />
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
