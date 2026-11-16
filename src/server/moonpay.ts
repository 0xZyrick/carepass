import "server-only";
import crypto from "node:crypto";
import { buildWidgetUrl } from "./moonpay-core";

const env = () => ({
  secret: process.env.MOONPAY_SECRET_KEY ?? "",
  publishable: process.env.MOONPAY_PUBLISHABLE_KEY ?? "",
  webhookKey: process.env.MOONPAY_WEBHOOK_KEY ?? "",
  currency: process.env.MOONPAY_CURRENCY_CODE ?? "xlm_testnet",
});

export const moonpayEnabled = () => !!(env().secret && env().publishable) && process.env.FUNDING_MODE !== "sandbox";
export const moonpayIsSandbox = () => !env().publishable.startsWith("pk_live");
export const MOONPAY_MIN_USD = 20; // MoonPay's minimum purchase

/** Builds the hosted checkout URL and signs it (see moonpay-core.ts). */
export function buildCheckoutUrl(o: { walletAddress: string; chargeUsd: number; externalId: string }) {
  const e = env();
  return buildWidgetUrl({ sandbox: moonpayIsSandbox(), publishable: e.publishable, secret: e.secret, currency: e.currency, ...o });
}

/** Safe description of the configured keys (never the keys themselves), to spot copy-paste mistakes. */
export function describeKeys() {
  const e = env();
  const shape = (k: string, prefix: string) => ({ present: !!k, prefixOk: k.startsWith(prefix), length: k.length, hasWhitespaceOrQuotes: /[\s"'`]/.test(k) });
  return {
    publishable: shape(e.publishable, "pk_"), secret: shape(e.secret, "sk_"), webhook: shape(e.webhookKey, "wk_"),
    mode: moonpayIsSandbox() ? "sandbox" : "live", currency: e.currency, forcedSandboxFunding: process.env.FUNDING_MODE === "sandbox",
    bothTest: e.publishable.startsWith("pk_test") === e.secret.startsWith("sk_test"),
  };
}

/** Verifies the `Moonpay-Signature-V2` header: `t=<timestamp>,s=<hex hmac of "<t>.<raw body>">`. */
export function verifyWebhook(header: string | null, rawBody: string, key = env().webhookKey, now = Date.now()) {
  if (!header || !key) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => { const i = p.indexOf("="); return [p.slice(0, i).trim(), p.slice(i + 1).trim()]; }));
  const t = parts.t, s = parts.s;
  if (!t || !s) return false;
  const ts = Number(t);
  if (!Number.isFinite(ts)) return false;
  const ms = ts > 1e12 ? ts : ts * 1000; // accept seconds or milliseconds
  if (Math.abs(now - ms) > 10 * 60_000) return false; // replay protection
  const expected = crypto.createHmac("sha256", key).update(`${t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(s);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export type MoonpayTx = { id: string; status: string; externalTransactionId?: string | null; baseCurrencyAmount?: number };

/** Looks a checkout up by our id. Returns null if MoonPay has no record yet or can't be reached. */
export async function fetchTransaction(externalId: string): Promise<MoonpayTx | null> {
  const e = env();
  try {
    const url = `https://api.moonpay.com/v1/transactions/ext/${encodeURIComponent(externalId)}?apiKey=${encodeURIComponent(e.publishable)}`;
    let res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (res.status === 401 || res.status === 403) {
      res = await fetch(url, { cache: "no-store", headers: { Authorization: `Api-Key ${e.secret}` }, signal: AbortSignal.timeout(8000) });
    }
    if (!res.ok) return null;
    const j = await res.json();
    const tx = Array.isArray(j) ? j[j.length - 1] : j;
    return tx && typeof tx.status === "string" ? (tx as MoonpayTx) : null;
  } catch {
    return null;
  }
}
