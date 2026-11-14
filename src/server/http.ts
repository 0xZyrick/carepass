import "server-only";
import { NextResponse } from "next/server";
import { getMe, Me } from "./auth";

export const err = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

type Ctx<P> = { params: Promise<P> };

/** Wraps a route: requires a signed-in user with a role, and turns thrown errors into JSON 500s. */
export function authed<P = Record<string, never>>(
  roles: Array<"sponsor" | "family"> | "any",
  fn: (req: Request, me: Me, params: P) => Promise<Response>
) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      const me = await getMe();
      if (!me) return err("Please sign in.", 401);
      if (roles !== "any" && (!me.role || !roles.includes(me.role))) return err("Not allowed for your account type.", 403);
      return await fn(req, me, await ctx.params);
    } catch (e) {
      console.error("[api]", e);
      return err("Something went wrong on our side. Please try again.", 500);
    }
  };
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try { return (await req.json()) as T; } catch { return {} as T; }
}

export const money = (v: unknown, min: number, max: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n * 100) / 100 : null;
};
