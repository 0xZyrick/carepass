CREATE TABLE "clinic" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"city" text NOT NULL,
	"area" text DEFAULT '' NOT NULL,
	"bank_name" text DEFAULT '' NOT NULL,
	"account_last4" text DEFAULT '' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clinic_owner_id_unique" UNIQUE("owner_id")
);
--> statement-breakpoint
ALTER TABLE "ledger" ADD COLUMN "clinic_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "pin_hash" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "pin_fails" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "pin_locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "clinic" ADD CONSTRAINT "clinic_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;