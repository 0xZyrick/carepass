import "server-only";
import { SigningKeypair, Wallet } from "@stellar/typescript-wallet-sdk";
import { ChainError } from "./chain-core";
import { Keypair } from "@stellar/stellar-sdk";
import { chainOn, clinicKeypair, prepareSponsorAccount } from "./chain";

/** The anchor that turns dollars into USDC on Stellar. Stellar's own test anchor by default. */
const domain = () => process.env.CHAIN_ANCHOR_DOMAIN ?? "testanchor.stellar.org";
export const anchorEnabled = () => chainOn() && process.env.ANCHOR_FUNDING !== "off";

const wallet = () => ((process.env.CHAIN_NETWORK ?? "testnet") === "testnet" ? Wallet.TestNet() : Wallet.MainNet());
const anchor = () => wallet().anchor({ homeDomain: domain() });

type Token = Awaited<ReturnType<Awaited<ReturnType<ReturnType<typeof anchor>["sep10"]>>["authenticate"]>>;
const tokens = new Map<string, { token: Token; at: number }>();

/** Signs in to the anchor as an account (SEP-10). Tokens are reused for a few minutes. */
async function authAs(key: string, kp: () => Promise<Keypair>): Promise<{ token: Token; a: ReturnType<typeof anchor> }> {
  const a = anchor();
  const hit = tokens.get(key);
  if (hit && Date.now() - hit.at < 5 * 60_000) return { token: hit.token, a };
  const sep10 = await a.sep10();
  const token = await sep10.authenticate({ accountKp: SigningKeypair.fromSecret((await kp()).secret()) });
  tokens.set(key, { token, at: Date.now() });
  return { token, a };
}
const authFor = (sponsorId: string) => authAs(sponsorId, () => prepareSponsorAccount(sponsorId));
const authForClinic = (clinicId: string) => authAs("clinic:" + clinicId, () => clinicKeypair(clinicId));

/** Starts a hosted USDC deposit (SEP-24). The sponsor completes it in the anchor's own window. */
export async function startAnchorDeposit(sponsorId: string, amountUsd: number): Promise<{ url: string; anchorTxId: string }> {
  try {
    const { token, a } = await authFor(sponsorId);
    const sep24 = await a.sep24();
    const res = await sep24.deposit({ assetCode: "USDC", authToken: token, extraFields: { amount: amountUsd.toFixed(2) } });
    if (!res.url || !res.id) throw new ChainError("The anchor didn't return a deposit page.");
    return { url: res.url, anchorTxId: res.id };
  } catch (e) {
    throw new ChainError(e instanceof Error ? e.message.split("\n")[0] : "The anchor didn't respond.");
  }
}

export type AnchorStatus = { state: "pending" | "completed" | "failed"; status: string; cents: number; stellarTx?: string };

/** Where the deposit stands, and the amount of USDC that arrived once it is complete. */
export async function anchorDepositStatus(sponsorId: string, anchorTxId: string): Promise<AnchorStatus> {
  const { token, a } = await authFor(sponsorId);
  const tx = (await (await a.sep24()).getTransactionBy({ authToken: token, id: anchorTxId })) as { status: string; amount_out?: string; stellar_transaction_id?: string };
  const failed = ["error", "expired", "no_market", "too_small", "too_large", "refunded"];
  const state = tx.status === "completed" ? "completed" : failed.includes(tx.status) ? "failed" : "pending";
  const cents = Math.round(parseFloat(tx.amount_out ?? "0") * 100) || 0;
  return { state, status: tx.status, cents, stellarTx: tx.stellar_transaction_id };
}

export type WithdrawStatus = {
  state: "pending" | "ready" | "completed" | "failed";
  status: string;
  /** Once the clinic has chosen an amount: where to send the USDC. */
  send?: { to: string; cents: number; memo?: { type: string; value: string } };
};

/** Starts a hosted cash-out (SEP-24 withdraw). The clinic chooses the amount in the anchor's own window. */
export async function startAnchorWithdraw(clinicId: string): Promise<{ url: string; anchorTxId: string }> {
  try {
    const { token, a } = await authForClinic(clinicId);
    const res = await (await a.sep24()).withdraw({ assetCode: "USDC", authToken: token });
    if (!res.url || !res.id) throw new ChainError("The anchor didn't return a cash-out page.");
    return { url: res.url, anchorTxId: res.id };
  } catch (e) {
    throw new ChainError(e instanceof Error ? e.message.split("\n")[0] : "The anchor didn't respond.");
  }
}

/** Where a cash-out stands. "ready" means the anchor is waiting for the clinic's USDC and says where to send it. */
export async function anchorWithdrawStatus(clinicId: string, anchorTxId: string): Promise<WithdrawStatus> {
  const { token, a } = await authForClinic(clinicId);
  const tx = (await (await a.sep24()).getTransactionBy({ authToken: token, id: anchorTxId })) as {
    status: string; amount_in?: string; withdraw_anchor_account?: string; withdraw_memo?: string; withdraw_memo_type?: string;
  };
  const failed = ["error", "expired", "no_market", "too_small", "too_large", "refunded"];
  if (tx.status === "completed") return { state: "completed", status: tx.status };
  if (failed.includes(tx.status)) return { state: "failed", status: tx.status };
  const cents = Math.round(parseFloat(tx.amount_in ?? "0") * 100) || 0;
  if (tx.status === "pending_user_transfer_start" && tx.withdraw_anchor_account && cents > 0) {
    return { state: "ready", status: tx.status, send: { to: tx.withdraw_anchor_account, cents, memo: tx.withdraw_memo ? { type: tx.withdraw_memo_type ?? "text", value: tx.withdraw_memo } : undefined } };
  }
  return { state: "pending", status: tx.status };
}
