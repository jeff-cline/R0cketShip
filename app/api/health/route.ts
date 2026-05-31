import { NextResponse } from "next/server";
import { pool } from "@/src/db/client";

export const runtime = "nodejs";

export async function GET() {
  try {
    await pool.query("SELECT 1");
    return NextResponse.json({ status: "ok", db: "up" });
  } catch {
    return NextResponse.json({ status: "error", db: "down" }, { status: 503 });
  }
}
