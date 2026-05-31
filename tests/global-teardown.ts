import "dotenv/config";
import { pool } from "@/src/db/client";

// Runs once in the main process after the entire test run.
export async function teardown() {
  await pool.end();
}
