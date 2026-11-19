CREATE TABLE "settlement" (
	"id" text PRIMARY KEY NOT NULL,
	"ledger_id" text NOT NULL,
	"clinic_id" text NOT NULL,
	"amount_kobo" integer NOT NULL,
	"rate" integer NOT NULL,
	"provider" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider_ref" text,
	"sweep_tx" text,
	"fail_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	CONSTRAINT "settlement_ledger_id_unique" UNIQUE("ledger_id")
);
--> statement-breakpoint
ALTER TABLE "clinic" ADD COLUMN "bank_code" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "clinic" ADD COLUMN "account_enc" text;--> statement-breakpoint
ALTER TABLE "ledger" ADD COLUMN "receipt_hash" text;--> statement-breakpoint
ALTER TABLE "ledger" ADD COLUMN "receipt" jsonb;--> statement-breakpoint
ALTER TABLE "settlement" ADD CONSTRAINT "settlement_clinic_id_clinic_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "settlement_clinic_idx" ON "settlement" USING btree ("clinic_id");