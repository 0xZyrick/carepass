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
  pinHash: text("pin_hash"),
  pinFails: integer("pin_fails").notNull().default(0),
  pinLockedUntil: timestamp("pin_locked_until"),
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
    monthlyLimitCents: integer("monthly_limit_cents").notNull().default(0), // retired: the care plan is the limit
    perTxLimitCents: integer("per_tx_limit_cents").notNull().default(0), // retired
    allowed: jsonb("allowed").$type<string[]>().notNull(),
    frozen: boolean("frozen").notNull().default(false),
    lastActiveAt: timestamp("last_active_at"),
    /** On-chain vault for this pass (Stellar testnet today). The beneficiary key is sealed; see server/seal.ts. */
    chainVaultId: text("chain_vault_id"),
    chainBeneficiary: text("chain_beneficiary"),
    chainBeneficiaryEnc: text("chain_beneficiary_enc"),
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
    clinicId: text("clinic_id"),
    category: text("category"),
    note: text("note"),
    method: text("method"),
    chainTx: text("chain_tx"),
    /** sha256 of the receipt, attached to the network payment so the record can be checked later */
    receiptHash: text("receipt_hash"),
    receipt: jsonb("receipt"),
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

/** A care provider that accepts CarePass. `id` is the short code printed in its QR (e.g. CL-7K2M9Q). */
export const clinic = pgTable("clinic", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // hospital | lab | pharmacy | dental | optical
  city: text("city").notNull(),
  area: text("area").notNull().default(""),
  bankName: text("bank_name").notNull().default(""),
  accountLast4: text("account_last4").notNull().default(""),
  bankCode: text("bank_code").notNull().default(""),
  codeFails: integer("code_fails").notNull().default(0), // wrong visit codes in a row
  codeLockUntil: timestamp("code_lock_until"),
  accountEnc: text("account_enc"), // full account number, sealed; used only to send Naira payouts
  verified: boolean("verified").notNull().default(false),
  chainAddress: text("chain_address"),
  chainSecretEnc: text("chain_secret_enc"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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
    /** moonpay | anchor (a Stellar anchor deposit, SEP-24) */
    provider: text("provider").notNull().default("moonpay"),
    anchorTxId: text("anchor_tx_id"),
    creditedAt: timestamp("credited_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("funding_sponsor_idx").on(t.sponsorId)]
);

/** A clinic cashing its USDC out through a Stellar anchor (SEP-24 withdraw). */
export const payout = pgTable(
  "payout",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id").notNull().references(() => clinic.id, { onDelete: "cascade" }),
    anchorTxId: text("anchor_tx_id").notNull(),
    amountCents: integer("amount_cents").notNull().default(0), // what was sent to the anchor, known once the clinic has chosen an amount
    status: text("status").notNull().default("pending"), // pending | sent | completed | failed
    sentTx: text("sent_tx"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("payout_clinic_idx").on(t.clinicId)]
);

/** Naira paid to a clinic's bank account for one payment. */
export const settlement = pgTable(
  "settlement",
  {
    id: text("id").primaryKey(),
    ledgerId: text("ledger_id").notNull().unique(),
    clinicId: text("clinic_id").notNull().references(() => clinic.id, { onDelete: "cascade" }),
    amountKobo: integer("amount_kobo").notNull(),
    rate: integer("rate").notNull(), // Naira per US dollar, locked when the payment was made
    provider: text("provider").notNull(), // mock | paystack
    status: text("status").notNull().default("pending"), // pending | paid | failed
    providerRef: text("provider_ref"),
    sweepTx: text("sweep_tx"), // the clinic's USDC moving to the settlement account
    failReason: text("fail_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    paidAt: timestamp("paid_at"),
  },
  (t) => [index("settlement_clinic_idx").on(t.clinicId)]
);

/** A care plan: a package (antenatal care, a health check-up) made into steps with chosen providers. Holds no health records. */
export const carePlan = pgTable(
  "care_plan",
  {
    id: text("id").primaryKey(),
    passId: text("pass_id").notNull().references(() => pass.id, { onDelete: "cascade" }),
    packageId: text("package_id").notNull(),
    createdBy: text("created_by").notNull(),
    /** the plan's number on the pass vault when its money is locked on the network (escrow); null when it is not */
    chainPlanId: integer("chain_plan_id"),
    status: text("status").notNull().default("active"), // active | complete | cancelled
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("care_plan_pass_idx").on(t.passId)]
);

export const careStep = pgTable(
  "care_step",
  {
    id: text("id").primaryKey(),
    planId: text("plan_id").notNull().references(() => carePlan.id, { onDelete: "cascade" }),
    idx: integer("idx").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    priceCents: integer("price_cents").notNull(),
    clinicId: text("clinic_id").notNull().references(() => clinic.id),
    status: text("status").notNull().default("pending"), // pending | done
    doneAt: timestamp("done_at"),
    ledgerId: text("ledger_id"),
  },
  (t) => [index("care_step_plan_idx").on(t.planId), index("care_step_clinic_idx").on(t.clinicId)]
);
