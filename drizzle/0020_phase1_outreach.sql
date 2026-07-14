CREATE TYPE "public"."outreach_status" AS ENUM('queued', 'sent', 'skipped', 'suppressed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."suppression_reason" AS ENUM('bounce', 'unsubscribe', 'complaint', 'invalid');--> statement-breakpoint
CREATE TABLE "email_suppression" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"reason" "suppression_reason" NOT NULL,
	"tenant_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_suppression_address_unique" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE "mailbox_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"count" integer NOT NULL,
	"monthly_cost" numeric DEFAULT '0' NOT NULL,
	"reason" text,
	"created_by" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outreach_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logo_url" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"cta_url" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "outreach_offers_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "outreach_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"to_addr" text NOT NULL,
	"status" "outreach_status" DEFAULT 'queued' NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"batch_deadline" timestamp NOT NULL,
	"click_token" text NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"clicked_at" timestamp,
	"mailbox_id" uuid,
	"sent_at" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "outreach_queue_click_token_unique" UNIQUE("click_token")
);
--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "outreach_auto_buy" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "outreach_max_mailboxes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "outreach_offers" ADD CONSTRAINT "outreach_offers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_queue" ADD CONSTRAINT "outreach_queue_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_queue" ADD CONSTRAINT "outreach_queue_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "outreach_queue_tenant_lead_uniq" ON "outreach_queue" USING btree ("tenant_id","lead_id");--> statement-breakpoint
CREATE INDEX "outreach_queue_due_idx" ON "outreach_queue" USING btree ("status","scheduled_for");--> statement-breakpoint
CREATE INDEX "outreach_queue_tenant_idx" ON "outreach_queue" USING btree ("tenant_id");