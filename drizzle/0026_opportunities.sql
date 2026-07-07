CREATE TABLE "business_lead_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"author_id" uuid,
	"author_email" text,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"source" text DEFAULT 'contact' NOT NULL,
	"name" text,
	"company" text,
	"email" text,
	"work_phone" text,
	"cell_phone" text,
	"message" text,
	"predictive" text,
	"meta" jsonb,
	"status" text DEFAULT 'new' NOT NULL,
	"assigned_to_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crew_ad_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_id" uuid NOT NULL,
	"port" text,
	"charge_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crew_ads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser" text NOT NULL,
	"port" text DEFAULT 'all' NOT NULL,
	"headline" text NOT NULL,
	"body" text,
	"image_url" text,
	"link_url" text NOT NULL,
	"bid_cents" integer DEFAULT 50 NOT NULL,
	"balance_cents" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"spent_cents" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crew_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"port" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crew_merchant_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"author_name" text,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crew_merchants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'Food & Drink' NOT NULL,
	"port" text DEFAULT 'San Juan, Puerto Rico' NOT NULL,
	"tier" text DEFAULT 'community_builder' NOT NULL,
	"description" text,
	"phone" text,
	"address" text,
	"website" text,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"perk" text,
	"price_level" text DEFAULT '$$' NOT NULL,
	"lat" numeric,
	"lon" numeric,
	"rating" numeric DEFAULT '0' NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"coupon_code" text,
	"coupon_type" text,
	"coupon_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crew_merchants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "crew_pass_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crew_user_id" uuid,
	"merchant_id" uuid,
	"kind" text DEFAULT 'shown' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crew_referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crew_user_id" uuid,
	"consumer_email" text,
	"port" text,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crew_ticket_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"crew_user_id" uuid,
	"email" text,
	"qty" integer DEFAULT 1 NOT NULL,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"rev_share_cents" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'reserved' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crew_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"port" text DEFAULT 'San Juan, Puerto Rico' NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"rev_share_pct" integer DEFAULT 20 NOT NULL,
	"capacity" integer,
	"sold" integer DEFAULT 0 NOT NULL,
	"image_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crew_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"ship" text,
	"port" text,
	"pass_code" text NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crew_users_email_unique" UNIQUE("email"),
	CONSTRAINT "crew_users_pass_code_unique" UNIQUE("pass_code")
);
--> statement-breakpoint
CREATE TABLE "operating_decks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text,
	"highlight" text,
	"image_url" text,
	"pdf_url" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"title" text NOT NULL,
	"business_name" text,
	"address" text,
	"key_people" text,
	"entry_value" numeric DEFAULT '0' NOT NULL,
	"monthly_value" numeric DEFAULT '0' NOT NULL,
	"stage" integer DEFAULT 0 NOT NULL,
	"priority" numeric DEFAULT '1000' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_by_email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunity_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"author_id" uuid,
	"author_email" text,
	"author_color" text DEFAULT 'teal' NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business_lead_notes" ADD CONSTRAINT "business_lead_notes_lead_id_business_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."business_leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_lead_notes" ADD CONSTRAINT "business_lead_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_leads" ADD CONSTRAINT "business_leads_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crew_ad_clicks" ADD CONSTRAINT "crew_ad_clicks_ad_id_crew_ads_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."crew_ads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crew_clicks" ADD CONSTRAINT "crew_clicks_merchant_id_crew_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."crew_merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crew_merchant_reviews" ADD CONSTRAINT "crew_merchant_reviews_merchant_id_crew_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."crew_merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crew_pass_events" ADD CONSTRAINT "crew_pass_events_crew_user_id_crew_users_id_fk" FOREIGN KEY ("crew_user_id") REFERENCES "public"."crew_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crew_pass_events" ADD CONSTRAINT "crew_pass_events_merchant_id_crew_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."crew_merchants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crew_referrals" ADD CONSTRAINT "crew_referrals_crew_user_id_crew_users_id_fk" FOREIGN KEY ("crew_user_id") REFERENCES "public"."crew_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crew_ticket_orders" ADD CONSTRAINT "crew_ticket_orders_ticket_id_crew_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."crew_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crew_ticket_orders" ADD CONSTRAINT "crew_ticket_orders_crew_user_id_crew_users_id_fk" FOREIGN KEY ("crew_user_id") REFERENCES "public"."crew_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crew_tickets" ADD CONSTRAINT "crew_tickets_merchant_id_crew_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."crew_merchants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_notes" ADD CONSTRAINT "opportunity_notes_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_notes" ADD CONSTRAINT "opportunity_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_lead_notes_lead_idx" ON "business_lead_notes" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "business_leads_created_idx" ON "business_leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "business_leads_assigned_idx" ON "business_leads" USING btree ("assigned_to_user_id");--> statement-breakpoint
CREATE INDEX "crew_ad_clicks_ad_idx" ON "crew_ad_clicks" USING btree ("ad_id","created_at");--> statement-breakpoint
CREATE INDEX "crew_ads_port_idx" ON "crew_ads" USING btree ("port","status");--> statement-breakpoint
CREATE INDEX "crew_clicks_merchant_idx" ON "crew_clicks" USING btree ("merchant_id","created_at");--> statement-breakpoint
CREATE INDEX "crew_merchant_reviews_merchant_idx" ON "crew_merchant_reviews" USING btree ("merchant_id","created_at");--> statement-breakpoint
CREATE INDEX "crew_merchants_port_idx" ON "crew_merchants" USING btree ("port","status");--> statement-breakpoint
CREATE INDEX "crew_pass_events_user_idx" ON "crew_pass_events" USING btree ("crew_user_id","created_at");--> statement-breakpoint
CREATE INDEX "crew_referrals_user_idx" ON "crew_referrals" USING btree ("crew_user_id","created_at");--> statement-breakpoint
CREATE INDEX "crew_ticket_orders_ticket_idx" ON "crew_ticket_orders" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "crew_tickets_port_idx" ON "crew_tickets" USING btree ("port","status");--> statement-breakpoint
CREATE INDEX "operating_decks_slug_idx" ON "operating_decks" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "opportunities_priority_idx" ON "opportunities" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "opportunity_notes_opp_idx" ON "opportunity_notes" USING btree ("opportunity_id","created_at");