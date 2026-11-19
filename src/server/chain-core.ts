/**
 * Stellar (Soroban) client for the CarePass contracts. Pure SDK code: no database, so scripts can use it too.
 * TESTNET today. Moving to mainnet is a configuration change (RPC URL, passphrase, keys, contract IDs).
 */
import {
  Account, Address, Asset, BASE_FEE, Contract, Keypair, Memo, Operation, TransactionBuilder, authorizeEntry, nativeToScVal, rpc, scValToNative, xdr,
} from "@stellar/stellar-sdk";

export interface ChainConfig {
  rpcUrl: string;
  passphrase: string;
  friendbotUrl: string | null;
  admin: Keypair;   // registry admin and contract deployer
  usdcIssuer: string; // who issues the USDC (Circle's test issuer by default)
  issuer: Keypair | null; // only when we issue our own test token: lets us mint instead of needing a funded sponsor
  registryId: string;
  tokenId: string;  // the USDC token contract that vaults hold
  wasmHash: Buffer; // uploaded pass-vault wasm
}

/** Circle's USDC on the Stellar test network. Override with CHAIN_USDC_ISSUER. */
export const CIRCLE_TESTNET_USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export function chainConfig(env: Record<string, string | undefined> = process.env): ChainConfig | null {
  const { CHAIN_ADMIN_SECRET: a, CHAIN_ISSUER_SECRET: i, CHAIN_REGISTRY_ID: registryId, CHAIN_PASS_WASM_HASH: w } = env;
  if (!a || !registryId || !w) return null;
  try {
    const network = env.CHAIN_NETWORK ?? "testnet";
    const passphrase = env.CHAIN_PASSPHRASE ?? (network === "testnet" ? "Test SDF Network ; September 2015" : "Public Global Stellar Network ; September 2015");
    const issuer = i ? Keypair.fromSecret(i.trim()) : null;
    // With only our own issuer configured (the older setup) that issuer is the USDC issuer; otherwise Circle's.
    const usdcIssuer = (env.CHAIN_USDC_ISSUER ?? (issuer ? issuer.publicKey() : CIRCLE_TESTNET_USDC_ISSUER)).trim();
    const tokenId = (env.CHAIN_TOKEN_ID ?? new Asset("USDC", usdcIssuer).contractId(passphrase)).trim();
    return {
      rpcUrl: env.CHAIN_RPC_URL ?? "https://soroban-testnet.stellar.org",
      passphrase,
      friendbotUrl: network === "testnet" ? (env.CHAIN_FRIENDBOT_URL ?? "https://friendbot.stellar.org") : null,
      admin: Keypair.fromSecret(a.trim()), usdcIssuer, issuer, registryId: registryId.trim(), tokenId, wasmHash: Buffer.from(w.trim(), "hex"),
    };
  } catch {
    return null;
  }
}

/** True when we issue the token ourselves and can mint into vaults directly. */
export const canMint = (cfg: ChainConfig) => !!cfg.issuer && cfg.issuer.publicKey() === cfg.usdcIssuer;

/** A failure on the network. `code` is the contract's error number when the contract refused the call. */
export class ChainError extends Error {
  constructor(message: string, public code?: number) { super(message); }
}

/** Contract error number → plain-language reason (see contracts/pass/src/lib.rs `Error`). */
export const CONTRACT_REASON: Record<number, string> = {
  1: "The amount must be more than zero.",
  2: "This pass is paused by your sponsor.",
  3: "This isn't a verified clinic, lab or pharmacy.",
  4: "This type of care isn't enabled on the pass.",
  7: "There isn't enough money on the pass.",
  8: "These spending rules aren't valid.",
  9: "That care plan doesn't exist on the network.",
  10: "That step isn't part of the plan.",
  11: "That step has already been paid or cancelled.",
  12: "Earlier steps in the plan need to be finished first.",
  13: "A care plan needs between 1 and 12 steps.",
};

