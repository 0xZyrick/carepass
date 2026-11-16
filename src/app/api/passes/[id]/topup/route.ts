import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { authed, body, err, money } from "@/server/http";
import { depositFor } from "@/server/chain";
import { db, getOwnedPass, refCode, schema, toBeneficiary, toTx, uid } from "@/server/passes";

/**
 * Adds care credit to a pass.
 * Test-mode funding: the credit is recorded and, when the network is connected, deposited into the pass's vault.
 */
export const maxDuration = 60;

export const POST = authed<{ id: string }>(["sponsor"], async (req, me, { id }) => {
  const row = await getOwnedPass(me, id, "sponsor");
  if (!row) return err("Pass not found.", 404);
  const b = await body<{ amount?: unknown; method?: unknown }>(req);
  const amount = money(b.amount, 1, 5000);
  if (!amount) return err("Enter an amount between $1 and $5,000.");
  const c = Math.round(amount * 100);
  const method = String(b.method ?? "Sandbox").slice(0, 40);

  const [saved] = await db.update(schema.pass).set({ balanceCents: sql`${schema.pass.balanceCents} + ${c}` }).where(eq(schema.pass.id, id)).returning();
  const [tx] = await db.insert(schema.ledger).values({ id: uid(), passId: id, kind: "topup", amountCents: c, method, ref: refCode() }).returning();
  await db.delete(schema.topupRequest).where(eq(schema.topupRequest.passId, id));
  await depositFor(id, tx.id);
  const [stamped] = await db.select().from(schema.ledger).where(eq(schema.ledger.id, tx.id));
  return NextResponse.json({ beneficiary: toBeneficiary(saved), tx: toTx(stamped ?? tx) });
});
