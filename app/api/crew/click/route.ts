import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/src/db/client";
import { crewMerchants, crewClicks } from "@/src/db/schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { slug?: string } | null;
  const slug = String(b?.slug ?? "").trim();
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
  const m = (await db.select({ id: crewMerchants.id, port: crewMerchants.port }).from(crewMerchants).where(eq(crewMerchants.slug, slug)).limit(1))[0];
  if (!m) return NextResponse.json({ error: "not found" }, { status: 404 });
  await db.insert(crewClicks).values({ merchantId: m.id, port: m.port });
  await db.update(crewMerchants).set({ clicks: sql`${crewMerchants.clicks} + 1` }).where(eq(crewMerchants.id, m.id));
  return NextResponse.json({ ok: true });
}
