import { NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { authed, body, err, money } from "@/server/http";
import { db, getOwnedPass, refCode, schema, spentLast30Days, toBeneficiary, toTx, uid } from "@/server/passes";
import { evaluatePayment, findMerchant } from "@/lib/guardrail";
import { checkPin } from "@/server/pin";
import { toMerchant, verifiedClinicByDest } from "@/server/clinics";
import { CONTRACT_REASON, ChainError, chainOn, payOnChain, prepareClinicPayment } from "@/server/chain";

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
  const spent = await spentLast30Days(id);
  const decision = evaluatePayment(toBeneficiary(row), dest, amount, spent / 100, resolve);
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
      .where(and(eq(schema.pass.id, id), eq(schema.pass.frozen, false), gte(schema.pass.balanceCents, c)))
      .returning();
    if (saved) {
      let chainTx: string | null = null;
      let refused: string | null = null;
      if (clinicAddress) {
        try { chainTx = await payOnChain(id, clinicAddress, c); }
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
          id: uid(), passId: id, kind: "payment", amountCents: c, merchantLabel: m!.name, clinicId: clinic?.id ?? null, category: m!.type, note: String(b.note ?? "").trim().slice(0, 60) || null, ref: refCode(), chainTx,
        }).returning();
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
