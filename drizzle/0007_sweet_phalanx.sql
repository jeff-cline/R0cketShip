CREATE TABLE "affiliates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "affiliates_customer_id_unique" UNIQUE("customer_id"),
	CONSTRAINT "affiliates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referred_customer_id" uuid NOT NULL,
	"affiliate_customer_id" uuid NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_referred_customer_id_unique" UNIQUE("referred_customer_id")
);
--> statement-breakpoint
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_customer_id_users_id_fk" FOREIGN KEY ("referred_customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_affiliate_customer_id_users_id_fk" FOREIGN KEY ("affiliate_customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;