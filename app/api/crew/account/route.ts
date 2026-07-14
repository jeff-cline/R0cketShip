import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { crewUsers } from "@/src/db/schema";

export const runtime = "nodejs";
const genCode = () => "CP-" + Math.random().toString(36).slice(2, 8).toUpperCase();

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { email?: string; name?: string; ship?: string; port?: string } | null;
  const email = String(b?.email ?? "").trim().toLowerCase();
  if (!email.includes("@")) return NextResponse.json({ error: "valid email required" }, { status: 400 });

  const existing = (await db.select().from(crewUsers).where(eq(crewUsers.email, email)).limit(1))[0];
  if (existing) return NextResponse.json({ passCode: existing.passCode, name: existing.name });

  let passCode = genCode();
  for (let i = 0; i < 5; i++) {
    const dupe = (await db.select({ id: crewUsers.id }).from(crewUsers).where(eq(crewUsers.passCode, passCode)).limit(1))[0];
    if (!dupe) break;
    passCode = genCode();
  }
  const name = String(b?.name ?? "").slice(0, 80) || null;
  await db.insert(crewUsers).values({
    email, name,
    ship: String(b?.ship ?? "").slice(0, 80) || null,
    port: String(b?.port ?? "").slice(0, 120) || null,
    passCode,
  });
  return NextResponse.json({ passCode, name });
}
