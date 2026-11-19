import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { after } from "next/server";
import { db, refCode, schema, toBeneficiary, uid, type LedgerRow } from "./passes";
import { evaluatePayment } from "@/lib/guardrail";
import { CONTRACT_REASON, ChainError, chainOn, confirmStepOnChain, payOnChain, prepareClinicPayment } from "./chain";
import { lockedCents } from "./locked";
import { hashReceipt, type Receipt } from "./receipt";
import { settle, settlementMode } from "./settlement";
import { clinicQr, toMerchant, type ClinicRow } from "./clinics";

type PassRow = typeof schema.pass.$inferSelect;
export type PayResult = { ok: true; tx: LedgerRow } | { ok: false; status: number; error: string };

/**
 * Pays a verified clinic from a pass on the server's own initiative (for example when a clinic confirms a visit).
 * It runs the same rules as a family payment (paused, verified provider, care type, enough unlocked balance), then the contract.
 */
export async function payClinic(row: PassRow, clinic: ClinicRow, cents: number, note: string, release?: { chainPlanId: number; index: number }): Promise<PayResult> {
  const locked = release ? 0 : await lockedCents(row.id); // money locked for care-plan steps isn't free to spend elsewhere
  const view = toBeneficiary(row);
  view.balance = Math.max(0, row.balanceCents - locked) / 100;
  const decision = evaluatePayment(view, clinicQr(clinic.id), cents / 100, () => toMerchant(clinic));
  if (!decision.approved) {
    const why = decision.checks.find((c) => c.status === "fail");
    return { ok: false, status: 409, error: why?.id === "balance" ? "The pass doesn't have enough funds for this step yet. Ask the sponsor to top it up, then confirm again." : decision.reason };
  }

  let clinicAddress: string | null = null;
  if (chainOn()) {
    try { clinicAddress = await prepareClinicPayment(row.id, clinic); }
    catch (e) { console.error("[chain] prepare failed:", e instanceof Error ? e.message : e); return { ok: false, status: 502, error: "We couldn't reach the payment network just now. Nothing was spent. Please try again." }; }
  }
  const [saved] = await db.update(schema.pass)
    .set({ balanceCents: sql`${schema.pass.balanceCents} - ${cents}`, lastActiveAt: new Date() })
    .where(and(eq(schema.pass.id, row.id), eq(schema.pass.frozen, false), gte(schema.pass.balanceCents, cents + locked))).returning();
  if (!saved) return { ok: false, status: 409, error: "The pass doesn't have enough funds yet, or it is paused." };

  const ledgerId = uid(), ref = refCode(), at = new Date();
  const receipt: Receipt = { v: 1, ref, clinicId: clinic.id, clinic: clinic.name, category: clinic.type, amountCents: cents, note: note.slice(0, 60), at: at.toISOString() };
  const receiptHash = hashReceipt(receipt);
  let chainTx: string | null = null;
  if (clinicAddress) {
    try { chainTx = release ? await confirmStepOnChain(row.id, clinic.id, release.chainPlanId, release.index, receiptHash) : await payOnChain(row.id, clinicAddress, cents, receiptHash); }
    catch (e) {
      await db.update(schema.pass).set({ balanceCents: sql`${schema.pass.balanceCents} + ${cents}` }).where(eq(schema.pass.id, row.id));
      if (e instanceof ChainError && e.code && CONTRACT_REASON[e.code]) return { ok: false, status: 409, error: CONTRACT_REASON[e.code] };
      console.error("[chain] pay failed:", e instanceof Error ? e.message : e);
      return { ok: false, status: 502, error: "The payment didn't go through on the network. Nothing was spent. Please try again." };
    }
  }
  const [tx] = await db.insert(schema.ledger).values({
    id: ledgerId, passId: row.id, kind: "payment", amountCents: cents, merchantLabel: clinic.name, clinicId: clinic.id, category: clinic.type,
    note: note.slice(0, 60) || null, ref, chainTx, createdAt: at, receiptHash, receipt,
  }).returning();
  if (settlementMode() !== "off") after(async () => { try { await settle(tx.id); } catch (e) { console.error("[settle] failed:", e instanceof Error ? e.message : e); } });
  return { ok: true, tx };
}
