import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { authed } from "@/server/http";
import { buildCheckoutUrl, describeKeys, moonpayEnabled } from "@/server/moonpay";

/**
 * Signed-in sponsors can see whether the MoonPay keys look right (never the keys), plus two links to try:
 * a plain one with nothing to sign and the signed one the app makes. See README, "MoonPay troubleshooting".
 */
export const GET = authed(["sponsor"], async () => {
  const k = describeKeys();
  const signed = moonpayEnabled()
    ? buildCheckoutUrl({ walletAddress: "GDU2RUDNZGPPFUAVRQ7NBUWAQKEXCJ7L4GPRNQOMO67XXSDBA5GRSLJA", chargeUsd: 100, externalId: crypto.randomUUID() })
    : null;
  const plain = signed ? signed.split("&walletAddress=")[0].replace("/?", "/?") + "&baseCurrencyCode=usd&baseCurrencyAmount=100.00" : null;
  return NextResponse.json({ enabled: moonpayEnabled(), ...k, plainLink: plain, signedLink: signed });
});
