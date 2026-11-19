import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "./db";
import { hashReceipt, type Receipt } from "./receipt";
import { settlementsFor } from "./settlement";

const horizon = () =>
  process.env.CHAIN_HORIZON_URL ?? ((process.env.CHAIN_NETWORK ?? "testnet") === "testnet" ? "https://horizon-testnet.stellar.org" : "https://horizon.stellar.org");

/** Checks a payment receipt twice: against what we stored, and against the hash recorded on the network with the payment. */
export async function verifyReceipt(id: string) {
  const [l] = await db.select().from(schema.ledger).where(and(eq(schema.ledger.id, id), eq(schema.ledger.kind, "payment")));
  if (!l?.receipt || !l.receiptHash) return null;
  const full = l.receipt as Receipt;
  const receipt = { ...full, note: "" }; // free-text notes can hold health details, so the public page never shows them
  const intact = hashReceipt(full) === l.receiptHash;
  let chain: { checked: boolean; matches: boolean } = { checked: false, matches: false };
  if (l.chainTx) {
    try {
      const r = await fetch(`${horizon()}/transactions/${l.chainTx}`, { signal: AbortSignal.timeout(8000), cache: "no-store" });
      if (r.ok) {
        const t = (await r.json()) as { memo_type?: string; memo?: string };
        chain = { checked: true, matches: t.memo_type === "hash" && !!t.memo && Buffer.from(t.memo, "base64").toString("hex") === l.receiptHash };
      }
    } catch { /* network unreachable: shown as "not checked" */ }
  }
  const s = (await settlementsFor([l.id])).get(l.id);
  return { receipt, hash: l.receiptHash, chainTx: l.chainTx, intact, chain, paidInNaira: s?.status === "paid" ? { ngn: s.amountKobo / 100, rate: s.rate, ref: s.providerRef } : null };
}
