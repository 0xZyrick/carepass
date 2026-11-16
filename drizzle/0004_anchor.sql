ALTER TABLE "funding" ADD COLUMN "provider" text DEFAULT 'moonpay' NOT NULL;--> statement-breakpoint
ALTER TABLE "funding" ADD COLUMN "anchor_tx_id" text;