/** Pure MoonPay URL signing, shared by the app and by scripts/moonpay-check.mts. */
import crypto from "node:crypto";

export const signQuery = (query: string, secret: string) => crypto.createHmac("sha256", secret).update(query).digest("base64");

export function buildWidgetUrl(o: { sandbox: boolean; publishable: string; secret: string; currency: string; walletAddress: string; chargeUsd: number; externalId: string }) {
  const base = o.sandbox ? "https://buy-sandbox.moonpay.com" : "https://buy.moonpay.com";
  const params: [string, string][] = [
    ["apiKey", o.publishable], ["currencyCode", o.currency], ["walletAddress", o.walletAddress],
    ["baseCurrencyCode", "usd"], ["baseCurrencyAmount", o.chargeUsd.toFixed(2)], ["externalTransactionId", o.externalId],
  ];
  const query = "?" + params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  return `${base}/${query}&signature=${encodeURIComponent(signQuery(query, o.secret))}`;
}
