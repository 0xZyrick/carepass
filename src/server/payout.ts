import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "./db";
import { uid } from "./passes";
import { ChainError, chainConfig, sendUsdc, accountUsdcCents } from "./chain-core";
import { clinicKeypair } from "./chain";
import { anchorWithdrawStatus, startAnchorWithdraw } from "./anchor";

/** USDC the clinic holds on the network, in cents. */
export async function clinicBalanceCents(clinicId: string): Promise<number> {
  const cfg = chainConfig(); if (!cfg) return 0;
  return accountUsdcCents(cfg, (await clinicKeypair(clinicId)).publicKey());
}

export async function startPayout(clinicId: string) {
  const started = await startAnchorWithdraw(clinicId);
  const id = uid();
  await db.insert(schema.payout).values({ id, clinicId, anchorTxId: started.anchorTxId });
  return { id, url: started.url };
}

const view = (p: typeof schema.payout.$inferSelect) => ({ id: p.id, status: p.status, amountUsd: p.amountCents / 100, sentTx: p.sentTx, at: p.createdAt.toISOString() });
export type PayoutView = ReturnType<typeof view>;

export async function listPayouts(clinicId: string) {
  const rows = await db.select().from(schema.payout).where(eq(schema.payout.clinicId, clinicId)).orderBy(desc(schema.payout.createdAt)).limit(10);
  return rows.map(view);
}

// One send per payout at a time, so a double poll can't pay the anchor twice.
const sending = new Set<string>();

/** Checks the anchor and, once it is waiting for the clinic's USDC, sends it exactly once. Safe to call repeatedly. */
export async function syncPayout(clinicId: string, payoutId: string) {
  const [p] = await db.select().from(schema.payout).where(and(eq(schema.payout.id, payoutId), eq(schema.payout.clinicId, clinicId)));
  if (!p) return null;
  if (p.status === "completed" || p.status === "failed") return view(p);
  const st = await anchorWithdrawStatus(clinicId, p.anchorTxId);
  if (st.state === "failed") { await db.update(schema.payout).set({ status: "failed" }).where(eq(schema.payout.id, p.id)); return view({ ...p, status: "failed" }); }
  if (st.state === "completed") { await db.update(schema.payout).set({ status: "completed" }).where(eq(schema.payout.id, p.id)); return view({ ...p, status: "completed" }); }
  if (st.state === "ready" && st.send && !p.sentTx && !sending.has(p.id)) {
    sending.add(p.id);
    try {
      const cfg = chainConfig(); if (!cfg) throw new ChainError("The network isn't configured.");
      const kp = await clinicKeypair(clinicId);
      if ((await accountUsdcCents(cfg, kp.publicKey())) < st.send.cents) {
        await db.update(schema.payout).set({ status: "failed" }).where(eq(schema.payout.id, p.id));
        return view({ ...p, status: "failed" });
      }
      const { hash } = await sendUsdc(cfg, kp, st.send.to, st.send.cents, st.send.memo);
      const [u] = await db.update(schema.payout).set({ status: "sent", sentTx: hash, amountCents: st.send.cents }).where(eq(schema.payout.id, p.id)).returning();
      return view(u);
    } finally { sending.delete(p.id); }
  }
  return view(p);
}
