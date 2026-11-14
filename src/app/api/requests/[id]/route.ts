import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { authed, err } from "@/server/http";
import { db, schema } from "@/server/passes";

export const DELETE = authed<{ id: string }>(["sponsor"], async (_req, me, { id }) => {
  const [r] = await db
    .select({ id: schema.topupRequest.id, sponsorId: schema.pass.sponsorId })
    .from(schema.topupRequest)
    .innerJoin(schema.pass, eq(schema.pass.id, schema.topupRequest.passId))
    .where(eq(schema.topupRequest.id, id));
  if (!r || r.sponsorId !== me.id) return err("Request not found.", 404);
  await db.delete(schema.topupRequest).where(eq(schema.topupRequest.id, id));
  return NextResponse.json({ ok: true });
});
