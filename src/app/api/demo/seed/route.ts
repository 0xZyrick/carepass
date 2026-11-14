import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { authed, err } from "@/server/http";
import { SPONSOR_PREVIEW, db, schema, uid } from "@/server/passes";
import { SEED_BENEFICIARIES, SEED_REQUESTS, SEED_TXS } from "@/lib/data";

/** Loads the sample family (Adebola & Chioma) with history. `?reset=1` replaces the sponsor's existing passes. */
export const POST = authed(["sponsor"], async (req, me) => {
  if (!SPONSOR_PREVIEW) return err("Sample data is disabled.", 403);
  const reset = new URL(req.url).searchParams.get("reset") === "1";
  const mine = await db.select({ id: schema.pass.id }).from(schema.pass).where(eq(schema.pass.sponsorId, me.id));
  if (mine.length && !reset) return err("You already have family passes.", 409);
  if (reset) await db.delete(schema.pass).where(eq(schema.pass.sponsorId, me.id));

  const tag = me.id.replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase();
  const ids = new Map<string, string>();
  for (const b of SEED_BENEFICIARIES) {
    const id = uid(); ids.set(b.id, id);
    await db.insert(schema.pass).values({
      id, sponsorId: me.id, familyEmail: `${b.name.toLowerCase()}+${tag}@demo.carepass.app`, fullName: b.fullName, name: b.name,
      relation: b.relation, phone: b.phone, city: b.city, hue: b.hue, last4: b.last4, balanceCents: Math.round(b.balance * 100),
      monthlyLimitCents: b.monthlyLimit * 100, perTxLimitCents: b.perTxLimit * 100, allowed: b.allowed, frozen: false,
      lastActiveAt: new Date(Date.now() - 2 * 86400000),
    });
  }
  const day = 86400000;
  for (const t of SEED_TXS) {
    const [h, mi] = t.time.split(":").map(Number);
    const at = new Date(Date.now() - t.daysAgo * day); at.setHours(h, mi, 0, 0);
    await db.insert(schema.ledger).values({
      id: uid(), passId: ids.get(t.beneficiaryId)!, kind: t.kind, amountCents: Math.round(t.amount * 100),
      merchantLabel: t.merchant ?? null, category: t.category ?? null, note: t.note ?? null, method: t.method ?? null, ref: t.ref, createdAt: at,
    });
  }
  for (const r of SEED_REQUESTS) {
    await db.insert(schema.topupRequest).values({ id: uid(), passId: ids.get(r.beneficiaryId)!, amountCents: r.amount * 100, note: r.note });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
});
