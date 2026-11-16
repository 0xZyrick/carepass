import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { authed, body, err, money } from "@/server/http";
import { syncRules } from "@/server/chain";
import { CAT_IDS, db, getOwnedPass, schema, toBeneficiary } from "@/server/passes";

export const maxDuration = 60;

export const PATCH = authed<{ id: string }>(["sponsor"], async (req, me, { id }) => {
  const row = await getOwnedPass(me, id, "sponsor");
  if (!row) return err("Pass not found.", 404);
  const b = await body<Record<string, unknown>>(req);
  const set: Partial<typeof schema.pass.$inferInsert> = {};
  if (b.frozen !== undefined) set.frozen = Boolean(b.frozen);
  if (b.monthlyLimit !== undefined) {
    const v = money(b.monthlyLimit, 1, 5000); if (!v) return err("Monthly limit must be between $1 and $5,000.");
    set.monthlyLimitCents = Math.round(v * 100);
  }
  if (b.perTxLimit !== undefined) {
    const v = money(b.perTxLimit, 1, 5000); if (!v) return err("Per-payment cap must be between $1 and $5,000.");
    set.perTxLimitCents = Math.round(v * 100);
  }
  if (b.allowed !== undefined) {
    const a = Array.isArray(b.allowed) ? (b.allowed as string[]).filter((c) => CAT_IDS.includes(c)) : [];
    if (!a.length) return err("Allow at least one type of care.");
    set.allowed = a;
  }
  const perTx = set.perTxLimitCents ?? row.perTxLimitCents;
  const monthly = set.monthlyLimitCents ?? row.monthlyLimitCents;
  if (perTx > monthly) return err("Per-payment cap can't be higher than the monthly limit.");
  const [saved] = await db.update(schema.pass).set(set).where(eq(schema.pass.id, id)).returning();
  await syncRules(id);
  return NextResponse.json({ beneficiary: toBeneficiary(saved) });
});
