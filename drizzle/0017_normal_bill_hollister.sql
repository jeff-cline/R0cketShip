CREATE TYPE "public"."commission_status" AS ENUM('accrued', 'owed', 'paid', 'void');--> statement-breakpoint
CREATE TYPE "public"."payout_form" AS ENUM('cash', 'credit');--> statement-breakpoint
CREATE TYPE "public"."referral_scope" AS ENUM('platform', 'tenant');--> statement-breakpoint
DO $$ BEGIN
  ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'partner';
EXCEPTION WHEN others THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'sales_manager';
EXCEPTION WHEN others THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE "commission_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referral_code_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"referred_user_id" uuid,
	"payment_id" uuid,
	"kind" text DEFAULT 'customer' NOT NULL,
	"basis_amount" numeric NOT NULL,
	"rate" numeric NOT NULL,
	"amount" numeric NOT NULL,
	"scope" "referral_scope" NOT NULL,
	"tenant_id" uuid,
	"period_month" text NOT NULL,
	"status" "commission_status" DEFAULT 'accrued' NOT NULL,
	"payout_batch_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referred_user_id" uuid NOT NULL,
	"referral_code_id" uuid NOT NULL,
	"scope" "referral_scope" NOT NULL,
	"tenant_id" uuid,
	"activated_at" timestamp,
	"upgraded_at" timestamp,
	"window_ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "partner_referrals_referred_user_id_unique" UNIQUE("referred_user_id")
);
--> statement-breakpoint
CREATE TABLE "payout_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_month" text NOT NULL,
	"scope" "referral_scope",
	"created_by" uuid,
	"status" text DEFAULT 'queued' NOT NULL,
	"total_amount" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"method" text DEFAULT 'manual' NOT NULL,
	"paypal_email" text,
	"stripe_connect_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payout_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sales_rep_rate" numeric DEFAULT '0.20' NOT NULL,
	"default_partner_rate" numeric DEFAULT '0.20' NOT NULL,
	"partner_rate_cap" numeric DEFAULT '0.30' NOT NULL,
	"whitelabel_landed_rate" numeric DEFAULT '0.10' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"scope" "referral_scope" NOT NULL,
	"tenant_id" uuid,
	"customer_rate" numeric DEFAULT '0.20' NOT NULL,
	"whitelabel_rate" numeric,
	"payout_form" "payout_form" DEFAULT 'cash' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "partner_program_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "partner_rate" numeric DEFAULT '0.20' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "show_become_a_partner" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "customer_funding_policy" text DEFAULT 'self' NOT NULL;--> statement-breakpoint
ALTER TABLE "partner_referrals" ADD CONSTRAINT "partner_referrals_referred_user_id_users_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_referrals" ADD CONSTRAINT "partner_referrals_referral_code_id_referral_codes_id_fk" FOREIGN KEY ("referral_code_id") REFERENCES "public"."referral_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_settings" ADD CONSTRAINT "payout_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;