import { beforeAll, afterEach } from "vitest";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/src/db/client";

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" });
});

afterEach(async () => {
  await pool.query("TRUNCATE TABLE tenants, users, sessions, persons, leads, wallets, credit_ledger, payments, coupons, lead_deliveries, customer_integrations, tenant_integrations, epartner_applications, zip_subscriptions, affiliates, referrals, email_sends, calls, opportunities, opportunity_notes RESTART IDENTITY CASCADE");
});
