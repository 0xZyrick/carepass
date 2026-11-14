import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { authed, body, err, money } from "@/server/http";
import { db, getOwnedPass, schema, uid } from "@/server/passes";

export const POST = authed<{ id: string }>(["family", "sponsor"], async (req, me, { id }) => {
  const row = await getOwnedPass(me, id, "family");
  if (!row) return err("Pass not found.", 404);
  const b = await body<{ amount?: unknown; note?: unknown }>(req);
  const amount = money(b.amount, 1, 2000);
  if (!amount) return err("Enter an amount between $1 and $2,000.");
  await db.delete(schema.topupRequest).where(eq(schema.topupRequest.passId, id));
  await db.insert(schema.topupRequest).values({ id: uid(), passId: id, amountCents: Math.round(amount * 100), note: String(b.note ?? "").trim().slice(0, 200) });
  return NextResponse.json({ ok: true }, { status: 201 });
});
