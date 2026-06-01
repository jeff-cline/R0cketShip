CREATE TYPE "public"."payment_purpose" AS ENUM('topup', 'subscription');--> statement-breakpoint
CREATE TYPE "public"."subscription_offer" AS ENUM('data', 'booking', 'epartner');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled');--> statement-breakpoint
CREATE TABLE "zip_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"zip" text NOT NULL,
	"offer" "subscription_offer" DEFAULT 'data' NOT NULL,
	"monthly_price" numeric NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"paid_through" timestamp,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"canceled_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "purpose" "payment_purpose" DEFAULT 'topup' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "subscription_id" uuid;--> statement-breakpoint
ALTER TABLE "zip_subscriptions" ADD CONSTRAINT "zip_subscriptions_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;