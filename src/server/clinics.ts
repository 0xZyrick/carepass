import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "./db";
import type { Merchant } from "@/lib/data";

export type ClinicRow = typeof schema.clinic.$inferSelect;

export const clinicQr = (id: string) => `carepass:clinic:${id}`;
export const newClinicCode = () => {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "CL-" + Array.from({ length: 6 }, () => A[Math.floor(Math.random() * A.length)]).join("");
};
/** Pulls a clinic code out of a scanned QR payload or typed code. */
export const parseClinicCode = (dest: string) => {
  const m = dest.trim().toUpperCase().match(/^(?:CAREPASS:CLINIC:)?(CL-[A-Z0-9]{6})$/);
  return m ? m[1] : null;
};

/** What the clinic owner may see about their own clinic. Never includes keys. */
export const publicClinic = (c: ClinicRow) => ({ id: c.id, name: c.name, type: c.type, city: c.city, area: c.area, bankName: c.bankName, accountLast4: c.accountLast4, verified: c.verified });

export function toMerchant(c: ClinicRow): Merchant {
  const h = [...c.id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 997, 7);
  return {
    id: c.id, name: c.name, area: c.area || c.city, city: (c.city === "Abuja" ? "Abuja" : "Lagos"), type: c.type as Merchant["type"],
    addr: clinicQr(c.id), short: c.id, distKm: +(0.6 + (h % 55) / 10).toFixed(1), hours: "Open now", open: true,
  };
}

export async function verifiedClinicByDest(dest: string): Promise<ClinicRow | null> {
  const code = parseClinicCode(dest);
  if (!code) return null;
  const [c] = await db.select().from(schema.clinic).where(and(eq(schema.clinic.id, code), eq(schema.clinic.verified, true)));
  return c ?? null;
}
