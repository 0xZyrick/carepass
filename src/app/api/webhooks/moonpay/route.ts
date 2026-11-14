import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { applyStatus } from "@/server/funding";
import { verifyWebhook } from "@/server/moonpay";

/** MoonPay → CarePass. Register `https://<your-domain>/api/webhooks/moonpay` in the MoonPay dashboard. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(req.headers.get("moonpay-signature-v2"), raw)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }
  try {
    const evt = JSON.parse(raw) as { type?: string; data?: { id?: string; status?: string; externalTransactionId?: string } };
    const d = evt.data;
    if (d?.externalTransactionId && d.status && d.id) {
      const [f] = await db.select({ id: schema.funding.id }).from(schema.funding).where(eq(schema.funding.id, d.externalTransactionId));
      if (f) await applyStatus(f.id, { id: d.id, status: d.status });
    }
  } catch (e) {
    console.error("[moonpay webhook]", e);
    return NextResponse.json({ error: "Could not process" }, { status: 500 }); // MoonPay retries
  }
  return NextResponse.json({ ok: true });
}