const UNITS_PER_CENT = BigInt(100000); // the token has 7 decimals: 1 USD = 10^7 units
export const toUnits = (cents: number) => BigInt(cents) * UNITS_PER_CENT;
export const fromUnits = (u: bigint) => Number(u / UNITS_PER_CENT);

/** Care categories in the order the contracts use them. */
export const CATEGORY_INDEX = ["hospital", "lab", "pharmacy", "dental", "optical"];
export const allowedMask = (allowed: string[]) => allowed.reduce((m, c) => (CATEGORY_INDEX.includes(c) ? m | (1 << CATEGORY_INDEX.indexOf(c)) : m), 0);

// Transactions from one account must be sent one at a time (sequence numbers), so each account gets a queue.
const queues = new Map<string, Promise<unknown>>();
function queued<T>(accountId: string, fn: () => Promise<T>): Promise<T> {
  const next = (queues.get(accountId) ?? Promise.resolve()).catch(() => {}).then(fn);
  queues.set(accountId, next);
  return next;
}

const parseCode = (m: string) => { const x = /Error\(Contract, #(\d+)\)/.exec(m); return x ? Number(x[1]) : undefined; };

export async function submit(cfg: ChainConfig, source: Keypair, op: xdr.Operation, opts: { soroban: boolean; memo?: { type: string; value: string } }): Promise<{ hash: string; value: unknown }> {
  return queued(source.publicKey(), async () => {
    const server = new rpc.Server(cfg.rpcUrl);
    try {
      const account = await server.getAccount(source.publicKey());
      const b = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: cfg.passphrase }).addOperation(op).setTimeout(90);
      if (opts.memo) {
        const { type, value } = opts.memo;
        b.addMemo(type === "id" ? Memo.id(value) : type === "hash" ? Memo.hash(value) : Memo.text(value));
      }
      let tx = b.build();
      if (opts.soroban) tx = await server.prepareTransaction(tx);
      tx.sign(source);
      const sent = await server.sendTransaction(tx);
      if (sent.status === "ERROR") throw new ChainError("The network rejected the transaction.");
      const done = await server.pollTransaction(sent.hash, { attempts: 40, sleepStrategy: () => 1500 });
      if (done.status !== rpc.Api.GetTransactionStatus.SUCCESS) throw new ChainError("The transaction did not confirm in time.");
      return { hash: sent.hash, value: done.returnValue ? scValToNative(done.returnValue) : undefined };
    } catch (e) {
      if (e instanceof ChainError) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      throw new ChainError(msg.split("\n")[0], parseCode(msg));
    }
  });
}

const call = (id: string, method: string, ...args: xdr.ScVal[]) => new Contract(id).call(method, ...args);
const addr = (a: string) => new Address(a).toScVal();
const i128 = (n: bigint) => nativeToScVal(n, { type: "i128" });
const u32 = (n: number) => nativeToScVal(n, { type: "u32" });

/** Creates and funds a testnet account. Safe to call for an account that already exists. */
export async function fundAccount(cfg: ChainConfig, publicKey: string) {
  if (!cfg.friendbotUrl) throw new ChainError("Accounts can't be created automatically on this network.");
  const r = await fetch(`${cfg.friendbotUrl}?addr=${encodeURIComponent(publicKey)}`);
  if (!r.ok && r.status !== 400) throw new ChainError("Could not create the account on the test network.");
}

export async function deployVault(cfg: ChainConfig, p: { sponsor: string; beneficiary: string; allowed: string[] }): Promise<string> {
  const salt = Buffer.from(Keypair.random().rawPublicKey());
  const op = Operation.createCustomContract({
    address: new Address(cfg.admin.publicKey()), wasmHash: cfg.wasmHash, salt,
    constructorArgs: [addr(p.sponsor), addr(p.beneficiary), addr(cfg.tokenId), addr(cfg.registryId), u32(allowedMask(p.allowed))],
  });
  const { value } = await submit(cfg, cfg.admin, op, { soroban: true });
  if (typeof value !== "string") throw new ChainError("The vault was created but its address was not returned.");
  return value;
}

