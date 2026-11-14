import { NextResponse } from "next/server";
import { authed } from "@/server/http";
import { loadState } from "@/server/passes";

export const dynamic = "force-dynamic";
export const GET = authed("any", async (_req, me) => NextResponse.json(await loadState(me)));
