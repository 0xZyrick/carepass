import { NextResponse } from "next/server";
import { authed, err } from "@/server/http";
import { cancelPlan } from "@/server/care";

export const POST = authed<{ id: string }>(["sponsor", "family"], async (_req, me, { id }) => {
  const r = await cancelPlan(me, id);
  return r.ok ? NextResponse.json({ ok: true }) : err(r.error, r.status);
});
