CREATE TABLE "payout" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"anchor_tx_id" text NOT NULL,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_tx" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payout" ADD CONSTRAINT "payout_clinic_id_clinic_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payout_clinic_idx" ON "payout" USING btree ("clinic_id");