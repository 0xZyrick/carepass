import "server-only";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";

const MAX_FAILS = 5, LOCK_MS = 10 * 60_000;

export const validPin = (p: unknown): p is string => typeof p === "string" && /^\d{4}$/.test(p);

export function hashPin(pin: string) {
  const salt = crypto.randomBytes(16);
  return `${salt.toString("hex")}:${crypto.scryptSync(pin, salt, 32).toString("hex")}`;
}
function same(pin: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const a = crypto.scryptSync(pin, Buffer.from(salt, "hex"), 32), b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function pinState(userId: string) {
  const [u] = await db.select({ h: schema.user.pinHash }).from(schema.user).where(eq(schema.user.id, userId));
  return { hasPin: !!u?.h };
}

export async function setPin(userId: string, pin: string) {
  await db.update(schema.user).set({ pinHash: hashPin(pin), pinFails: 0, pinLockedUntil: null }).where(eq(schema.user.id, userId));
}

/** Checks a PIN with attempt limiting. */
export async function checkPin(userId: string, pin: unknown): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const [u] = await db.select().from(schema.user).where(eq(schema.user.id, userId));
  if (!u?.pinHash) return { ok: false, status: 428, error: "Create your PIN first." };
  if (u.pinLockedUntil && u.pinLockedUntil > new Date()) {
    const mins = Math.ceil((u.pinLockedUntil.getTime() - Date.now()) / 60000);
    return { ok: false, status: 429, error: `Too many wrong PINs. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` };
  }
  if (!validPin(pin) || !same(pin, u.pinHash)) {
    const fails = u.pinFails + 1;
    const lock = fails >= MAX_FAILS;
    await db.update(schema.user).set({ pinFails: lock ? 0 : fails, pinLockedUntil: lock ? new Date(Date.now() + LOCK_MS) : null }).where(eq(schema.user.id, userId));
    return { ok: false, status: 403, error: lock ? "Too many wrong PINs. Try again in 10 minutes." : `Wrong PIN. ${MAX_FAILS - fails} ${MAX_FAILS - fails === 1 ? "try" : "tries"} left.` };
  }
  if (u.pinFails) await db.update(schema.user).set({ pinFails: 0 }).where(eq(schema.user.id, userId));
  return { ok: true };
}
