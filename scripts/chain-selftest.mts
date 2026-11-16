/**
 * End-to-end check of the network connection, using throwaway accounts. Run: npm run chain:test
 * Creates a vault, registers a clinic, funds the vault, then makes one allowed and several refused payments.
 */
import { Keypair } from "@stellar/stellar-sdk";
import {
  CONTRACT_REASON, ChainError, chainConfig, deployVault, fundAccount, payFromVault, registerClinic, fundVault, vaultCents, canMint,
} from "../src/server/chain-core";
import fs from "node:fs";

for (const l of fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8").split("\n") : []) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim()); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const cfg = chainConfig();
if (!cfg) { console.error("Chain variables are missing. Run contracts/scripts/chain-env.sh and paste the output into .env.local."); process.exit(1); }

let failed = 0;
const ok = (c: boolean, m: string) => { console.log(c ? "  ✓" : "  ✗ FAIL:", m); if (!c) failed++; };
const t0 = Date.now(); const step = (m: string) => console.log(`\n▸ ${m} (${Math.round((Date.now() - t0) / 1000)}s)`);

const sponsor = Keypair.random(), family = Keypair.random(), clinic = Keypair.random(), stranger = Keypair.random();
step("Creating test accounts"); await Promise.all([sponsor, family].map((k) => fundAccount(cfg, k.publicKey()))); ok(true, "sponsor and family accounts funded");
step("Registering a clinic as a verified provider"); await registerClinic(cfg, clinic, "Selftest Clinic", "hospital"); ok(true, "clinic registered");
step("Creating the vault ($300/month, $150 per payment, hospital + pharmacy)");
const vault = await deployVault(cfg, { sponsor: sponsor.publicKey(), beneficiary: family.publicKey(), monthlyCents: 30000, perTxCents: 15000, allowed: ["hospital", "pharmacy"] });
ok(vault.startsWith("C"), `vault ${vault}`);
step("Depositing $100"); if (!canMint(cfg)) { console.log("  Real USDC mode (no issuer secret): skipping the funded-payment checks. Fund a vault through the app's Stellar USDC option instead."); process.exit(0); }
await fundVault(cfg, vault, 10000, sponsor); ok((await vaultCents(cfg, vault)) === 10000, "vault holds $100");
step("Paying the clinic $40"); const pay = await payFromVault(cfg, vault, family, clinic.publicKey(), 4000); ok(!!pay.hash, `paid, receipt ${pay.hash}`); ok((await vaultCents(cfg, vault)) === 6000, "vault now holds $60");

const expectRefusal = async (label: string, fn: () => Promise<unknown>, code: number) => {
  try { await fn(); ok(false, `${label}: should have been refused`); }
  catch (e) { ok(e instanceof ChainError && e.code === code, `${label}: refused (${e instanceof ChainError ? `#${e.code} ${CONTRACT_REASON[e.code ?? 0] ?? e.message}` : e})`); }
};
step("Trying payments that must be refused");
await expectRefusal("random account", () => payFromVault(cfg, vault, family, stranger.publicKey(), 1000), 3);
await expectRefusal("over the per-payment cap", () => payFromVault(cfg, vault, family, clinic.publicKey(), 20000), 5);
await expectRefusal("more than the vault holds", () => payFromVault(cfg, vault, family, clinic.publicKey(), 9000), 7);

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed. The app can run payments through your contracts.");
process.exit(failed ? 1 : 0);
