import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { authed, err } from "@/server/http";
import { db, schema } from "@/server/passes";
import { anchorEnabled } from "@/server/anchor";
import { clinicBalanceCents, listPayouts, startPayout } from "@/server/payout";

export const maxDuration = 60;

async function myClinicRow(ownerId: string) {
  const [c] = await db.select().from(schema.clinic).where(eq(schema.clinic.ownerId, ownerId));
  return c;
}

/** What the clinic can cash out, and its recent cash-outs. */
export const GET = authed(["clinic"], async (_req, me) => {
  const c = await myClinicRow(me.id);
  if (!c) return err("Set up your clinic first.", 404);
  if (!anchorEnabled() || !c.chainAddress) return NextResponse.json({ enabled: false, balanceUsd: 0, payouts: [] });
  let balanceUsd = 0;
  try { balanceUsd = (await clinicBalanceCents(c.id)) / 100; } catch (e) { console.error("[payout] balance failed:", e instanceof Error ? e.message : e); }
  return NextResponse.json({ enabled: true, balanceUsd, payouts: await listPayouts(c.id) });
});

/** Opens the anchor's cash-out window. */
export const POST = authed(["clinic"], async (_req, me) => {
  const c = await myClinicRow(me.id);
  if (!c) return err("Set up your clinic first.", 404);
  if (!c.verified) return err("Cash-out opens once your clinic is verified.", 403);
  if (!anchorEnabled()) return err("Cash-out isn't set up on this server.", 503);
  try {
    if ((await clinicBalanceCents(c.id)) < 100) return err("You need at least $1 received before cashing out.", 400);
    return NextResponse.json(await startPayout(c.id), { status: 201 });
  } catch (e) {
    console.error("[payout] start failed:", e instanceof Error ? e.message : e);
    return err("We couldn't reach the Stellar anchor just now. Please try again.", 502);
  }
});
