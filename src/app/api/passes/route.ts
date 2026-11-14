import { NextResponse } from "next/server";
import { authed, body, err, money } from "@/server/http";
import { CAT_IDS, HUES, db, schema, toBeneficiary, uid } from "@/server/passes";
import { eq } from "drizzle-orm";

export const POST = authed(["sponsor"], async (req, me) => {
  const b = await body<Record<string, unknown>>(req);
  const fullName = String(b.fullName ?? "").trim().slice(0, 80);
  const email = String(b.email ?? "").trim().toLowerCase();
  const relation = String(b.relation ?? "").trim().slice(0, 30);
  const city = b.city === "Abuja" ? "Abuja" : b.city === "Lagos" ? "Lagos" : null;
  const monthly = money(b.monthlyLimit, 1, 5000);
  const perTx = money(b.perTxLimit, 1, 5000);
  const allowed = Array.isArray(b.allowed) ? (b.allowed as string[]).filter((c) => CAT_IDS.includes(c)) : [];
  if (fullName.length < 2) return err("Enter the family member's full name.");
  if (!/^\S+@\S+\.\S+$/.test(email)) return err("Enter a valid email so they can sign in.");
  if (email === me.email) return err("Use your family member's email, not your own.");
  if (!city) return err("Choose Lagos or Abuja.");
  if (!monthly || !perTx || perTx > monthly) return err("Per-payment cap must be at least $1 and no more than the monthly limit.");
  if (!allowed.length) return err("Allow at least one type of care.");

  const existing = await db.select({ id: schema.pass.id }).from(schema.pass).where(eq(schema.pass.sponsorId, me.id));
  const row: typeof schema.pass.$inferInsert = {
    id: uid(), sponsorId: me.id, familyEmail: email, fullName, name: fullName.split(" ")[0], relation: relation || "Family",
    phone: String(b.phone ?? "").trim().slice(0, 30), city, hue: HUES[existing.length % HUES.length],
    last4: String(1000 + Math.floor(Math.random() * 8999)), balanceCents: 0,
    monthlyLimitCents: Math.round(monthly * 100), perTxLimitCents: Math.round(perTx * 100), allowed, frozen: false,
  };
  const [saved] = await db.insert(schema.pass).values(row).returning();
  return NextResponse.json({ beneficiary: toBeneficiary(saved) }, { status: 201 });
});
