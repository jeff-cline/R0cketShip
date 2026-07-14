-- CrewPerk ads (PPC), crew accounts/passes, and ticketing. Idempotent.
CREATE TABLE IF NOT EXISTS "crew_ads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "advertiser" text NOT NULL,
  "port" text NOT NULL DEFAULT 'all',
  "headline" text NOT NULL,
  "body" text,
  "image_url" text,
  "link_url" text NOT NULL,
  "bid_cents" integer NOT NULL DEFAULT 50,
  "balance_cents" integer NOT NULL DEFAULT 0,
  "clicks" integer NOT NULL DEFAULT 0,
  "spent_cents" integer NOT NULL DEFAULT 0,
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "crew_ads_port_idx" ON "crew_ads" ("port","status");

CREATE TABLE IF NOT EXISTS "crew_ad_clicks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "ad_id" uuid NOT NULL REFERENCES "crew_ads"("id") ON DELETE CASCADE,
  "port" text,
  "charge_cents" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "crew_ad_clicks_ad_idx" ON "crew_ad_clicks" ("ad_id","created_at");

CREATE TABLE IF NOT EXISTS "crew_users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL UNIQUE,
  "name" text,
  "ship" text,
  "port" text,
  "pass_code" text NOT NULL UNIQUE,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "crew_pass_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "crew_user_id" uuid REFERENCES "crew_users"("id") ON DELETE SET NULL,
  "merchant_id" uuid REFERENCES "crew_merchants"("id") ON DELETE SET NULL,
  "kind" text NOT NULL DEFAULT 'shown',
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "crew_pass_events_user_idx" ON "crew_pass_events" ("crew_user_id","created_at");

CREATE TABLE IF NOT EXISTS "crew_tickets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "merchant_id" uuid REFERENCES "crew_merchants"("id") ON DELETE SET NULL,
  "name" text NOT NULL,
  "description" text,
  "port" text NOT NULL DEFAULT 'San Juan, Puerto Rico',
  "price_cents" integer NOT NULL DEFAULT 0,
  "rev_share_pct" integer NOT NULL DEFAULT 20,
  "capacity" integer,
  "sold" integer NOT NULL DEFAULT 0,
  "image_url" text,
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "crew_tickets_port_idx" ON "crew_tickets" ("port","status");

CREATE TABLE IF NOT EXISTS "crew_ticket_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "ticket_id" uuid NOT NULL REFERENCES "crew_tickets"("id") ON DELETE CASCADE,
  "crew_user_id" uuid REFERENCES "crew_users"("id") ON DELETE SET NULL,
  "email" text,
  "qty" integer NOT NULL DEFAULT 1,
  "amount_cents" integer NOT NULL DEFAULT 0,
  "rev_share_cents" integer NOT NULL DEFAULT 0,
  "status" text NOT NULL DEFAULT 'reserved',
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "crew_ticket_orders_ticket_idx" ON "crew_ticket_orders" ("ticket_id","created_at");

-- Seed ads
INSERT INTO "crew_ads" ("advertiser","port","headline","body","image_url","link_url","bid_cents","balance_cents","status")
SELECT 'Old San Juan Rum Tours','San Juan, Puerto Rico','Behind-the-scenes rum tastings','Crew-only small-group distillery tours in Old San Juan. Book the same day.','https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=700&q=72&auto=format&fit=crop','https://example.com/rum-tours',75,50000,'active'
WHERE NOT EXISTS (SELECT 1 FROM "crew_ads" WHERE advertiser='Old San Juan Rum Tours');
INSERT INTO "crew_ads" ("advertiser","port","headline","body","image_url","link_url","bid_cents","balance_cents","status")
SELECT 'IslandSIM — Crew Data','all','Unlimited data the second you dock','Crew eSIM + SIM. Activate before you''re ashore — no roaming.','https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=700&q=72&auto=format&fit=crop','https://example.com/islandsim',60,30000,'active'
WHERE NOT EXISTS (SELECT 1 FROM "crew_ads" WHERE advertiser='IslandSIM — Crew Data');

-- Seed tickets
INSERT INTO "crew_tickets" ("merchant_id","name","description","port","price_cents","rev_share_pct","capacity","image_url")
SELECT (SELECT id FROM crew_merchants WHERE slug='sunset-catamaran'),'Sunset Sail & Snorkel','Half-day catamaran with open bar and snorkel gear. Crew price.','San Juan, Puerto Rico',4500,20,40,'https://images.unsplash.com/photo-1502933691298-84fc14542831?w=700&q=72&auto=format&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM "crew_tickets" WHERE name='Sunset Sail & Snorkel');
INSERT INTO "crew_tickets" ("merchant_id","name","description","port","price_cents","rev_share_pct","capacity","image_url")
SELECT (SELECT id FROM crew_merchants WHERE slug='casa-bacardi'),'Bacardí Mixology Class','Make three signature cocktails with a master mixologist. Includes tasting.','San Juan, Puerto Rico',3500,25,30,'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=700&q=72&auto=format&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM "crew_tickets" WHERE name='Bacardí Mixology Class');
INSERT INTO "crew_tickets" ("merchant_id","name","description","port","price_cents","rev_share_pct","capacity","image_url")
SELECT NULL,'El Yunque Rainforest Crew Tour','Guided half-day in the only tropical rainforest in the US forest system. Transport included.','San Juan, Puerto Rico',6000,20,24,'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=700&q=72&auto=format&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM "crew_tickets" WHERE name='El Yunque Rainforest Crew Tour');