/** Lets an account hold USDC. Safe to repeat. */
export async function ensureTrustline(cfg: ChainConfig, account: Keypair) {
  return submit(cfg, account, Operation.changeTrust({ asset: new Asset("USDC", cfg.usdcIssuer) }), { soroban: false });
}

/** Puts `cents` of USDC into a vault: minted when we issue the token, otherwise sent from the sponsor's account. */
export async function fundVault(cfg: ChainConfig, vaultId: string, cents: number, sponsor: Keypair) {
  if (canMint(cfg)) return submit(cfg, cfg.issuer!, call(cfg.tokenId, "mint", addr(vaultId), i128(toUnits(cents))), { soroban: true });
  return submit(cfg, sponsor, call(cfg.tokenId, "transfer", addr(sponsor.publicKey()), addr(vaultId), i128(toUnits(cents))), { soroban: true });
}

/** USDC the sponsor's own account holds on the network, in cents. */
export async function accountUsdcCents(cfg: ChainConfig, account: string): Promise<number> {
  const server = new rpc.Server(cfg.rpcUrl);
  const tx = new TransactionBuilder(new Account(cfg.admin.publicKey(), "0"), { fee: BASE_FEE, networkPassphrase: cfg.passphrase })
    .addOperation(call(cfg.tokenId, "balance", addr(account))).setTimeout(60).build();
  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result) return 0;
  return fromUnits(scValToNative(sim.result.retval) as bigint);
}

/** Lets a clinic account receive the test USDC, then adds it to the registry of verified providers. */
export async function registerClinic(cfg: ChainConfig, clinic: Keypair, name: string, category: string) {
  await fundAccount(cfg, clinic.publicKey());
  await ensureTrustline(cfg, clinic);
  const idx = Math.max(0, CATEGORY_INDEX.indexOf(category));
  return submit(cfg, cfg.admin, call(cfg.registryId, "add_merchant", addr(clinic.publicKey()), nativeToScVal(name.slice(0, 60), { type: "string" }), u32(idx)), { soroban: true });
}

export async function payFromVault(cfg: ChainConfig, vaultId: string, beneficiary: Keypair, merchant: string, cents: number, receiptHash?: string) {
  return submit(cfg, beneficiary, call(vaultId, "pay", addr(merchant), i128(toUnits(cents))), { soroban: true, memo: receiptHash ? { type: "hash", value: receiptHash } : undefined });
}

export async function setVaultRules(cfg: ChainConfig, vaultId: string, sponsor: Keypair, p: { allowed: string[] }) {
  return submit(cfg, sponsor, call(vaultId, "set_rules", u32(allowedMask(p.allowed))), { soroban: true });
}

export async function setVaultFrozen(cfg: ChainConfig, vaultId: string, sponsor: Keypair, frozen: boolean) {
  return submit(cfg, sponsor, call(vaultId, "set_frozen", nativeToScVal(frozen, { type: "bool" })), { soroban: true });
}

/** Money in the vault, in cents. Read-only. */
export async function vaultCents(cfg: ChainConfig, vaultId: string): Promise<number> {
  const server = new rpc.Server(cfg.rpcUrl);
  const tx = new TransactionBuilder(new Account(cfg.admin.publicKey(), "0"), { fee: BASE_FEE, networkPassphrase: cfg.passphrase })
    .addOperation(call(vaultId, "balance")).setTimeout(60).build();
  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result) throw new ChainError("Could not read the vault balance.");
  return fromUnits(scValToNative(sim.result.retval) as bigint);
}

/** Sends USDC from an account to another account (used to hand a clinic's USDC to the anchor for a cash-out). */
export async function sendUsdc(cfg: ChainConfig, from: Keypair, to: string, cents: number, memo?: { type: string; value: string }) {
  const amount = (cents / 100).toFixed(2);
  return submit(cfg, from, Operation.payment({ destination: to, asset: new Asset("USDC", cfg.usdcIssuer), amount }), { soroban: false, memo });
}

// ------------------------------------------------------------------ care plans (escrow)

