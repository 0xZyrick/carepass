import { NextResponse } from "next/server";
import { authed, body, err, money } from "@/server/http";
import { db, getOwnedPass, schema, uid } from "@/server/passes";
import { MOONPAY_MIN_USD, buildCheckoutUrl, moonpayEnabled } from "@/server/moonpay";
import { sponsorWallet } from "@/server/wallet";
import { anchorEnabled, startAnchorDeposit } from "@/server/anchor";

export const maxDuration = 60;

const FEE_RATE = 0.01, MIN_FEE = 0.5; // keep in step with src/lib/format.ts
const fee = (a: number) => (a <= 0 ? 0 : Math.max(MIN_FEE, +(a * FEE_RATE).toFixed(2)));

/** Starts a MoonPay checkout for a pass. Returns the signed widget URL. */
export const POST = authed(["sponsor"], async (req, me) => {
  const b = await body<{ passId?: string; amount?: unknown; provider?: unknown }>(req);
  if (b.provider === "anchor") {
    if (!anchorEnabled()) return err("Stellar funding isn't set up on this server.", 503);
    const apass = b.passId ? await getOwnedPass(me, b.passId, "sponsor") : null;
    if (!apass) return err("Pass not found.", 404);
    const amt = money(b.amount, 5, 1000);
    if (!amt) return err("Enter an amount between $5 and $1,000.");
    let started;
    try { started = await startAnchorDeposit(me.id, amt); }
    catch (e) { console.error("[anchor] start failed:", e instanceof Error ? e.message : e); return err("We couldn't reach the Stellar anchor just now. Please try again.", 502); }
    const aid = uid();
    await db.insert(schema.funding).values({ id: aid, passId: apass.id, sponsorId: me.id, creditCents: Math.round(amt * 100), chargeCents: Math.round(amt * 100), walletAddress: await sponsorWallet(me.id), provider: "anchor", anchorTxId: started.anchorTxId, status: "pending" });
    return NextResponse.json({ id: aid, url: started.url }, { status: 201 });
  }
  if (!moonpayEnabled()) return err("Card funding isn't configured on this server.", 503);
  const pass = b.passId ? await getOwnedPass(me, b.passId, "sponsor") : null;
  if (!pass) return err("Pass not found.", 404);
  const credit = money(b.amount, MOONPAY_MIN_USD - fee(MOONPAY_MIN_USD), 1000);
  if (!credit) return err(`Enter an amount between $${MOONPAY_MIN_USD} and $1,000.`);
  const charge = +(credit + fee(credit)).toFixed(2);
  if (charge < MOONPAY_MIN_USD) return err(`The minimum purchase is $${MOONPAY_MIN_USD}.`);

  const walletAddress = await sponsorWallet(me.id);
  const id = uid();
  await db.insert(schema.funding).values({ id, passId: pass.id, sponsorId: me.id, creditCents: Math.round(credit * 100), chargeCents: Math.round(charge * 100), walletAddress });
  return NextResponse.json({ id, url: buildCheckoutUrl({ walletAddress, chargeUsd: charge, externalId: id }) }, { status: 201 });
});
