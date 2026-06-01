CREATE TYPE "public"."site_style" AS ENUM('trust', 'bold', 'dark');--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "style" "site_style" DEFAULT 'bold' NOT NULL;