CREATE TABLE "funding" (
	"id" text PRIMARY KEY NOT NULL,
	"pass_id" text NOT NULL,
	"sponsor_id" text NOT NULL,
	"credit_cents" integer NOT NULL,
	"charge_cents" integer NOT NULL,
	"wallet_address" text NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"moonpay_id" text,
	"credited_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet" (
	"user_id" text PRIMARY KEY NOT NULL,
	"public_key" text NOT NULL,
	"secret_enc" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "funding" ADD CONSTRAINT "funding_pass_id_pass_id_fk" FOREIGN KEY ("pass_id") REFERENCES "public"."pass"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funding" ADD CONSTRAINT "funding_sponsor_id_user_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "funding_sponsor_idx" ON "funding" USING btree ("sponsor_id");