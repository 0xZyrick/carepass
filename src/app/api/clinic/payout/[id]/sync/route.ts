import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { authed, err } from "@/server/http";
import { db, schema } from "@/server/passes";
import { syncPayout } from "@/server/payout";

export const maxDuration = 60;

/** Asks the anchor where a cash-out stands and, when it is ready, sends the clinic's USDC. Safe to call repeatedly. */
export const POST = authed<{ id: string }>(["clinic"], async (_req, me, { id }) => {
  const [c] = await db.select().from(schema.clinic).where(eq(schema.clinic.ownerId, me.id));
  if (!c) return err("Set up your clinic first.", 404);
  try {
    const p = await syncPayout(c.id, id);
    return p ? NextResponse.json({ payout: p }) : err("Cash-out not found.", 404);
  } catch (e) {
    console.error("[payout] sync failed:", e instanceof Error ? e.message : e);
    return err("We couldn't check the cash-out just now.", 502);
  }
});
