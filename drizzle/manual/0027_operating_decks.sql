-- Operating Entity Pitch Decks. Applied to prod surgically (idempotent).
CREATE TABLE IF NOT EXISTS "operating_decks" (
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
CREATE INDEX IF NOT EXISTS "operating_decks_slug_idx" ON "operating_decks" ("slug");

-- Seed: Ascend Health Intelligence → biotech division (only if not already present).
INSERT INTO "operating_decks" ("slug", "title", "subtitle", "highlight", "description", "pdf_url")
SELECT
  'biotech',
  'Ascend Health Intelligence Investor Pitch Deck',
  'A R0cketShip joint venture',
  '$164B → $295B global peptide market · $2M raise @ $20M post-money',
  'Ascend Health Intelligence attacks the $50B+ healthcare commercialization gap — where more than 90% of innovation never reaches the providers who need it. It converts specialty peptide and chronic-wound care into revenue inside a global peptide market racing from $164B in 2026 toward $295B (Grand View Research). A R0cketShip joint venture: we bring the technology, the data, and the demand engine; Ascend brings the clinical edge. Raising $2M at a $20M post-money valuation — the on-ramp to a $30-50M Series A.',
  '/decks/ascend-health-intelligence.pdf'
WHERE NOT EXISTS (SELECT 1 FROM "operating_decks" WHERE "title" = 'Ascend Health Intelligence Investor Pitch Deck');
