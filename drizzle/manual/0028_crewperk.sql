-- CrewPerk merchant marketplace tables + seed. Applied to prod surgically (idempotent).
CREATE TABLE IF NOT EXISTS "crew_merchants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "category" text NOT NULL DEFAULT 'Food & Drink',
  "port" text NOT NULL DEFAULT 'San Juan, Puerto Rico',
  "tier" text NOT NULL DEFAULT 'community_builder',
  "description" text,
  "phone" text,
  "address" text,
  "website" text,
  "images" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "perk" text,
  "price_level" text NOT NULL DEFAULT '$$',
  "lat" numeric,
  "lon" numeric,
  "rating" numeric NOT NULL DEFAULT '0',
  "review_count" integer NOT NULL DEFAULT 0,
  "clicks" integer NOT NULL DEFAULT 0,
  "featured" boolean NOT NULL DEFAULT false,
  "status" text NOT NULL DEFAULT 'active',
  "coupon_code" text,
  "coupon_type" text,
  "coupon_note" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "crew_merchants_port_idx" ON "crew_merchants" ("port", "status");

CREATE TABLE IF NOT EXISTS "crew_merchant_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "merchant_id" uuid NOT NULL REFERENCES "crew_merchants"("id") ON DELETE CASCADE,
  "author_name" text,
  "rating" integer NOT NULL,
  "comment" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "crew_merchant_reviews_merchant_idx" ON "crew_merchant_reviews" ("merchant_id", "created_at");

CREATE TABLE IF NOT EXISTS "crew_clicks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "merchant_id" uuid NOT NULL REFERENCES "crew_merchants"("id") ON DELETE CASCADE,
  "port" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "crew_clicks_merchant_idx" ON "crew_clicks" ("merchant_id", "created_at");

-- Seed merchants (idempotent on slug). Images are verified Unsplash URLs.
INSERT INTO "crew_merchants" ("slug","name","category","port","tier","description","phone","address","website","images","perk","price_level","lat","lon","rating","review_count","featured") VALUES
('la-factoria','La Factoría','Nightlife','San Juan, Puerto Rico','advanced','A legendary, unmarked Old San Juan cocktail bar — a maze of rooms, live music, and some of the best drinks in the Caribbean. Crew know to knock.','+1-787-555-0142','148 Calle San Sebastián, Old San Juan','https://example.com','["https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=700&q=72&auto=format&fit=crop","https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=700&q=72&auto=format&fit=crop"]','Free welcome shot','$$',18.4663,-66.1186,'4.9',412,true),
('casa-bacardi','Casa Bacardí Tour','Excursions','San Juan, Puerto Rico','advanced','The Cathedral of Rum in Cataño — the world''s largest premium rum distillery tour. A 15-minute ferry from Old San Juan. Crew rate on every tasting.','+1-787-555-0188','Carr. 165 Km 6.2, Cataño','https://example.com','["https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=700&q=72&auto=format&fit=crop","https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=700&q=72&auto=format&fit=crop"]','Crew rate','$$',18.4561,-66.1432,'4.8',1280,true),
('escambron-beach','Escambrón Beach Club','Beaches','San Juan, Puerto Rico','community_builder','A protected cove minutes from the pier — calm water, snorkeling, loungers, and a beach bar. Crew get a free day pass.','+1-787-555-0119','Av. Muñoz Rivera, San Juan','https://example.com','["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&q=72&auto=format&fit=crop","https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=700&q=72&auto=format&fit=crop","https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=700&q=72&auto=format&fit=crop"]','Free day pass','$',18.4671,-66.0853,'4.9',318,true),
('el-jibarito','El Jibarito','Food & Drink','San Juan, Puerto Rico','community_builder','Family-run Puerto Rican home cooking in the heart of Old San Juan — mofongo, pernil, and a free appetizer for crew.','+1-787-555-0166','280 Calle Sol, Old San Juan','https://example.com','["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700&q=72&auto=format&fit=crop"]','Free appetizer','$$',18.4655,-66.1162,'4.6',904,true),
('sunset-catamaran','Sunset Catamaran','Excursions','San Juan, Puerto Rico','advanced','Half-day sail and snorkel out of San Juan Bay — open bar, music, and the best sunset on the island. 20% off for crew.','+1-787-555-0173','Pier 2, San Juan','https://example.com','["https://images.unsplash.com/photo-1502933691298-84fc14542831?w=700&q=72&auto=format&fit=crop","https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=700&q=72&auto=format&fit=crop"]','20% crew off','$$$',18.4602,-66.1004,'4.9',221,true),
('pier2-shuttle','Pier 2 Ferry Shuttle','Transport','San Juan, Puerto Rico','free','The fast, cheap way from the cruise piers to Cataño and the beaches. Flat $5 crew ride, all day.','+1-787-555-0101','Pier 2, Old San Juan','https://example.com','["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=700&q=72&auto=format&fit=crop"]','$5 crew ride','$',18.4614,-66.1141,'4.4',156,false),
('crew-recovery-spa','Crew Recovery Spa','Wellness','San Juan, Puerto Rico','community_builder','Massage, sauna, and recovery built for people who live at sea. Walk-ins welcome — $20 crew massage.','+1-787-555-0155','1054 Av. Ashford, Condado','https://example.com','["https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=700&q=72&auto=format&fit=crop"]','$20 massage','$$',18.4571,-66.0731,'4.7',88,false),
('crew-night-placita','Crew Night @ La Placita','Events','San Juan, Puerto Rico','advanced','The weekly crew takeover of Santurce''s legendary nightlife square — free entry with your CrewPerk pass.','+1-787-555-0200','Plaza del Mercado, Santurce','https://example.com','["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=700&q=72&auto=format&fit=crop","https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=700&q=72&auto=format&fit=crop"]','Free entry','$',18.4486,-66.0703,'4.9',540,true),
('cozumel-crew-cantina','Crew Cantina Cozumel','Food & Drink','Cozumel, Mexico','community_builder','Tacos, margaritas, and a crew tab steps from the Cozumel pier. First drink free for crew.','+52-987-555-0110','Av. Rafael E. Melgar, Cozumel','https://example.com','["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700&q=72&auto=format&fit=crop"]','First drink free','$',20.5100,-86.9460,'4.7',265,true),
('roatan-west-bay','West Bay Beach Club','Beaches','Roatán, Honduras','community_builder','White sand, reef snorkeling, and crew loungers on Roatán''s best beach. Free chair + towel for crew.','+504-555-0125','West Bay, Roatán','https://example.com','["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&q=72&auto=format&fit=crop","https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=700&q=72&auto=format&fit=crop"]','Free chair + towel','$',16.2700,-86.5900,'4.8',197,true)
ON CONFLICT ("slug") DO NOTHING;
