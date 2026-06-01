DO $$ BEGIN
  ALTER TYPE "public"."ledger_type" ADD VALUE IF NOT EXISTS 'affiliate';
EXCEPTION WHEN others THEN
  NULL;
END $$;
