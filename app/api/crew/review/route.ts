import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { crewMerchants, crewMerchantReviews } from "@/src/db/schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { slug?: string; rating?: number; name?: string; comment?: string } | null;
  const slug = String(b?.slug ?? "").trim();
  const rating = Math.max(1, Math.min(5, Math.round(Number(b?.rating)) || 0));
  if (!slug || !rating) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const m = (await db.select({ id: crewMerchants.id, rating: crewMerchants.rating, reviewCount: crewMerchants.reviewCount })
    .from(crewMerchants).where(eq(crewMerchants.slug, slug)).limit(1))[0];
  if (!m) return NextResponse.json({ error: "not found" }, { status: 404 });

  await db.insert(crewMerchantReviews).values({
    merchantId: m.id,
    rating,
    authorName: String(b?.name ?? "").slice(0, 80) || null,
    comment: String(b?.comment ?? "").slice(0, 1000) || null,
  });

  // Blend into existing (seeded) counts so the displayed numbers stay sensible.
  const prevCount = m.reviewCount;
  const prevRating = Number(m.rating) || 0;
  const newCount = prevCount + 1;
  const newRating = (prevRating * prevCount + rating) / newCount;
  await db.update(crewMerchants).set({ rating: newRating.toFixed(2), reviewCount: newCount, updatedAt: new Date() }).where(eq(crewMerchants.id, m.id));

  return NextResponse.json({ ok: true });
}
