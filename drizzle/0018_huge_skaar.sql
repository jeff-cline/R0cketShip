DO $$ BEGIN
  ALTER TYPE "public"."coupon_kind" ADD VALUE IF NOT EXISTS 'percent_off';
EXCEPTION WHEN others THEN NULL;
END $$;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "duration_months" integer;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "landed_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "landed_at" timestamp;--> statement-breakpoint
ALTER TABLE "zip_subscriptions" ADD COLUMN "coupon_code" text;--> statement-breakpoint
ALTER TABLE "zip_subscriptions" ADD COLUMN "discount_percent" numeric;--> statement-breakpoint
ALTER TABLE "zip_subscriptions" ADD COLUMN "discount_months_left" integer;