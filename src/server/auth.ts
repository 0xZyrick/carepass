import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { db, schema } from "./db";
import { otpEmail } from "./email";

/** True when no email provider is configured: codes are shown on-screen instead of emailed. */
export const DEMO_OTP = !process.env.RESEND_API_KEY && process.env.DEMO_MODE !== "off";

async function deliver(email: string, otp: string) {
  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "CarePass <onboarding@resend.dev>",
        to: email,
        ...otpEmail(otp, email),
      }),
    });
    if (!res.ok) throw new Error(`Email provider rejected the message (${res.status})`);
    return;
  }
  await db
    .insert(schema.demoOtp)
    .values({ email, otp })
    .onConflictDoUpdate({ target: schema.demoOtp.email, set: { otp, createdAt: new Date() } });
  console.log(`[carepass] demo sign-in code for ${email}: ${otp}`);
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  secret: process.env.BETTER_AUTH_SECRET ?? "carepass-dev-only-secret-change-me-in-production",
  baseURL: process.env.BETTER_AUTH_URL,
  user: { additionalFields: { role: { type: "string", required: false, input: false } } },
  session: { expiresIn: 60 * 60 * 24 * 14 },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 5,
      async sendVerificationOTP({ email, otp }) {
        await deliver(email.toLowerCase(), otp);
      },
    }),
    nextCookies(), // keep last
  ],
});

export type Me = { id: string; name: string; email: string; role: "sponsor" | "family" | "clinic" | null };

export async function getMe(): Promise<Me | null> {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) return null;
  const u = s.user as typeof s.user & { role?: string | null };
  return { id: u.id, name: u.name, email: u.email.toLowerCase(), role: (u.role as Me["role"]) ?? null };
}
