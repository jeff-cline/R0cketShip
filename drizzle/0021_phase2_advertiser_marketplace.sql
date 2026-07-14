CREATE TYPE "public"."adv_campaign_status" AS ENUM('pending', 'active', 'paused', 'out_of_budget', 'rejected', 'frozen');--> statement-breakpoint
CREATE TYPE "public"."adv_ledger_type" AS ENUM('signup_bonus', 'deposit', 'click_charge', 'refund_admin', 'coupon_grant', 'admin_grant');--> statement-breakpoint
CREATE TYPE "public"."adv_payment_provider" AS ENUM('stripe', 'paypal', 'manual', 'coupon');--> statement-breakpoint
CREATE TYPE "public"."adv_payment_purpose" AS ENUM('signup_bonus', 'deposit', 'coupon_grant', 'admin_grant');--> statement-breakpoint
CREATE TYPE "public"."advertiser_status" AS ENUM('pending', 'approved', 'frozen', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."manager_wallet_ledger_type" AS ENUM('advertiser_referral', 'admin_adjustment', 'withdrawal');--> statement-breakpoint
CREATE TYPE "public"."offer_path" AS ENUM('pay_for_success', 'strategic_partner');--> statement-breakpoint
CREATE TYPE "public"."ownership_type" AS ENUM('public', 'private', 'nonprofit', 'government');--> statement-breakpoint
CREATE TYPE "public"."paid_to_account_kind" AS ENUM('customer_wallet', 'manager_wallet', 'agent_balance');--> statement-breakpoint
CREATE TYPE "public"."referrer_kind" AS ENUM('customer', 'tenant_manager', 'agent', 'external');--> statement-breakpoint
CREATE TYPE "public"."target_kpi" AS ENUM('booking', 'order', 'sale', 'site_visit', 'other');--> statement-breakpoint
CREATE TABLE "advertiser_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" "adv_campaign_status" DEFAULT 'pending' NOT NULL,
	"email_subject" text NOT NULL,
	"email_body_html" text NOT NULL,
	"cta_url" text NOT NULL,
	"cta_label" text DEFAULT 'Learn more' NOT NULL,
	"max_cpa_cents" integer NOT NULL,
	"daily_budget_cents" integer,
	"targeting_filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"total_sends" integer DEFAULT 0 NOT NULL,
	"total_clicks" integer DEFAULT 0 NOT NULL,
	"total_spend_cents" integer DEFAULT 0 NOT NULL,
	"today_sends" integer DEFAULT 0 NOT NULL,
	"today_clicks" integer DEFAULT 0 NOT NULL,
	"today_spend_cents" integer DEFAULT 0 NOT NULL,
	"approved_at" timestamp,
	"approved_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advertiser_click_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"send_event_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"clicked_at" timestamp DEFAULT now() NOT NULL,
	"charge_cents" integer NOT NULL,
	"user_agent" text,
	"ip" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advertiser_intake" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" uuid NOT NULL,
	"phone" text,
	"business_name" text,
	"business_url" text,
	"industry" text,
	"employee_count_band" text,
	"annual_revenue_band" text,
	"years_in_business" integer,
	"duns_number" text,
	"ownership_type" "ownership_type",
	"customer_ltv_cents" integer,
	"typical_cac_cents" integer,
	"target_kpi" "target_kpi",
	"target_geography_text" text,
	"monthly_ad_budget_cents" integer,
	"referral_source" text,
	"offer_path" "offer_path" NOT NULL,
	"about_business" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "advertiser_intake_advertiser_id_unique" UNIQUE("advertiser_id")
);
--> statement-breakpoint
CREATE TABLE "advertiser_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" uuid NOT NULL,
	"campaign_id" uuid,
	"delta_cents" integer NOT NULL,
	"type" "adv_ledger_type" NOT NULL,
	"ref_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advertiser_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"provider" "adv_payment_provider" NOT NULL,
	"provider_payment_id" text,
	"purpose" "adv_payment_purpose" NOT NULL,
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advertiser_referral_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referral_id" uuid NOT NULL,
	"triggering_click_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"paid_to_account_kind" "paid_to_account_kind" NOT NULL,
	"paid_to_account_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advertiser_referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" uuid NOT NULL,
	"referrer_user_id" uuid NOT NULL,
	"referrer_kind" "referrer_kind" NOT NULL,
	"commission_pct" integer DEFAULT 15 NOT NULL,
	"window_ends_at" timestamp NOT NULL,
	"total_paid_out_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "advertiser_referrals_advertiser_id_unique" UNIQUE("advertiser_id")
);
--> statement-breakpoint
CREATE TABLE "advertiser_send_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"mailbox_id" uuid,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"tracking_token" text NOT NULL,
	CONSTRAINT "advertiser_send_events_tracking_token_unique" UNIQUE("tracking_token")
);
--> statement-breakpoint
CREATE TABLE "advertiser_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "advertiser_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "advertiser_signup_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"ip" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advertisers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text,
	"status" "advertiser_status" DEFAULT 'pending' NOT NULL,
	"wallet_balance_cents" integer DEFAULT 0 NOT NULL,
	"referrer_user_id" uuid,
	"referrer_kind" "referrer_kind",
	"referrer_window_starts_at" timestamp,
	"referrer_window_ends_at" timestamp,
	"email_verified_at" timestamp,
	"email_verify_token" text,
	"email_verify_token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "advertisers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "manager_wallet_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"delta_cents" integer NOT NULL,
	"type" "manager_wallet_ledger_type" NOT NULL,
	"ref_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manager_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"balance_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "manager_wallets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "advertising_stripe_secret_enc" text;--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "advertising_stripe_publishable" text;--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "advertising_stripe_webhook_secret_enc" text;--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "god_auto_approve_advertisers" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "god_auto_approve_campaigns" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "advertiser_campaigns" ADD CONSTRAINT "advertiser_campaigns_advertiser_id_advertisers_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."advertisers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertiser_click_events" ADD CONSTRAINT "advertiser_click_events_send_event_id_advertiser_send_events_id_fk" FOREIGN KEY ("send_event_id") REFERENCES "public"."advertiser_send_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertiser_click_events" ADD CONSTRAINT "advertiser_click_events_campaign_id_advertiser_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."advertiser_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertiser_intake" ADD CONSTRAINT "advertiser_intake_advertiser_id_advertisers_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."advertisers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertiser_ledger" ADD CONSTRAINT "advertiser_ledger_advertiser_id_advertisers_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."advertisers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertiser_payments" ADD CONSTRAINT "advertiser_payments_advertiser_id_advertisers_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."advertisers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertiser_referral_payouts" ADD CONSTRAINT "advertiser_referral_payouts_referral_id_advertiser_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."advertiser_referrals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertiser_referral_payouts" ADD CONSTRAINT "advertiser_referral_payouts_triggering_click_id_advertiser_click_events_id_fk" FOREIGN KEY ("triggering_click_id") REFERENCES "public"."advertiser_click_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertiser_referrals" ADD CONSTRAINT "advertiser_referrals_advertiser_id_advertisers_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."advertisers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertiser_send_events" ADD CONSTRAINT "advertiser_send_events_campaign_id_advertiser_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."advertiser_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertiser_send_events" ADD CONSTRAINT "advertiser_send_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertiser_sessions" ADD CONSTRAINT "advertiser_sessions_advertiser_id_advertisers_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."advertisers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_wallet_ledger" ADD CONSTRAINT "manager_wallet_ledger_wallet_id_manager_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."manager_wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_wallets" ADD CONSTRAINT "manager_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "adv_campaigns_status_idx" ON "advertiser_campaigns" USING btree ("status","advertiser_id");--> statement-breakpoint
CREATE INDEX "adv_campaigns_advertiser_idx" ON "advertiser_campaigns" USING btree ("advertiser_id");--> statement-breakpoint
CREATE INDEX "adv_click_events_campaign_idx" ON "advertiser_click_events" USING btree ("campaign_id","clicked_at");--> statement-breakpoint
CREATE INDEX "adv_ledger_advertiser_idx" ON "advertiser_ledger" USING btree ("advertiser_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "adv_send_events_campaign_lead_uniq" ON "advertiser_send_events" USING btree ("campaign_id","lead_id");--> statement-breakpoint
CREATE INDEX "adv_send_events_sent_at_idx" ON "advertiser_send_events" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "adv_send_events_campaign_sent_idx" ON "advertiser_send_events" USING btree ("campaign_id","sent_at");--> statement-breakpoint
CREATE INDEX "adv_signup_attempts_email_idx" ON "advertiser_signup_attempts" USING btree ("email","created_at");--> statement-breakpoint
CREATE INDEX "adv_signup_attempts_ip_idx" ON "advertiser_signup_attempts" USING btree ("ip","created_at");--> statement-breakpoint
CREATE INDEX "manager_wallet_ledger_wallet_idx" ON "manager_wallet_ledger" USING btree ("wallet_id","created_at");