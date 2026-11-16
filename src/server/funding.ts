import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { refCode, toBeneficiary, uid } from "./passes";
import type { MoonpayTx } from "./moonpay";
import { depositFor } from "./chain";

/**
 * Applies a MoonPay status to a funding row. When it is `completed`, the pass is credited exactly once:
 * the UPDATE only matches while credited_at is NULL, so a webhook and a poll arriving together cannot double-credit.
 */
export async function applyStatus(fundingId: string, tx: Pick<MoonpayTx, "id" | "status">) {
  const status = tx.status === "completed" ? "completed" : tx.status === "failed" ? "failed" : "pending";
  if (status !== "completed") {
    await db.update(schema.funding).set({ status, moonpayId: tx.id }).where(and(eq(schema.funding.id, fundingId), isNull(schema.funding.creditedAt)));
    return { credited: false, status };
  }
  const [claimed] = await db
    .update(schema.funding)
    .set({ status: "completed", moonpayId: tx.id, creditedAt: new Date() })
    .where(and(eq(schema.funding.id, fundingId), isNull(schema.funding.creditedAt)))
    .returning();
  if (!claimed) return { credited: false, status };
  await db.update(schema.pass).set({ balanceCents: sql`${schema.pass.balanceCents} + ${claimed.creditCents}` }).where(eq(schema.pass.id, claimed.passId));
  const ledgerId = uid();
  await db.insert(schema.ledger).values({ id: ledgerId, passId: claimed.passId, kind: "topup", amountCents: claimed.creditCents, method: "MoonPay (sandbox)", ref: refCode() });
  await db.delete(schema.topupRequest).where(eq(schema.topupRequest.passId, claimed.passId));
  await depositFor(claimed.passId, ledgerId);
  return { credited: true, status };
}

export async function fundingView(id: string) {
  const [f] = await db.select().from(schema.funding).where(eq(schema.funding.id, id));
  if (!f) return null;
  const [p] = await db.select().from(schema.pass).where(eq(schema.pass.id, f.passId));
  return { funding: { id: f.id, status: f.status, credited: !!f.creditedAt, creditUsd: f.creditCents / 100 }, beneficiary: p ? toBeneficiary(p) : null };
}

/** Credits a pass from a completed anchor deposit, exactly once, for the amount that actually arrived. */
export async function applyAnchorResult(fundingId: string, r: { state: "pending" | "completed" | "failed"; cents: number; stellarTx?: string }) {
  if (r.state !== "completed" || r.cents <= 0) {
    if (r.state === "failed") await db.update(schema.funding).set({ status: "failed" }).where(and(eq(schema.funding.id, fundingId), isNull(schema.funding.creditedAt)));
    return { credited: false, status: r.state };
  }
  const [claimed] = await db
    .update(schema.funding)
    .set({ status: "completed", creditedAt: new Date(), creditCents: r.cents, chargeCents: r.cents })
    .where(and(eq(schema.funding.id, fundingId), isNull(schema.funding.creditedAt)))
    .returning();
  if (!claimed) return { credited: false, status: "completed" };
  await db.update(schema.pass).set({ balanceCents: sql`${schema.pass.balanceCents} + ${claimed.creditCents}` }).where(eq(schema.pass.id, claimed.passId));
  const ledgerId = uid();
  await db.insert(schema.ledger).values({ id: ledgerId, passId: claimed.passId, kind: "topup", amountCents: claimed.creditCents, method: "Stellar USDC", ref: refCode(), chainTx: r.stellarTx ?? null });
  await db.delete(schema.topupRequest).where(eq(schema.topupRequest.passId, claimed.passId));
  await depositFor(claimed.passId); // moves the USDC from the sponsor's account into the pass's vault
  return { credited: true, status: "completed" };
}
