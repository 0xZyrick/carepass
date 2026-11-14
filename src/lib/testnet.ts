/**
 * Stellar testnet client for the CarePass Soroban contracts.
 *
 * Everything here is TESTNET ONLY. The family key in `public/testnet.json` is a throwaway demo key —
 * never put a real key there. If `public/testnet.json` is absent the app simply runs in simulated mode.
 */
import { Account, Address, Contract, Keypair, TransactionBuilder, nativeToScVal, rpc, scValToNative, BASE_FEE } from "@stellar/stellar-sdk";

export interface TestnetMerchant { name: string; category: number; address: string }
export interface TestnetConfig {
  rpcUrl: string;
  passphrase: string;
  passId: string;
  registryId: string;
  tokenId: string;
  decimals: number;
  /** any funded testnet account; only used as the source of read-only simulations */
  sourcePublic: string;
  /** throwaway testnet key of the demo family member (signs `pay`) */
  familySecret: string;
  merchants: TestnetMerchant[];
}

export async function loadTestnetConfig(): Promise<TestnetConfig | null> {
  if (!process.env.NEXT_PUBLIC_HAS_TESTNET) return null; // set in next.config.ts when public/testnet.json exists
  try {
    const r = await fetch("/testnet.json", { cache: "no-store" });
    if (!r.ok) return null;
    const c = (await r.json()) as TestnetConfig;
    return c.passId && c.rpcUrl && c.merchants?.length ? c : null;
  } catch {
    return null;
  }
}

export const explorerTx = (hash: string) => `https://stellar.expert/explorer/testnet/tx/${hash}`;
export const explorerContract = (id: string) => `https://stellar.expert/explorer/testnet/contract/${id}`;
export const shortId = (s: string) => `${s.slice(0, 4)}…${s.slice(-4)}`;

export const toUnits = (usd: number, decimals: number) => BigInt(Math.round(usd * 10 ** decimals));

/** Order in which the contract applies its rules. Index = position in the checklist. */
export const RULES = [
  { id: "pass", label: "Pass is active" },
  { id: "format", label: "Destination is valid" },
  { id: "whitelist", label: "Verified merchant" },
  { id: "category", label: "Care type allowed" },
  { id: "cap", label: "Within payment cap" },
  { id: "monthly", label: "Within monthly limit" },
  { id: "balance", label: "Enough care credit" },
] as const;

/** Contract error number → index of the rule that failed (see contracts/pass/src/lib.rs `Error`). */
const CODE_TO_RULE: Record<number, number> = { 2: 0, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6 };
const CODE_TEXT: Record<number, string> = {
  1: "Amount must be greater than zero",
  2: "The sponsor has frozen this pass",
  3: "Destination is not a verified care provider",
  4: "This care type isn't enabled on the pass",
  5: "Exceeds the per-payment cap",
  6: "Would exceed the monthly limit",
  7: "Not enough care credit in the vault",
  8: "Invalid rules",
};

export type ChainCheck = { id: string; label: string; status: "pass" | "fail" | "skipped"; detail: string };
export interface ChainResult { approved: boolean; code?: number; error?: string; checks: ChainCheck[] }

/** Extract N from a Soroban error string such as "HostError: Error(Contract, #3)". */
export function parseContractCode(message: string): number | undefined {
  const m = /Error\(Contract, #(\d+)\)/.exec(message);
  return m ? Number(m[1]) : undefined;
}

export function buildChecks(failedRule: number | null, code?: number): ChainCheck[] {
  return RULES.map((r, i) =>
    failedRule === null
      ? { id: r.id, label: r.label, status: "pass", detail: "Checked by the contract" }
      : i < failedRule
        ? { id: r.id, label: r.label, status: "pass", detail: "Checked by the contract" }
        : i === failedRule
          ? { id: r.id, label: r.label, status: "fail", detail: CODE_TEXT[code ?? 0] ?? "Rejected by the contract" }
          : { id: r.id, label: r.label, status: "skipped", detail: "Not reached" }
  );
}

function callTx(cfg: TestnetConfig, source: Account, method: string, args: ReturnType<typeof nativeToScVal>[]) {
  return new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: cfg.passphrase })
    .addOperation(new Contract(cfg.passId).call(method, ...args))
    .setTimeout(60)
    .build();
}

/** Dry-run `check_payment` on the deployed contract (read-only — no signature, no fee). */
export async function checkOnChain(cfg: TestnetConfig, merchant: string, usd: number): Promise<ChainResult> {
  let addr;
  try {
    addr = new Address(merchant.trim()).toScVal();
  } catch {
    return { approved: false, error: "That isn't a valid Stellar address", checks: buildChecks(1) };
  }
  const tx = callTx(cfg, new Account(cfg.sourcePublic, "0"), "check_payment", [addr, nativeToScVal(toUnits(usd, cfg.decimals), { type: "i128" })]);
  const res = await fetch(cfg.rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "simulateTransaction", params: { transaction: tx.toXDR() } }),
  });
  const body = await res.json();
  if (body.error) throw new Error(body.error.message ?? "RPC error");
  const err: string | undefined = body.result?.error;
  if (!err) return { approved: true, checks: buildChecks(null) };
  const code = parseContractCode(err);
  if (code === undefined) throw new Error(err.split("\n")[0]);
  const rule = CODE_TO_RULE[code];
  return { approved: false, code, error: CODE_TEXT[code], checks: buildChecks(rule ?? 1, code) };
}

/** Read the pass vault's USDC balance from the chain, in whole dollars. */
export async function vaultBalance(cfg: TestnetConfig): Promise<number> {
  const server = new rpc.Server(cfg.rpcUrl);
  const sim = await server.simulateTransaction(callTx(cfg, new Account(cfg.sourcePublic, "0"), "balance", []));
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result) throw new Error("Could not read balance");
  return Number(scValToNative(sim.result.retval) as bigint) / 10 ** cfg.decimals;
}

/** Sign and submit a real `pay` transaction on testnet as the demo family member. */
export async function settleOnChain(cfg: TestnetConfig, merchant: string, usd: number): Promise<{ hash: string }> {
  const server = new rpc.Server(cfg.rpcUrl);
  const kp = Keypair.fromSecret(cfg.familySecret);
  const account = await server.getAccount(kp.publicKey());
  const tx = callTx(cfg, account, "pay", [new Address(merchant).toScVal(), nativeToScVal(toUnits(usd, cfg.decimals), { type: "i128" })]);
  const prepared = await server.prepareTransaction(tx);
  prepared.sign(kp);
  const sent = await server.sendTransaction(prepared);
  if (sent.status === "ERROR") throw new Error("The network rejected the transaction");
  const done = await server.pollTransaction(sent.hash, { attempts: 20 });
  if (done.status !== rpc.Api.GetTransactionStatus.SUCCESS) throw new Error("The payment did not confirm");
  return { hash: sent.hash };
}
