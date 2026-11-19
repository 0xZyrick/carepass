import "server-only";
import { and, eq, inArray, lt } from "drizzle-orm";
import { db, schema } from "./db";
import { unseal } from "./seal";
import crypto from "node:crypto";
import { FX_RATE } from "@/lib/format";
import { ChainError, chainConfig, ensureTrustline, sendUsdc } from "./chain-core";
import { chainOn, clinicKeypair } from "./chain";

/**
 * Naira settlement: when a family pays a clinic, the clinic's USDC moves to the settlement account on the network and the
 * clinic is paid the locked Naira amount in its bank account. The clinic never has to handle crypto.
 *   mock     simulates the bank transfer (test networks and demos)
 *   paystack sends a real Naira transfer through Paystack (use test keys until the business is set up)
 */
export type Mode = "off" | "mock" | "paystack";
export const settlementMode = (): Mode => {
  const m = process.env.SETTLEMENT_MODE;
  if (m === "off") return "off";
  if (m === "paystack") return process.env.PAYSTACK_SECRET_KEY ? "paystack" : "off";
  if (m === "mock") return "mock";
  return chainOn() ? "mock" : "off";
};

const reference = (ledgerId: string) => "cp" + ledgerId.replace(/-/g, "").toLowerCase();
const PS = "https://api.paystack.co";
async function paystack<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const r = await fetch(PS + path, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const j = (await r.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!r.ok || j.status === false) throw new Error(j.message ?? `Paystack returned ${r.status}`);
  return j.data as T;
}
type Outcome = { status: "paid" | "pending" | "failed"; ref: string; reason?: string };

async function transfer(mode: Mode, row: typeof schema.settlement.$inferSelect, clinic: typeof schema.clinic.$inferSelect, label: string): Promise<Outcome> {
  if (mode === "mock") return { status: "paid", ref: row.providerRef ?? "NIP" + Date.now().toString().slice(-9) + Math.floor(Math.random() * 900 + 100) };
  const code = reference(row.ledgerId);
  if (row.providerRef) { // already sent: just ask how it went
    const v = await paystack<{ status: string }>(`/transfer/verify/${code}`);
    return map(v.status, row.providerRef);
  }
  if (!clinic.accountEnc || !clinic.bankCode) return { status: "failed", ref: "", reason: "The clinic hasn't added its bank account number yet." };
  const rec = await paystack<{ recipient_code: string }>("/transferrecipient", { method: "POST", body: { type: "nuban", name: clinic.name, account_number: unseal(clinic.accountEnc), bank_code: clinic.bankCode, currency: "NGN" } });
  const t = await paystack<{ status: string; transfer_code: string }>("/transfer", { method: "POST", body: { source: "balance", amount: row.amountKobo, recipient: rec.recipient_code, reason: label, reference: code } });
  return map(t.status, t.transfer_code);
}
function map(status: string, ref: string): Outcome {
  if (status === "success") return { status: "paid", ref };
  if (["pending", "received", "processing", "queued"].includes(status)) return { status: "pending", ref };
  if (status === "otp") return { status: "failed", ref, reason: "The payment provider is asking for a transfer code. Turn off transfer OTP in the provider dashboard." };
  return { status: "failed", ref, reason: "The bank transfer was not completed." };
}

const running = new Set<string>();

/** Pays the clinic for one payment. Safe to call again: the USDC moves once and the transfer is sent once. */
export async function settle(ledgerId: string) {
  const mode = settlementMode();
  if (mode === "off" || running.has(ledgerId)) return null;
  running.add(ledgerId);
  try {
    const [l] = await db.select().from(schema.ledger).where(and(eq(schema.ledger.id, ledgerId), eq(schema.ledger.kind, "payment")));
    if (!l?.clinicId) return null;
    const [clinic] = await db.select().from(schema.clinic).where(eq(schema.clinic.id, l.clinicId));
    if (!clinic) return null;

    await db.insert(schema.settlement).values({ id: crypto.randomUUID(), ledgerId, clinicId: clinic.id, amountKobo: l.amountCents * FX_RATE, rate: FX_RATE, provider: mode }).onConflictDoNothing();
    const [s] = await db.select().from(schema.settlement).where(eq(schema.settlement.ledgerId, ledgerId));
    if (s.status === "paid") return s;

    let sweepTx = s.sweepTx;
    try {
      const cfg = chainConfig();
      if (cfg && l.chainTx && !sweepTx) { // the clinic's USDC moves to the settlement account first
        await ensureTrustline(cfg, cfg.admin);
        sweepTx = (await sendUsdc(cfg, await clinicKeypair(clinic.id), cfg.admin.publicKey(), l.amountCents, { type: "text", value: ("cp:" + l.ref).slice(0, 28) })).hash;
        await db.update(schema.settlement).set({ sweepTx }).where(eq(schema.settlement.id, s.id));
      }
      const out = await transfer(mode, { ...s, sweepTx }, clinic, `CarePass ${l.ref}`);
      const done = out.status === "paid";
      const [u] = await db.update(schema.settlement).set({ status: out.status, providerRef: out.ref || null, failReason: out.reason ?? null, paidAt: done ? new Date() : null }).where(eq(schema.settlement.id, s.id)).returning();
      return u;
    } catch (e) {
      const reason = e instanceof ChainError || e instanceof Error ? e.message.split("\n")[0].slice(0, 160) : "Settlement failed.";
      console.error("[settle]", reason);
      const [u] = await db.update(schema.settlement).set({ status: "failed", failReason: reason }).where(eq(schema.settlement.id, s.id)).returning();
      return u;
    }
  } finally { running.delete(ledgerId); }
}

/** Re-checks settlements that are still pending after a minute (for example a bank transfer in progress). */
export async function retryStale(clinicId: string) {
  if (settlementMode() === "off") return;
  const stale = await db.select({ l: schema.settlement.ledgerId }).from(schema.settlement)
    .where(and(eq(schema.settlement.clinicId, clinicId), eq(schema.settlement.status, "pending"), lt(schema.settlement.createdAt, new Date(Date.now() - 60_000))));
  for (const { l } of stale) await settle(l);
}

export const settlementsFor = async (ledgerIds: string[]) => {
  if (!ledgerIds.length) return new Map<string, typeof schema.settlement.$inferSelect>();
  const rows = await db.select().from(schema.settlement).where(inArray(schema.settlement.ledgerId, ledgerIds));
  return new Map(rows.map((r) => [r.ledgerId, r]));
};