const symbol = (n: string) => xdr.ScVal.scvSymbol(n);
/** A StepSpec { amount, merchant } as the contract expects it (map keys in alphabetical order). */
const stepSpec = (merchant: string, cents: number) =>
  xdr.ScVal.scvMap([
    new xdr.ScMapEntry({ key: symbol("amount"), val: i128(toUnits(cents)) }),
    new xdr.ScMapEntry({ key: symbol("merchant"), val: addr(merchant) }),
  ]);

/** Sponsor opens a plan. The vault locks the money for every step. Returns the plan's number on the vault. */
export async function openPlan(cfg: ChainConfig, vaultId: string, sponsor: Keypair, steps: { merchant: string; cents: number }[]): Promise<{ planId: number; hash: string }> {
  const r = await submit(cfg, sponsor, call(vaultId, "open_plan", xdr.ScVal.scvVec(steps.map((s) => stepSpec(s.merchant, s.cents)))), { soroban: true });
  return { planId: Number(r.value as bigint), hash: r.hash };
}

export async function cancelPlan(cfg: ChainConfig, vaultId: string, sponsor: Keypair, planId: number) {
  return submit(cfg, sponsor, call(vaultId, "cancel_plan", nativeToScVal(BigInt(planId), { type: "u64" })), { soroban: true });
}

/**
 * Releases one step. The contract needs the provider's AND the patient's signature. The patient's account sends the
 * transaction (so it signs it); the provider's signature goes on its own authorization entry.
 */
export async function confirmStep(cfg: ChainConfig, vaultId: string, planId: number, index: number, patient: Keypair, provider: Keypair, receiptHash?: string) {
  return queued(patient.publicKey(), async () => {
    const server = new rpc.Server(cfg.rpcUrl);
    try {
      const args = [nativeToScVal(BigInt(planId), { type: "u64" }), u32(index)];
      const make = async (auth?: xdr.SorobanAuthorizationEntry[]) => {
        const account = await server.getAccount(patient.publicKey());
        const o = Operation.invokeContractFunction({ contract: vaultId, function: "confirm_step", args, auth });
        const b = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: cfg.passphrase }).addOperation(o).setTimeout(90);
        if (receiptHash) b.addMemo(Memo.hash(receiptHash));
        return b.build();
      };
      // 1) ask the network what needs signing
      const sim = await server.simulateTransaction(await make());
      if (!rpc.Api.isSimulationSuccess(sim)) throw new Error(("error" in sim && sim.error) || "Simulation failed");
      const validUntil = (await server.getLatestLedger()).sequence + 120;
      const signed: xdr.SorobanAuthorizationEntry[] = [];
      for (const e of sim.result?.auth ?? []) {
        const c = e.credentials;
        if ((c.type === "sorobanCredentialsAddress" || c.type === "sorobanCredentialsAddressV2") && Address.fromScAddress(c.value.address).toString() === provider.publicKey()) {
          signed.push(await authorizeEntry(e, provider, validUntil, cfg.passphrase));
        } else signed.push(e); // the patient's own authorization is covered by signing the transaction
      }
      // 2) rebuild with the provider's signature in place, let the network size the resources again, then sign and send
      let tx = await server.prepareTransaction(await make(signed));
      tx.sign(patient);
      const sent = await server.sendTransaction(tx);
      if (sent.status === "ERROR") throw new ChainError("The network rejected the transaction.");
      const done = await server.pollTransaction(sent.hash, { attempts: 40, sleepStrategy: () => 1500 });
      if (done.status !== rpc.Api.GetTransactionStatus.SUCCESS) throw new ChainError("The transaction did not confirm in time.");
      return { hash: sent.hash };
    } catch (e) {
      if (e instanceof ChainError) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      throw new ChainError(msg.split("\n")[0], parseCode(msg));
    }
  });
}

/** True when an error means the vault was deployed before care-plan escrow existed. */
export const lacksEscrow = (e: unknown) => /MissingValue|non-existent contract function|function.*not.*found|UnreachableCodeReached/i.test(e instanceof Error ? e.message : String(e));
