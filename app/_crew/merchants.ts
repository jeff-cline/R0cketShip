import { and, desc, eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { crewMerchants, crewMerchantReviews } from "@/src/db/schema";

export type MerchantRow = typeof crewMerchants.$inferSelect;
export type ReviewRow = typeof crewMerchantReviews.$inferSelect;

export async function featuredMerchants(limit = 8): Promise<MerchantRow[]> {
  return db.select().from(crewMerchants).where(eq(crewMerchants.status, "active"))
    .orderBy(desc(crewMerchants.featured), desc(crewMerchants.rating)).limit(limit);
}

export async function merchantsByPort(port: string): Promise<MerchantRow[]> {
  return db.select().from(crewMerchants).where(and(eq(crewMerchants.status, "active"), eq(crewMerchants.port, port)))
    .orderBy(desc(crewMerchants.featured), desc(crewMerchants.rating));
}

export async function merchantBySlug(slug: string): Promise<{ m: MerchantRow; reviews: ReviewRow[] } | null> {
  const m = (await db.select().from(crewMerchants).where(eq(crewMerchants.slug, slug)).limit(1))[0];
  if (!m) return null;
  const reviews = await db.select().from(crewMerchantReviews).where(eq(crewMerchantReviews.merchantId, m.id))
    .orderBy(desc(crewMerchantReviews.createdAt)).limit(50);
  return { m, reviews };
}
