ALTER TABLE "tenants" ADD COLUMN "platform_fee_rate" numeric DEFAULT '0.60' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "data_cost_rate" numeric DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "hero_image" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "hero_headline" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "hero_subhead" text;