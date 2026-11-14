import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { db, schema } from "./db";

/** True when no email provider is configured: codes are shown on-screen instead of emailed. */
export const DEMO_OTP = !process.env.RESEND_API_KEY && process.env.DEMO_MODE !== "off";

function buildOtpEmailHtml(otp: string): string {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Your CarePass Verification Code</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f6f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f6f5f0;padding:40px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 4px 24px rgba(11,59,44,0.06);">

              <!-- Brand Header -->
              <tr>
                <td style="background-color:#0b3b2c;padding:28px 36px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td>
                        <span style="display:inline-block;width:10px;height:10px;background-color:#34d399;border-radius:50%;margin-right:8px;vertical-align:middle;"></span>
                        <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.4px;vertical-align:middle;">CarePass</span>
                      </td>
                      <td align="right">
                        <span style="color:#a7f3d0;font-size:12px;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;">Security</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Main Body -->
              <tr>
                <td style="padding:36px 36px 28px;">
                  <h1 style="margin:0 0 12px;color:#111827;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                    Verify your sign-in
                  </h1>
                  <p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.6;">
                    Use the one-time verification code below to access your CarePass account. This code expires in <strong style="color:#111827;">5 minutes</strong>.
                  </p>

                  <!-- OTP Code Box -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
                    <tr>
                      <td align="center" style="background-color:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:22px 16px;">
                        <span style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:#0b3b2c;display:inline-block;padding-left:10px;">
                          ${otp}
                        </span>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                    For your security, never share this code with anyone. If you did not request to sign in to CarePass, you can safely ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color:#f9fafb;padding:20px 36px;border-top:1px solid #f3f4f6;">
                  <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;text-align:center;">
                    CarePass &bull; Healthcare Payments &amp; Guardrails
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;
}

async function deliver(email: string, otp: string) {
  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "CarePass <onboarding@resend.dev>",
        to: email,
        subject: `${otp} is your CarePass sign-in code`,
        text: `Your CarePass sign-in code is ${otp}. It expires in 5 minutes.`,
        html: buildOtpEmailHtml(otp),
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

export type Me = { id: string; name: string; email: string; role: "sponsor" | "family" | null };

export async function getMe(): Promise<Me | null> {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) return null;
  const u = s.user as typeof s.user & { role?: string | null };
  return { id: u.id, name: u.name, email: u.email.toLowerCase(), role: (u.role as Me["role"]) ?? null };
}
