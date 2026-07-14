CREATE TABLE "trending_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"tenant_id" uuid,
	"redirected_to" text,
	"referrer" text,
	"user_agent" text,
	"ip" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "trending_clicks_offer_idx" ON "trending_clicks" USING btree ("offer_id","created_at");--> statement-breakpoint
CREATE INDEX "trending_clicks_tenant_idx" ON "trending_clicks" USING btree ("tenant_id","created_at");