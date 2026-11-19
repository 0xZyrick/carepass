import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { authed, body, err } from "@/server/http";
import { db, schema } from "@/server/passes";
import { confirmVisit } from "@/server/care";

export const maxDuration = 60;

/** A clinic confirms a visit with the family's code. The step's payment is released from the pass. */
export const POST = authed(["clinic"], async (req, me) => {
  const [c] = await db.select().from(schema.clinic).where(eq(schema.clinic.ownerId, me.id));
  if (!c) return err("Set up your clinic first.", 404);
  if (!c.verified) return err("Visits can be confirmed once your clinic is verified.", 403);
  const b = await body<{ code?: unknown }>(req);
  const r = await confirmVisit(c, String(b.code ?? ""));
  return r.ok ? NextResponse.json(r.value) : err(r.error, r.status);
});
