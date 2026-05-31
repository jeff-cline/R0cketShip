CREATE TYPE "public"."lead_segment" AS ENUM('residential', 'commercial');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('upload', 'webhook');--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"sha_lc_hem" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"business_email" text,
	"personal_phones" text[] DEFAULT '{}'::text[] NOT NULL,
	"mobile_phones" text[] DEFAULT '{}'::text[] NOT NULL,
	"emails" text[] DEFAULT '{}'::text[] NOT NULL,
	"linkedin_url" text,
	"address" text,
	"city" text,
	"state" text,
	"zip" text,
	"zip4" text,
	"gender" text,
	"age_range" text,
	"income_range" text,
	"net_worth" text,
	"job_title" text,
	"department" text,
	"company_name" text,
	"company_domain" text,
	"company_revenue" text,
	"company_employee_count" text,
	"company_state" text,
	"company_linkedin_url" text,
	"business_email_validation_status" text,
	"contact_country" text,
	"score_category" text,
	"segment" "lead_segment" NOT NULL,
	"last_updated" timestamp,
	"extra" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source" "lead_source" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sha_lc_hem" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "persons_sha_lc_hem_unique" UNIQUE("sha_lc_hem")
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "ingest_key" text;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "leads_tenant_person_uniq" ON "leads" USING btree ("tenant_id","person_id");--> statement-breakpoint
CREATE INDEX "leads_tenant_zip_idx" ON "leads" USING btree ("tenant_id","zip");