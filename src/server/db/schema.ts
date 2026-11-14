import { boolean, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/* ───────── Better Auth tables (names/columns follow its core schema) ───────── */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  /** "sponsor" | "family" — set once, right after first sign-in. */
  role: text("role"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_idx").on(t.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)]
);

/* ───────── CarePass tables. Money is always integer cents. ───────── */

export const pass = pgTable(
  "pass",
  {
    id: text("id").primaryKey(),
    sponsorId: text("sponsor_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    /** The family member signs in with this email; claimed on first sign-in. */
    familyEmail: text("family_email").notNull(),
    familyUserId: text("family_user_id").references(() => user.id, { onDelete: "set null" }),
    fullName: text("full_name").notNull(),
    name: text("name").notNull(),
    relation: text("relation").notNull(),
    phone: text("phone").notNull().default(""),
    city: text("city").notNull(),
    hue: text("hue").notNull(),
    last4: text("last4").notNull(),
    balanceCents: integer("balance_cents").notNull().default(0),
    monthlyLimitCents: integer("monthly_limit_cents").notNull(),
    perTxLimitCents: integer("per_tx_limit_cents").notNull(),
    allowed: jsonb("allowed").$type<string[]>().notNull(),
    frozen: boolean("frozen").notNull().default(false),
    lastActiveAt: timestamp("last_active_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("pass_sponsor_idx").on(t.sponsorId), index("pass_family_email_idx").on(t.familyEmail)]
);

export const ledger = pgTable(
  "ledger",
  {
    id: text("id").primaryKey(),
    passId: text("pass_id").notNull().references(() => pass.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // topup | payment | blocked
    amountCents: integer("amount_cents").notNull(),
    merchantLabel: text("merchant_label"),
    category: text("category"),
    note: text("note"),
    method: text("method"),
    ref: text("ref").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("ledger_pass_idx").on(t.passId, t.createdAt)]
);

export const topupRequest = pgTable(
  "topup_request",
  {
    id: text("id").primaryKey(),
    passId: text("pass_id").notNull().references(() => pass.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("request_pass_idx").on(t.passId)]
);

/** Demo-only: holds the latest sign-in code when no email provider is configured. */
export const demoOtp = pgTable("demo_otp", {
  email: text("email").primaryKey(),
  otp: text("otp").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** A sponsor's Stellar testnet funding wallet: where MoonPay delivers purchased crypto.
 *  Demo wallet: the secret is encrypted at rest. In production the sponsor brings their own wallet. */
export const wallet = pgTable("wallet", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  publicKey: text("public_key").notNull(),
  secretEnc: text("secret_enc").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** One MoonPay checkout. `id` doubles as MoonPay's externalTransactionId. */
export const funding = pgTable(
  "funding",
  {
    id: text("id").primaryKey(),
    passId: text("pass_id").notNull().references(() => pass.id, { onDelete: "cascade" }),
    sponsorId: text("sponsor_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    creditCents: integer("credit_cents").notNull(), // added to the pass
    chargeCents: integer("charge_cents").notNull(), // what the sponsor pays (credit + fee)
    walletAddress: text("wallet_address").notNull(),
    status: text("status").notNull().default("created"), // created | pending | completed | failed
    moonpayId: text("moonpay_id"),
    creditedAt: timestamp("credited_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("funding_sponsor_idx").on(t.sponsorId)]
);
