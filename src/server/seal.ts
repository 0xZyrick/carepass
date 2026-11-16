import "server-only";
import crypto from "node:crypto";

const key = () =>
  crypto.createHash("sha256").update(process.env.BETTER_AUTH_SECRET ?? "carepass-dev-only-secret-change-me-in-production").digest();

/** Encrypts a secret (AES-256-GCM) so it can be stored in the database. */
export const seal = (plain: string) => {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
};

export const unseal = (sealed: string) => {
  const [iv, tag, enc] = sealed.split(".").map((p) => Buffer.from(p, "base64"));
  const d = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
};
