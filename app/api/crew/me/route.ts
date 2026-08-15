import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { crewUsers } from "@/src/db/schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { passCode?: string } | null;
  const passCode = String(b?.passCode ?? "").trim();
  if (!passCode) return NextResponse.json({ found: false });
  const u = (await db.select({ name: crewUsers.name, points: crewUsers.points, passCode: crewUsers.passCode }).from(crewUsers).where(eq(crewUsers.passCode, passCode)).limit(1))[0];
  return u ? NextResponse.json({ found: true, ...u }) : NextResponse.json({ found: false });
}
