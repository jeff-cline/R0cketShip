CREATE TABLE "epartner_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"business_name" text,
	"location" text,
	"roofs_last_12mo" text,
	"seasons_in_business" text,
	"territories" text,
	"team_w2" text,
	"team_1099" text,
	"canvassers" text,
	"tech_used" text,
	"annual_revenue" text,
	"annual_ebitda" text,
	"approached_before" boolean,
	"agree_exit" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"stripe_secret_enc" text,
	"stripe_publishable" text,
	"paypal_client_id" text,
	"paypal_secret_enc" text,
	"twilio_account_sid" text,
	"twilio_auth_token_enc" text,
	"twilio_from_number" text,
	"active_payment_provider" "payment_provider" DEFAULT 'manual' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_integrations_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD CONSTRAINT "tenant_integrations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;