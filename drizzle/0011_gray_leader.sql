CREATE TYPE "public"."call_disposition" AS ENUM('no_answer', 'left_message', 'callback', 'hot_transfer', 'booked', 'sold', 'dead');--> statement-breakpoint
DO $$ BEGIN
  ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'agent';
EXCEPTION WHEN others THEN
  NULL;
END $$;
--> statement-breakpoint
CREATE TABLE "calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"disposition" "call_disposition" NOT NULL,
	"notes" text,
	"callback_at" timestamp,
	"sale_value" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "hot_transfer_number" text;--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "calls_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "calls_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;