import "server-only";
import { Keypair } from "@stellar/stellar-sdk";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import { seal, unseal } from "./seal";
import { sponsorKeypair } from "./wallet";
import {
  ChainConfig, ChainError, CONTRACT_REASON, chainConfig, deployVault, ensureTrustline, fundAccount, fundVault, payFromVault, registerClinic,
  setVaultFrozen, setVaultRules, vaultCents,
} from "./chain-core";

export { ChainError, CONTRACT_REASON };
type PassRow = typeof schema.pass.$inferSelect;
type ClinicRow = typeof schema.clinic.$inferSelect;

/** True when the network connection is configured. Without it the app keeps its own books only. */
export const chainOn = () => chainConfig() !== null;
const cfgOrThrow = (): ChainConfig => { const c = chainConfig(); if (!c) throw new ChainError("The network isn't configured."); return c; };

// One setup at a time per pass or clinic, so two requests can't create two vaults.
const inflight = new Map<string, Promise<unknown>>();
function once<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const running = inflight.get(key) as Promise<T> | undefined;
  if (running) return running;
  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

const passRow = async (id: string) => { const [p] = await db.select().from(schema.pass).where(eq(schema.pass.id, id)); return p as PassRow | undefined; };

/** The pass's vault on the network. Created the first time it is needed. */
export function ensureVault(passId: string): Promise<string> {
  return once(`vault:${passId}`, async () => {
    const cfg = cfgOrThrow();
    let p = await passRow(passId);
    if (!p) throw new ChainError("Pass not found.");
    if (p.chainVaultId) return p.chainVaultId;

    let beneficiary: Keypair;
    if (p.chainBeneficiary && p.chainBeneficiaryEnc) beneficiary = Keypair.fromSecret(unseal(p.chainBeneficiaryEnc));
    else {
      beneficiary = Keypair.random();
      await db.update(schema.pass).set({ chainBeneficiary: beneficiary.publicKey(), chainBeneficiaryEnc: seal(beneficiary.secret()) }).where(eq(schema.pass.id, passId));
    }
    const sponsor = await sponsorKeypair(p.sponsorId);
    await Promise.all([fundAccount(cfg, sponsor.publicKey()), fundAccount(cfg, beneficiary.publicKey())]);
    await ensureTrustline(cfg, sponsor);
    p = (await passRow(passId))!;
    if (p.chainVaultId) return p.chainVaultId;
    const vaultId = await deployVault(cfg, {
      sponsor: sponsor.publicKey(), beneficiary: beneficiary.publicKey(),
      monthlyCents: p.monthlyLimitCents, perTxCents: p.perTxLimitCents, allowed: p.allowed as string[],
    });
    await db.update(schema.pass).set({ chainVaultId: vaultId }).where(eq(schema.pass.id, passId));
    if (p.frozen) await setVaultFrozen(cfg, vaultId, sponsor, true).catch(() => {});
    return vaultId;
  });
}

/** Makes the vault hold what the pass shows: any money added since the last check is moved in from the sponsor's account. */
export async function reconcileVault(passId: string): Promise<{ hash?: string }> {
  const cfg = cfgOrThrow();
  const vaultId = await ensureVault(passId);
  const p = (await passRow(passId))!;
  const onChain = await vaultCents(cfg, vaultId);
  const missing = p.balanceCents - onChain;
  if (missing <= 0) return {};
  const sponsor = await sponsorKeypair(p.sponsorId);
  const { hash } = await fundVault(cfg, vaultId, missing, sponsor);
  return { hash };
}

/** After a top-up: deposit it and stamp the ledger entry with its network receipt. Never throws; the next payment retries. */
export async function depositFor(passId: string, ledgerId?: string) {
  if (!chainOn()) return;
  try {
    const { hash } = await reconcileVault(passId);
    if (hash && ledgerId) await db.update(schema.ledger).set({ chainTx: hash }).where(eq(schema.ledger.id, ledgerId));
  } catch (e) {
    console.error("[chain] deposit failed, will retry on next payment:", e instanceof Error ? e.message : e);
  }
}

/** The clinic's address on the network, registering it as a verified provider the first time. */
export function ensureClinic(clinicId: string): Promise<string> {
  return once(`clinic:${clinicId}`, async () => {
    const cfg = cfgOrThrow();
    const [c] = await db.select().from(schema.clinic).where(eq(schema.clinic.id, clinicId));
    if (!c) throw new ChainError("Clinic not found.");
    if (c.chainAddress) return c.chainAddress;
    const kp = Keypair.random();
    await db.update(schema.clinic).set({ chainSecretEnc: seal(kp.secret()) }).where(eq(schema.clinic.id, clinicId));
    await registerClinic(cfg, kp, c.name, c.type);
    await db.update(schema.clinic).set({ chainAddress: kp.publicKey() }).where(eq(schema.clinic.id, clinicId));
    return kp.publicKey();
  });
}

/** Makes sure both ends exist on the network before a payment is attempted. */
export async function prepareClinicPayment(passId: string, clinic: ClinicRow) {
  const [address] = await Promise.all([ensureClinic(clinic.id)]);
  await reconcileVault(passId);
  return address;
}

/** Sends the payment through the pass's contract. The contract decides; a refusal comes back as ChainError.code. */
export async function payOnChain(passId: string, clinicAddress: string, cents: number): Promise<string> {
  const cfg = cfgOrThrow();
  const p = (await passRow(passId))!;
  if (!p.chainVaultId || !p.chainBeneficiaryEnc) throw new ChainError("This pass has no vault yet.");
  const { hash } = await payFromVault(cfg, p.chainVaultId, Keypair.fromSecret(unseal(p.chainBeneficiaryEnc)), clinicAddress, cents);
  return hash;
}

/** Keeps the contract's rules and pause switch in line with what the sponsor set. Never throws. */
export async function syncRules(passId: string) {
  if (!chainOn()) return;
  try {
    const cfg = cfgOrThrow();
    const p = await passRow(passId);
    if (!p?.chainVaultId) return;
    const sponsor = await sponsorKeypair(p.sponsorId);
    await setVaultRules(cfg, p.chainVaultId, sponsor, { monthlyCents: p.monthlyLimitCents, perTxCents: p.perTxLimitCents, allowed: p.allowed as string[] });
    await setVaultFrozen(cfg, p.chainVaultId, sponsor, p.frozen);
  } catch (e) {
    console.error("[chain] rules sync failed:", e instanceof Error ? e.message : e);
  }
}

/** Makes the sponsor's own account ready to receive USDC (created, funded on testnet, and able to hold USDC). */
export async function prepareSponsorAccount(sponsorId: string): Promise<Keypair> {
  const cfg = cfgOrThrow();
  const sponsor = await sponsorKeypair(sponsorId);
  await fundAccount(cfg, sponsor.publicKey());
  await ensureTrustline(cfg, sponsor);
  return sponsor;
}
