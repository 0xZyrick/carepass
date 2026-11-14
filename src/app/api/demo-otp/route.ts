import { NextResponse } from "next/server";
import { and, eq, gte } from "drizzle-orm";
import { DEMO_OTP } from "@/server/auth";
import { db, schema } from "@/server/db";

export const dynamic = "force-dynamic";

/** Demo mode only (no email provider): returns the most recent sign-in code so reviewers can sign in with any email. */
export async function GET(req: Request) {
  if (!DEMO_OTP) return NextResponse.json({ demo: false }, { status: 404 });
  const email = (new URL(req.url).searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ demo: true, otp: null });
  const [r] = await db.select().from(schema.demoOtp)
    .where(and(eq(schema.demoOtp.email, email), gte(schema.demoOtp.createdAt, new Date(Date.now() - 5 * 60000))));
  return NextResponse.json({ demo: true, otp: r?.otp ?? null });
}
