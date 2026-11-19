import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { authed, body, err } from "@/server/http";
import { db, schema, SPONSOR_PREVIEW } from "@/server/passes";
import { after } from "next/server";
import { chainOn, ensureClinic } from "@/server/chain";
import { newClinicCode, publicClinic } from "@/server/clinics";

export const maxDuration = 60;
import { CAT_IDS } from "@/server/passes";
import { seal } from "@/server/seal";
import { BANK_CODES } from "@/lib/banks";

const acct = (b: Record<string, unknown>) => {
  const n = String(b.accountNumber ?? "").replace(/\D/g, "");
  return n.length === 10 ? { accountLast4: n.slice(-4), accountEnc: seal(n) } : null;
};
const read = (b: Record<string, unknown>) => ({
  name: String(b.name ?? "").trim().slice(0, 80),
  type: String(b.type ?? ""),
  city: b.city === "Abuja" ? "Abuja" : b.city === "Lagos" ? "Lagos" : "",
  area: String(b.area ?? "").trim().slice(0, 60),
  bankName: String(b.bankName ?? "").trim().slice(0, 60),
  bankCode: BANK_CODES[String(b.bankName ?? "").trim()] ?? "",
  accountLast4: String(b.accountLast4 ?? "").replace(/\D/g, "").slice(-4),
});
const problem = (c: { name: string; type: string; city: string }) =>
  c.name.length < 2 ? "Enter the name of your clinic." : !CAT_IDS.includes(c.type) ? "Choose what kind of care you provide." : !c.city ? "Choose Lagos or Abuja." : null;

/** Sets up this account's clinic. In demo mode it is verified straight away; otherwise it waits for review. */
export const POST = authed(["clinic"], async (req, me) => {
  const raw = await body<Record<string, unknown>>(req);
  const c = { ...read(raw), ...acct(raw) };
  const p = problem(c); if (p) return err(p);
  const [existing] = await db.select({ id: schema.clinic.id }).from(schema.clinic).where(eq(schema.clinic.ownerId, me.id));
  if (existing) return err("Your clinic is already set up.", 409);
  const [saved] = await db.insert(schema.clinic).values({ id: newClinicCode(), ownerId: me.id, ...c, verified: SPONSOR_PREVIEW }).returning();
  if (saved.verified && chainOn()) after(async () => { try { await ensureClinic(saved.id); } catch (e) { console.error("[chain] clinic setup failed:", e instanceof Error ? e.message : e); } });
  return NextResponse.json({ clinic: publicClinic(saved) }, { status: 201 });
});

export const PATCH = authed(["clinic"], async (req, me) => {
  const raw = await body<Record<string, unknown>>(req);
  const { accountLast4, ...rest } = read(raw);
  const a = acct(raw);
  const p = problem(rest); if (p) return err(p);
  const c = { ...rest, ...(a ?? (raw.accountLast4 !== undefined ? { accountLast4 } : {})) };
  const [saved] = await db.update(schema.clinic).set(c).where(eq(schema.clinic.ownerId, me.id)).returning();
  return saved ? NextResponse.json({ clinic: publicClinic(saved) }) : err("Clinic not found.", 404);
});
