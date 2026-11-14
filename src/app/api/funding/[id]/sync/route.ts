import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { authed, err } from "@/server/http";
import { db, schema } from "@/server/passes";
import { applyStatus, fundingView } from "@/server/funding";
import { fetchTransaction } from "@/server/moonpay";

/** Asks MoonPay where this checkout stands and credits the pass once it completes. Safe to call repeatedly. */
export const POST = authed<{ id: string }>(["sponsor"], async (_req, me, { id }) => {
  const [f] = await db.select().from(schema.funding).where(eq(schema.funding.id, id));
  if (!f || f.sponsorId !== me.id) return err("Funding not found.", 404);
  if (!f.creditedAt) {
    const tx = await fetchTransaction(id);
    if (tx) await applyStatus(id, tx);
  }
  return NextResponse.json(await fundingView(id));
});
