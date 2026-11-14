import "server-only";
import crypto from "node:crypto";
import { Keypair } from "@stellar/stellar-sdk";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";

const key = () =>
  crypto.createHash("sha256").update(process.env.BETTER_AUTH_SECRET ?? "carepass-dev-only-secret-change-me-in-production").digest();

const seal = (plain: string) => {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
};

/** Returns the sponsor's Stellar testnet funding address, creating it on first use. */
export async function sponsorWallet(userId: string): Promise<string> {
  const [w] = await db.select().from(schema.wallet).where(eq(schema.wallet.userId, userId));
  if (w) return w.publicKey;
  const kp = Keypair.random();
  await db.insert(schema.wallet).values({ userId, publicKey: kp.publicKey(), secretEnc: seal(kp.secret()) }).onConflictDoNothing();
  const [again] = await db.select().from(schema.wallet).where(eq(schema.wallet.userId, userId));
  return again.publicKey;
}
