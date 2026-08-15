import { and, desc, eq, ne, or, sql } from "drizzle-orm";
import { db } from "@/src/db/client";
import { crewAds } from "@/src/db/schema";

export type AdRow = typeof crewAds.$inferSelect;

/** Highest live bidder (with enough Rocket Fuel balance) for a port, or "all". */
export async function topAdsForPort(port: string, limit = 1, exclude?: string): Promise<AdRow[]> {
  return db.select().from(crewAds).where(and(
    eq(crewAds.status, "active"),
    or(eq(crewAds.port, port), eq(crewAds.port, "all")),
    sql`${crewAds.balanceCents} >= ${crewAds.bidCents}`,
    exclude ? ne(crewAds.id, exclude) : undefined,
  )).orderBy(desc(crewAds.bidCents), desc(crewAds.balanceCents)).limit(limit);
}
