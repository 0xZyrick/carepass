import { NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { authed, body, err, money } from "@/server/http";
import { db, getOwnedPass, refCode, schema, toBeneficiary, toTx, uid } from "@/server/passes";
import { evaluatePayment, findMerchant } from "@/lib/guardrail";
import { checkPin } from "@/server/pin";
import { toMerchant, verifiedClinicByDest } from "@/server/clinics";
import { CONTRACT_REASON, ChainError, chainOn, payOnChain, prepareClinicPayment } from "@/server/chain";
import { hashReceipt, type Receipt } from "@/server/receipt";
import { lockedCents } from "@/server/locked";
import { settle, settlementMode } from "@/server/settlement";
import { after } from "next/server";

export const maxDuration = 60;

/** The guardrail runs HERE, on the server — the browser only displays the verdict. */
export const POST = authed<{ id: string }>(["family", "sponsor"], async (req, me, { id }) => {
  const row = await getOwnedPass(me, id, "family");
  if (!row) return err("Pass not found.", 404);
  const b = await body<{ dest?: unknown; amount?: unknown; note?: unknown; pin?: unknown }>(req);
  const dest = String(b.dest ?? "").trim().slice(0, 120);
  const amount = money(b.amount, 0.01, 100000);
  if (!dest) return err("Missing destination.");
  if (!amount) return err("Enter a valid amount.");
  const c = Math.round(amount * 100);

  const pin = await checkPin(me.id, b.pin);
  if (!pin.ok) return err(pin.error, pin.status);

  const clinic = await verifiedClinicByDest(dest);
  const resolve = (d: string) => (clinic ? toMerchant(clinic) : findMerchant(d));
  const locked = await lockedCents(id); // money locked for care-plan steps is not free to spend
  const view = toBeneficiary(row);
  view.balance = Math.max(0, row.balanceCents - locked) / 100;
  const decision = evaluatePayment(view, dest, amount, resolve);
  const m = decision.merchant;

  // With the network connected, payments to registered clinics go through the pass's contract.
  let clinicAddress: string | null = null;
  if (decision.approved && clinic && chainOn()) {
    try { clinicAddress = await prepareClinicPayment(id, clinic); }
    catch (e) {
      console.error("[chain] prepare failed:", e instanceof Error ? e.message : e);
      return err("We couldn't reach the payment network just now. Nothing was spent. Please try again in a moment.", 502);
    }
  }

  if (decision.approved) {
    // Atomic guard: only deducts if the pass is still unfrozen and funded (protects against double-spend races).
    const [saved] = await db
      .update(schema.pass)
      .set({ balanceCents: sql`${schema.pass.balanceCents} - ${c}`, lastActiveAt: new Date() })
      .where(and(eq(schema.pass.id, id), eq(schema.pass.frozen, false), gte(schema.pass.balanceCents, c + locked)))
      .returning();
    if (saved) {
      let chainTx: string | null = null;
      let refused: string | null = null;
      // The receipt is fixed before the payment is made, and its hash travels with the payment on the network.
      const ledgerId = uid(), ref = refCode(), at = new Date();
      const note = String(b.note ?? "").trim().slice(0, 60);
      const receipt: Receipt | null = clinic ? { v: 1, ref, clinicId: clinic.id, clinic: clinic.name, category: m!.type, amountCents: c, note, at: at.toISOString() } : null;
      const receiptHash = receipt ? hashReceipt(receipt) : null;
      if (clinicAddress) {
        try { chainTx = await payOnChain(id, clinicAddress, c, receiptHash ?? undefined); }
        catch (e) {
          // The contract said no (or the network failed): give the reserved amount back. Nothing was spent.
          await db.update(schema.pass).set({ balanceCents: sql`${schema.pass.balanceCents} + ${c}` }).where(eq(schema.pass.id, id));
          if (e instanceof ChainError && e.code && CONTRACT_REASON[e.code]) refused = CONTRACT_REASON[e.code];
          else {
            console.error("[chain] pay failed:", e instanceof Error ? e.message : e);
            return err("The payment didn't go through on the network. Nothing was spent. Please try again.", 502);
          }
        }
      }
      if (!refused) {
        const [tx] = await db.insert(schema.ledger).values({
          id: ledgerId, passId: id, kind: "payment", amountCents: c, merchantLabel: m!.name, clinicId: clinic?.id ?? null, category: m!.type, note: note || null, ref, chainTx, createdAt: at, receiptHash, receipt,
        }).returning();
        if (clinic && settlementMode() !== "off") after(async () => { try { await settle(tx.id); } catch (e) { console.error("[settle] failed:", e instanceof Error ? e.message : e); } });
        return NextResponse.json({ decision, tx: toTx(tx), beneficiary: toBeneficiary(saved) });
      }
      decision.approved = false;
      decision.headline = "Payment declined";
      decision.reason = refused;
    } else {
      decision.approved = false;
      decision.headline = "Payment declined";
      decision.reason = "The balance or pass status changed. Nothing was spent.";
    }
  }

  const failed = decision.checks.find((x) => x.status === "fail");
  const short = dest.length > 12 ? `${dest.slice(0, 4)}…${dest.slice(-4)}` : dest;
  const [tx] = await db.insert(schema.ledger).values({
    id: uid(), passId: id, kind: "blocked", amountCents: c,
    merchantLabel: m ? m.name : `Unknown address ${short}`, note: failed?.detail ?? decision.reason, ref: refCode(),
  }).returning();
  return NextResponse.json({ decision, tx: toTx(tx) });
});
