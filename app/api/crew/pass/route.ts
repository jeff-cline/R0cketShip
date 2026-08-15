import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { crewUsers, crewPassEvents } from "@/src/db/schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { passCode?: string; merchantId?: string } | null;
  const passCode = String(b?.passCode ?? "").trim();
  if (!passCode) return NextResponse.json({ error: "passCode required" }, { status: 400 });
  const u = (await db.select({ id: crewUsers.id }).from(crewUsers).where(eq(crewUsers.passCode, passCode)).limit(1))[0];
  await db.insert(crewPassEvents).values({
    crewUserId: u?.id ?? null,
    merchantId: String(b?.merchantId ?? "") || null,
    kind: "shown",
  });
  return NextResponse.json({ ok: true });
}
