CREATE TYPE "public"."missed_opportunity_source" AS ENUM('invalid_cta_url', 'offer_inactive', 'no_offer', 'tenant_frozen', 'out_of_budget', 'expired_token', 'unknown_token');--> statement-breakpoint
CREATE TYPE "public"."offer_box_format" AS ENUM('html', 'iframe', 'js', 'popup');--> statement-breakpoint
CREATE TYPE "public"."offer_box_mode" AS ENUM('main_only', 'by_niche', 'niche_plus_n', 'top_n_all');--> statement-breakpoint
CREATE TABLE "missed_opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"source_token" text,
	"source" "missed_opportunity_source" NOT NULL,
	"redirected_to" text NOT NULL,
	"user_agent" text,
	"ip" text,
	"referrer" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offer_box_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_box_id" uuid NOT NULL,
	"offer_kind" text NOT NULL,
	"offer_id" text NOT NULL,
	"referrer" text,
	"user_agent" text,
	"ip" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offer_boxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"mode" "offer_box_mode" DEFAULT 'main_only' NOT NULL,
	"niches" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"max_offers" integer DEFAULT 1 NOT NULL,
	"format" "offer_box_format" DEFAULT 'iframe' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "offer_boxes_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "tenant_integrations" ADD COLUMN "marketplace_default_lander" text DEFAULT 'https://r0cketship.com/trending' NOT NULL;--> statement-breakpoint
ALTER TABLE "offer_box_clicks" ADD CONSTRAINT "offer_box_clicks_offer_box_id_offer_boxes_id_fk" FOREIGN KEY ("offer_box_id") REFERENCES "public"."offer_boxes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "missed_opps_tenant_idx" ON "missed_opportunities" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "missed_opps_created_idx" ON "missed_opportunities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "offer_box_clicks_box_idx" ON "offer_box_clicks" USING btree ("offer_box_id","created_at");