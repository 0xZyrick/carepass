import { NextResponse } from "next/server";
import { authed, err } from "@/server/http";
import { codeFor } from "@/server/care";

/** The family's visit code for the next step. */
export const GET = authed<{ id: string }>(["family", "sponsor"], async (_req, me, { id }) => {
  const r = await codeFor(me, id);
  return r.ok ? NextResponse.json(r.value) : err(r.error, r.status);
});
