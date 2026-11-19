import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, CircleAlert, Clock } from "lucide-react";
import { verifyReceipt } from "@/server/verify";
import { receiptUrl } from "@/lib/site";
import { ngn, usd } from "@/lib/format";
import { Stamp } from "@/components/ui/ui";
import { CATEGORIES } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Verify a receipt", robots: { index: false } };

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const v = await verifyReceipt((await params).id);
  if (!v) notFound();
  const { receipt: r } = v;
  const ok = v.intact && (!v.chain.checked || v.chain.matches);
  const rows: [string, string][] = [
    ["Paid to", r.clinic], ["Amount", `${usd(r.amountCents / 100)} (${ngn(r.amountCents / 100)})`], ["For", CATEGORIES.find((c) => c.id === r.category)?.label ?? "Care"],
    ["Date", new Date(r.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })], ["Reference", r.ref],
  ];
  return (
    <main className="mx-auto max-w-lg px-4 py-14">
      <div className="receipt-wrap"><div className="receipt px-6 pb-8 pt-7">
        <div className="text-center">
          {ok ? <Stamp tone="ok"><BadgeCheck className="h-3.5 w-3.5" /> Receipt verified</Stamp> : <Stamp tone="no"><CircleAlert className="h-3.5 w-3.5" /> Doesn't match</Stamp>}
          <h1 className="mt-4 font-display text-3xl font-semibold">{usd(r.amountCents / 100)} to {r.clinic}</h1>
        </div>
        <dl className="mt-6 divide-y divide-line text-sm">
          {rows.map(([k, val]) => <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-ink-mute">{k}</dt><dd className="text-right font-semibold">{val}</dd></div>)}
        </dl>
        <div className="tear my-5" />
        <ul className="space-y-2.5 text-sm">
          <li className="flex gap-2.5">{v.intact ? <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />}<span>{v.intact ? "The receipt is unchanged since it was issued." : "This receipt has been altered."}</span></li>
          <li className="flex gap-2.5">
            {v.chain.checked ? (v.chain.matches ? <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />) : <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute" />}
            <span>{v.chain.checked ? (v.chain.matches ? "Its fingerprint matches the one recorded with the payment on the Stellar network." : "Its fingerprint does NOT match the network record.") : v.chainTx ? "The network couldn't be reached just now to compare. Try again shortly." : "This payment was not recorded on the network."}</span>
          </li>
          {v.paidInNaira && <li className="flex gap-2.5"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /><span>The clinic was paid ₦{Math.round(v.paidInNaira.ngn).toLocaleString()} in Naira at ₦{v.paidInNaira.rate.toLocaleString()} per dollar.</span></li>}
        </ul>
        {v.chainTx && <a href={receiptUrl(v.chainTx)} target="_blank" rel="noreferrer" className="mt-5 block text-center text-sm font-semibold text-brand-700 underline">See the payment on the network ↗</a>}
        <p className="mt-5 break-all text-center font-mono text-[11px] text-ink-faint">sha256 {v.hash}</p>
      </div></div>
    </main>
  );
}
