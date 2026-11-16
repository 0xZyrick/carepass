ALTER TABLE "clinic" ADD COLUMN "chain_address" text;--> statement-breakpoint
ALTER TABLE "clinic" ADD COLUMN "chain_secret_enc" text;--> statement-breakpoint
ALTER TABLE "ledger" ADD COLUMN "chain_tx" text;--> statement-breakpoint
ALTER TABLE "pass" ADD COLUMN "chain_vault_id" text;--> statement-breakpoint
ALTER TABLE "pass" ADD COLUMN "chain_beneficiary" text;--> statement-breakpoint
ALTER TABLE "pass" ADD COLUMN "chain_beneficiary_enc" text;