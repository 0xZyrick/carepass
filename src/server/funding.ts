import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { refCode, toBeneficiary, uid } from "./passes";
import type { MoonpayTx } from "./moonpay";

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
  await db.insert(schema.ledger).values({ id: uid(), passId: claimed.passId, kind: "topup", amountCents: claimed.creditCents, method: "MoonPay (sandbox)", ref: refCode() });
  await db.delete(schema.topupRequest).where(eq(schema.topupRequest.passId, claimed.passId));
  return { credited: true, status };
}

export async function fundingView(id: string) {
  const [f] = await db.select().from(schema.funding).where(eq(schema.funding.id, id));
  if (!f) return null;
  const [p] = await db.select().from(schema.pass).where(eq(schema.pass.id, f.passId));
  return { funding: { id: f.id, status: f.status, credited: !!f.creditedAt, creditUsd: f.creditCents / 100 }, beneficiary: p ? toBeneficiary(p) : null };
}
