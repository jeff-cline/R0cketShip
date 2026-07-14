-- Business Leads CRM tables. Applied to prod surgically (idempotent), NOT via
-- the drizzle-kit migrate chain, to avoid pulling in unrelated WIP migrations.
CREATE TABLE IF NOT EXISTS "business_leads" (
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
  "assigned_to_user_id" uuid REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "business_leads_created_idx" ON "business_leads" ("created_at");
CREATE INDEX IF NOT EXISTS "business_leads_assigned_idx" ON "business_leads" ("assigned_to_user_id");

CREATE TABLE IF NOT EXISTS "business_lead_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lead_id" uuid NOT NULL REFERENCES "business_leads"("id") ON DELETE CASCADE,
  "author_id" uuid REFERENCES "users"("id"),
  "author_email" text,
  "body" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "business_lead_notes_lead_idx" ON "business_lead_notes" ("lead_id", "created_at");
