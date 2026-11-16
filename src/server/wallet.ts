import "server-only";
import { Keypair } from "@stellar/stellar-sdk";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import { seal, unseal } from "./seal";

/** Returns the sponsor's Stellar testnet funding address, creating it on first use. */
export async function sponsorWallet(userId: string): Promise<string> {
  const [w] = await db.select().from(schema.wallet).where(eq(schema.wallet.userId, userId));
  if (w) return w.publicKey;
  const kp = Keypair.random();
  await db.insert(schema.wallet).values({ userId, publicKey: kp.publicKey(), secretEnc: seal(kp.secret()) }).onConflictDoNothing();
  const [again] = await db.select().from(schema.wallet).where(eq(schema.wallet.userId, userId));
  return again.publicKey;
}

/** The sponsor's signing key, used to set rules and freeze their family vaults on the network. */
export async function sponsorKeypair(userId: string): Promise<Keypair> {
  await sponsorWallet(userId);
  const [w] = await db.select().from(schema.wallet).where(eq(schema.wallet.userId, userId));
  return Keypair.fromSecret(unseal(w.secretEnc));
}
