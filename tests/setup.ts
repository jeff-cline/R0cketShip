import { beforeAll, afterEach } from "vitest";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/src/db/client";

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" });
});

afterEach(async () => {
  await pool.query("TRUNCATE TABLE tenants RESTART IDENTITY CASCADE");
});
