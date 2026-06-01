CREATE TYPE "public"."mailbox_status" AS ENUM('active', 'paused');--> statement-breakpoint
CREATE TABLE "email_inbound" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"mailbox_id" uuid,
	"from_addr" text NOT NULL,
	"to_addr" text,
	"subject" text,
	"body_text" text,
	"auto_replied" boolean DEFAULT false NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_mailboxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"address" text NOT NULL,
	"display_name" text,
	"provider" text DEFAULT 'smtp' NOT NULL,
	"smtp_host" text,
	"smtp_port" text,
	"smtp_user" text,
	"smtp_pass_enc" text,
	"daily_cap" integer DEFAULT 50 NOT NULL,
	"sent_today" integer DEFAULT 0 NOT NULL,
	"sent_date" text,
	"status" "mailbox_status" DEFAULT 'active' NOT NULL,
	"zapmail_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_outbound" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"mailbox_id" uuid,
	"to_addr" text NOT NULL,
	"subject" text,
	"kind" text DEFAULT 'manual' NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "zapmail_api_key_enc" text;--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "zapmail_workspace_key" text;--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "booking_url" text;--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "auto_reply_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "auto_reply_html" text;--> statement-breakpoint
ALTER TABLE "email_mailboxes" ADD CONSTRAINT "email_mailboxes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;