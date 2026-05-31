CREATE TYPE "public"."delivery_status" AS ENUM('new', 'contacted', 'booked', 'sold', 'dead');--> statement-breakpoint
CREATE TABLE "customer_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"webhook_url" text,
	"webhook_secret" text,
	"active" boolean DEFAULT true NOT NULL,
	"last_status" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_integrations_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "lead_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"price_credits" numeric NOT NULL,
	"tier_at_delivery" text NOT NULL,
	"status" "delivery_status" DEFAULT 'new' NOT NULL,
	"notes" text,
	"sale_value" numeric,
	"delivered_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_integrations" ADD CONSTRAINT "customer_integrations_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_deliveries" ADD CONSTRAINT "lead_deliveries_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_deliveries" ADD CONSTRAINT "lead_deliveries_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_deliveries" ADD CONSTRAINT "lead_deliveries_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lead_deliveries_customer_lead_uniq" ON "lead_deliveries" USING btree ("customer_id","lead_id");