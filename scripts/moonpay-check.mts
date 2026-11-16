/**
 * Finds out why MoonPay's checkout rejects the link. Run: npm run moonpay:check
 * Reads .env.local, tests each key against MoonPay's API, checks the currency code, and prints two links to open.
 */
import fs from "node:fs";
import crypto from "node:crypto";
import { buildWidgetUrl, signQuery } from "../src/server/moonpay-core";

for (const l of fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8").split(/\r?\n/) : []) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim()); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const pk = process.env.MOONPAY_PUBLISHABLE_KEY ?? "", sk = process.env.MOONPAY_SECRET_KEY ?? "", cur = process.env.MOONPAY_CURRENCY_CODE ?? "xlm_testnet";
const line = (ok: boolean | null, m: string) => console.log(ok === null ? "  •" : ok ? "  ✓" : "  ✗", m);
const get = async (url: string, headers: Record<string, string> = {}) => { try { const r = await fetch(url, { headers }); let j: unknown = null; try { j = await r.json(); } catch {} return { status: r.status, json: j as any }; } catch (e) { return { status: 0, json: { error: "network unreachable: " + (e as Error).message } as any }; } };

console.log("1. Keys");
line(pk.startsWith("pk_test_"), `publishable key looks like a sandbox key (${pk ? pk.slice(0, 8) + "…" + pk.slice(-4) : "missing"})`);
line(sk.startsWith("sk_test_"), `secret key looks like a sandbox key (${sk ? sk.slice(0, 8) + "…" + sk.slice(-4) : "missing"})`);
line(!/[\s"'`]/.test(pk + sk), "no stray spaces or quotes in the keys");
if (!pk || !sk) { console.log("\nAdd MOONPAY_PUBLISHABLE_KEY and MOONPAY_SECRET_KEY to .env.local first."); process.exit(1); }

console.log("\n2. Signing code");
const vec = signQuery("?apiKey=pk_test_DocsVector00&currencyCode=eth&walletAddress=0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe", "sk_test_DocsVector00");
line(vec === "oIJxSghyzll/BLhUFdQZhkxf7DAS8REFaWr/ibO+K8Q=", "matches the example in MoonPay's documentation");

console.log("\n3. Do the keys work with MoonPay?");
const pubTest = await get(`https://api.moonpay.com/v3/currencies/${cur}?apiKey=${encodeURIComponent(pk)}`);
line(pubTest.status === 200, `publishable key + currency "${cur}": HTTP ${pubTest.status}${pubTest.status !== 200 ? ` ${JSON.stringify(pubTest.json)}` : ""}`);
const secTest = await get("https://api.moonpay.com/v1/transactions?limit=1", { Authorization: `Api-Key ${sk}` });
line(secTest.status === 200, `secret key: HTTP ${secTest.status}${secTest.status !== 200 ? ` ${JSON.stringify(secTest.json)}` : ""}`);
if (pubTest.status !== 200) {
  const all = await get(`https://api.moonpay.com/v3/currencies?apiKey=${encodeURIComponent(pk)}`);
  if (Array.isArray(all.json)) {
    const hits = all.json.filter((c: any) => /xlm|stellar|usdc/i.test(c.code + (c.metadata?.networkCode ?? ""))).map((c: any) => c.code);
    console.log("  Currency codes available to this key that mention xlm/stellar/usdc:", hits.join(", ") || "(none)");
    console.log("  Set MOONPAY_CURRENCY_CODE in .env.local to one of these.");
  }
}

console.log("\n4. Two links to open in your browser");
const wallet = "GDU2RUDNZGPPFUAVRQ7NBUWAQKEXCJ7L4GPRNQOMO67XXSDBA5GRSLJA"; // any valid Stellar address works for this test
const q = `?apiKey=${encodeURIComponent(pk)}&currencyCode=${encodeURIComponent(cur)}&baseCurrencyCode=usd&baseCurrencyAmount=100.00`;
console.log("\n  A. Plain link, nothing to sign. If THIS fails, the key or the currency code is the problem:\n  https://buy-sandbox.moonpay.com/" + q);
console.log("\n  B. Signed link, the same kind the app makes. If A works but THIS fails, the secret key doesn't belong with the publishable key:\n  " + buildWidgetUrl({ sandbox: true, publishable: pk, secret: sk, currency: cur, walletAddress: wallet, chargeUsd: 100, externalId: crypto.randomUUID() }));
