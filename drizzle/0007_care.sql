CREATE TABLE "care_plan" (
	"id" text PRIMARY KEY NOT NULL,
	"pass_id" text NOT NULL,
	"package_id" text NOT NULL,
	"created_by" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "care_step" (
	"id" text PRIMARY KEY NOT NULL,
	"plan_id" text NOT NULL,
	"idx" integer NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"price_cents" integer NOT NULL,
	"clinic_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"done_at" timestamp,
	"ledger_id" text
);
--> statement-breakpoint
ALTER TABLE "clinic" ADD COLUMN "code_fails" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "clinic" ADD COLUMN "code_lock_until" timestamp;--> statement-breakpoint
ALTER TABLE "care_plan" ADD CONSTRAINT "care_plan_pass_id_pass_id_fk" FOREIGN KEY ("pass_id") REFERENCES "public"."pass"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_step" ADD CONSTRAINT "care_step_plan_id_care_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."care_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_step" ADD CONSTRAINT "care_step_clinic_id_clinic_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinic"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "care_plan_pass_idx" ON "care_plan" USING btree ("pass_id");--> statement-breakpoint
CREATE INDEX "care_step_plan_idx" ON "care_step" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "care_step_clinic_idx" ON "care_step" USING btree ("clinic_id");