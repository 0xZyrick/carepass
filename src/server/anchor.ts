import "server-only";
import { SigningKeypair, Wallet } from "@stellar/typescript-wallet-sdk";
import { ChainError } from "./chain-core";
import { chainOn, prepareSponsorAccount } from "./chain";

/** The anchor that turns dollars into USDC on Stellar. Stellar's own test anchor by default. */
const domain = () => process.env.CHAIN_ANCHOR_DOMAIN ?? "testanchor.stellar.org";
export const anchorEnabled = () => chainOn() && process.env.ANCHOR_FUNDING !== "off";

const wallet = () => ((process.env.CHAIN_NETWORK ?? "testnet") === "testnet" ? Wallet.TestNet() : Wallet.MainNet());
const anchor = () => wallet().anchor({ homeDomain: domain() });

type Token = Awaited<ReturnType<Awaited<ReturnType<ReturnType<typeof anchor>["sep10"]>>["authenticate"]>>;
const tokens = new Map<string, { token: Token; at: number }>();

/** Signs in to the anchor as the sponsor's account (SEP-10). Tokens are reused for a few minutes. */
async function authFor(sponsorId: string): Promise<{ token: Token; a: ReturnType<typeof anchor> }> {
  const sponsor = await prepareSponsorAccount(sponsorId);
  const a = anchor();
  const hit = tokens.get(sponsorId);
  if (hit && Date.now() - hit.at < 5 * 60_000) return { token: hit.token, a };
  const sep10 = await a.sep10();
  const token = await sep10.authenticate({ accountKp: SigningKeypair.fromSecret(sponsor.secret()) });
  tokens.set(sponsorId, { token, at: Date.now() });
  return { token, a };
}

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
