import "server-only";
import crypto from "node:crypto";

/** What a payment receipt says. The same fields in the same order always give the same hash. */
export interface Receipt { v: 1; ref: string; clinicId: string; clinic: string; category: string; amountCents: number; note: string; at: string }

export const canonical = (r: Receipt) =>
  JSON.stringify([r.v, r.ref, r.clinicId, r.clinic, r.category, r.amountCents, r.note, r.at]);

export const hashReceipt = (r: Receipt) => crypto.createHash("sha256").update(canonical(r)).digest("hex");
