import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { authed, err } from "@/server/http";
import { db, schema } from "@/server/passes";
import { settle } from "@/server/settlement";

export const maxDuration = 60;

/** Tries a failed Naira payout again. The id is the payment's id. */
export const POST = authed<{ id: string }>(["clinic"], async (_req, me, { id }) => {
  const [c] = await db.select().from(schema.clinic).where(eq(schema.clinic.ownerId, me.id));
  if (!c) return err("Set up your clinic first.", 404);
  const [s] = await db.select().from(schema.settlement).where(and(eq(schema.settlement.ledgerId, id), eq(schema.settlement.clinicId, c.id)));
  if (!s) return err("Payout not found.", 404);
  if (s.status === "paid") return NextResponse.json({ status: "paid" });
  const u = await settle(id);
  return NextResponse.json({ status: u?.status ?? s.status });
});
