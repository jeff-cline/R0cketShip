CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" text NOT NULL,
	"ip" text,
	"niche" text NOT NULL,
	"money_word" text NOT NULL,
	"logo_url" text,
	"theme" jsonb NOT NULL,
	"offers" jsonb NOT NULL,
	"monthly_price_default" numeric NOT NULL,
	"footer_html" text DEFAULT '' NOT NULL,
	"active_payment_provider" text DEFAULT 'stripe' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_domain_unique" UNIQUE("domain")
);
