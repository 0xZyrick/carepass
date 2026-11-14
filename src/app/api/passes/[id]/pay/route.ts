import { NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { authed, body, err, money } from "@/server/http";
import { db, getOwnedPass, refCode, schema, spentLast30Days, toBeneficiary, toTx, uid } from "@/server/passes";
import { evaluatePayment } from "@/lib/guardrail";

/** The guardrail runs HERE, on the server — the browser only displays the verdict. */
export const POST = authed<{ id: string }>(["family", "sponsor"], async (req, me, { id }) => {
  const row = await getOwnedPass(me, id, "family");
  if (!row) return err("Pass not found.", 404);
  const b = await body<{ dest?: unknown; amount?: unknown; note?: unknown }>(req);
  const dest = String(b.dest ?? "").trim().slice(0, 120);
  const amount = money(b.amount, 0.01, 100000);
  if (!dest) return err("Missing destination.");
  if (!amount) return err("Enter a valid amount.");
  const c = Math.round(amount * 100);

  const spent = await spentLast30Days(id);
  const decision = evaluatePayment(toBeneficiary(row), dest, amount, spent / 100);
  const m = decision.merchant;

  if (decision.approved) {
    // Atomic guard: only deducts if the pass is still unfrozen and funded (protects against double-spend races).
    const [saved] = await db
      .update(schema.pass)
      .set({ balanceCents: sql`${schema.pass.balanceCents} - ${c}`, lastActiveAt: new Date() })
      .where(and(eq(schema.pass.id, id), eq(schema.pass.frozen, false), gte(schema.pass.balanceCents, c)))
      .returning();
    if (saved) {
      const [tx] = await db.insert(schema.ledger).values({
        id: uid(), passId: id, kind: "payment", amountCents: c, merchantLabel: m!.name, category: m!.type, note: String(b.note ?? "").trim().slice(0, 60) || null, ref: refCode(),
      }).returning();
      return NextResponse.json({ decision, tx: toTx(tx), beneficiary: toBeneficiary(saved) });
    }
    decision.approved = false;
    decision.headline = "Payment declined";
    decision.reason = "The balance or pass status changed. Nothing was spent.";
  }

  const failed = decision.checks.find((x) => x.status === "fail");
  const short = dest.length > 12 ? `${dest.slice(0, 4)}…${dest.slice(-4)}` : dest;
  const [tx] = await db.insert(schema.ledger).values({
    id: uid(), passId: id, kind: "blocked", amountCents: c,
    merchantLabel: m ? m.name : `Unknown address ${short}`, note: failed?.detail ?? decision.reason, ref: refCode(),
  }).returning();
  return NextResponse.json({ decision, tx: toTx(tx) });
});
