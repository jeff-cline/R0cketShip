CREATE TYPE "public"."email_send_status" AS ENUM('sent', 'failed', 'skipped');--> statement-breakpoint
CREATE TABLE "email_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"delivery_id" uuid NOT NULL,
	"lead_email" text,
	"status" "email_send_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_integrations" ADD COLUMN "booking_url" text;--> statement-breakpoint
ALTER TABLE "customer_integrations" ADD COLUMN "email_subject" text;--> statement-breakpoint
ALTER TABLE "customer_integrations" ADD COLUMN "email_body_html" text;--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "smtp_host" text;--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "smtp_port" text;--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "smtp_user" text;--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "smtp_pass_enc" text;--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "smtp_from" text;--> statement-breakpoint
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;