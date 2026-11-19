import { NextResponse } from "next/server";
import { authed, body, err } from "@/server/http";
import { createPlan } from "@/server/care";

/** Starts a care plan on a pass: a package plus a verified provider in the family's city for each kind of care. */
export const POST = authed(["sponsor", "family"], async (req, me) => {
  const b = await body<{ passId?: unknown; packageId?: unknown; providers?: unknown }>(req);
  const providers: Record<string, string> = {};
  if (b.providers && typeof b.providers === "object") for (const [k, v] of Object.entries(b.providers)) if (typeof v === "string") providers[k] = v.slice(0, 20);
  const r = await createPlan(me, { passId: String(b.passId ?? ""), packageId: String(b.packageId ?? ""), providers });
  return r.ok ? NextResponse.json({ id: r.value }, { status: 201 }) : err(r.error, r.status);
});
