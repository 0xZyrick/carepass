import "server-only";
import { and, desc, eq, gte, inArray, isNull, or, sql } from "drizzle-orm";
import { db, schema } from "./db";
import type { Me } from "./auth";
import { CATEGORIES, Hue } from "@/lib/data";
import { moonpayEnabled } from "./moonpay";

const { pass, ledger, topupRequest } = schema;
export type PassRow = typeof pass.$inferSelect;
export type LedgerRow = typeof ledger.$inferSelect;

/** Demo preview: a sponsor may open the family-side screens for passes they own. Set DEMO_MODE=off to disable. */
export const SPONSOR_PREVIEW = process.env.DEMO_MODE !== "off";

export const uid = () => crypto.randomUUID();
export const refCode = () => "CP-" + (48000 + Math.floor(Math.random() * 9000));
export const cents = (dollars: number) => Math.round(dollars * 100);
export const HUES: Hue[] = ["brand", "iris", "sun", "rose"];
export const CAT_IDS = CATEGORIES.map((c) => c.id) as string[];

export const toBeneficiary = (r: PassRow) => ({
  id: r.id,
  name: r.name,
  fullName: r.fullName,
  relation: r.relation,
  phone: r.phone,
  email: r.familyEmail,
  city: r.city as "Lagos" | "Abuja",
  initials: r.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
  hue: r.hue as Hue,
  balance: r.balanceCents / 100,
  monthlyLimit: r.monthlyLimitCents / 100,
  perTxLimit: r.perTxLimitCents / 100,
  allowed: r.allowed as never,
  frozen: r.frozen,
  last4: r.last4,
  lastActiveAt: r.lastActiveAt?.toISOString() ?? null,
});

export const toTx = (r: LedgerRow) => ({
  id: r.id,
  kind: r.kind as "topup" | "payment" | "blocked",
  beneficiaryId: r.passId,
  amount: r.amountCents / 100,
  merchant: r.merchantLabel ?? undefined,
  category: (r.category ?? undefined) as never,
  note: r.note ?? undefined,
  method: r.method ?? undefined,
  ref: r.ref,
  at: r.createdAt.toISOString(),
});

/** Passes this user may see. Family users claim any pass invited to their email on first load. */
export async function passesFor(me: Me): Promise<PassRow[]> {
  if (me.role === "sponsor") {
    return db.select().from(pass).where(eq(pass.sponsorId, me.id)).orderBy(pass.createdAt);
  }
  await db
    .update(pass)
    .set({ familyUserId: me.id })
    .where(and(eq(pass.familyEmail, me.email), isNull(pass.familyUserId)));
  return db.select().from(pass).where(eq(pass.familyUserId, me.id)).orderBy(pass.createdAt);
}

export async function loadState(me: Me) {
  const rows = me.role ? await passesFor(me) : [];
  const ids = rows.map((r) => r.id);
  const [txs, reqs] = ids.length
    ? await Promise.all([
        db.select().from(ledger).where(inArray(ledger.passId, ids)).orderBy(desc(ledger.createdAt)).limit(300),
        db.select().from(topupRequest).where(inArray(topupRequest.passId, ids)).orderBy(desc(topupRequest.createdAt)),
      ])
    : [[], []];
  const sponsorIds = [...new Set(rows.map((r) => r.sponsorId))];
  const sponsors = sponsorIds.length
    ? await db.select({ id: schema.user.id, name: schema.user.name }).from(schema.user).where(inArray(schema.user.id, sponsorIds))
    : [];
  const sponsorName = new Map(sponsors.map((s) => [s.id, s.name.split(" ")[0] || "your sponsor"]));
  return {
    me,
    previewEnabled: SPONSOR_PREVIEW,
    fundingProvider: moonpayEnabled() ? ("moonpay" as const) : ("sandbox" as const),
    beneficiaries: rows.map((r) => ({ ...toBeneficiary(r), sponsorName: sponsorName.get(r.sponsorId) })),
    txs: txs.map(toTx),
    requests: reqs.map((r) => ({
      id: r.id,
      beneficiaryId: r.passId,
      amount: r.amountCents / 100,
      note: r.note,
      at: r.createdAt.toISOString(),
    })),
  };
}

export async function getOwnedPass(me: Me, id: string, as: "sponsor" | "family"): Promise<PassRow | null> {
  const [row] = await db.select().from(pass).where(eq(pass.id, id)).limit(1);
  if (!row) return null;
  if (as === "sponsor") return row.sponsorId === me.id ? row : null;
  if (row.familyUserId === me.id) return row;
  if (SPONSOR_PREVIEW && row.sponsorId === me.id) return row;
  if (me.role === "family" && row.familyUserId === null && row.familyEmail === me.email) return row;
  return null;
}

export async function spentLast30Days(passId: string): Promise<number> {
  const since = new Date(Date.now() - 30 * 86400000);
  const [r] = await db
    .select({ s: sql<number>`coalesce(sum(${ledger.amountCents}),0)::int` })
    .from(ledger)
    .where(and(eq(ledger.passId, passId), eq(ledger.kind, "payment"), gte(ledger.createdAt, since)));
  return r?.s ?? 0;
}

export { and, eq, or, db, schema };
