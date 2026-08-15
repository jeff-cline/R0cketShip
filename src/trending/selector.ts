/**
 * Trending-offer selector.
 *
 * Picks the top offers to show on the public `/trending` page. v1 reads only
 * from `outreach_offers` joined to `tenants` — advertiser ads land in a
 * future iteration alongside per-offer click history.
 *
 * Scoring mirrors the 50/50 expected-value + fairness blend used by
 * `src/advertiser/optimizer.ts`, so behavior is consistent across surfaces.
 * Because v1 has no per-offer performance data, both components default to
 * 1.0 and the final ranking falls back to alphabetical (by domain).
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { outreachOffers, tenants } from "../db/schema";
import { brandFromDomain } from "../outreach/render";

export interface TrendingOffer {
  offerId: string;
  tenantId: string;
  tenantDomain: string;
  tenantNiche: string;
  brand: string; // titleCase moneyWord
  logoUrl: string | null;
  title: string;
  description: string;
  ctaUrl: string;
  // Display-only — for ranking transparency. Computed as
  // expected_value = max_cpa_cents * estimated_click_rate (1% baseline until
  // we have history). For non-advertiser outreach offers, value = 1.
  expectedValue: number;
  fairnessScore: number;
  blendedScore: number;
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns top N offers across the network. Uses the 50/50 revenue + fairness
 * blend logic mirrored from src/advertiser/optimizer.ts. For v1 it pulls
 * from `outreachOffers` only (advertiser ads land in a future iteration).
 */
export async function topOffers(opts?: {
  limit?: number;
  niche?: string;
}): Promise<TrendingOffer[]> {
  const limit = opts?.limit ?? 12;
  const nicheFilter = opts?.niche?.trim().toLowerCase();

  const rows = await db
    .select({
      offerId: outreachOffers.id,
      tenantId: outreachOffers.tenantId,
      logoUrl: outreachOffers.logoUrl,
      title: outreachOffers.title,
      description: outreachOffers.description,
      ctaUrl: outreachOffers.ctaUrl,
      tenantDomain: tenants.domain,
      tenantNiche: tenants.niche,
      tenantMoneyWord: tenants.moneyWord,
    })
    .from(outreachOffers)
    .innerJoin(tenants, eq(outreachOffers.tenantId, tenants.id))
    .where(
      nicheFilter
        ? and(
            eq(outreachOffers.active, true),
            eq(tenants.status, "active"),
            sql`lower(${tenants.niche}) = ${nicheFilter}`,
          )
        : and(eq(outreachOffers.active, true), eq(tenants.status, "active")),
    );

  const scored: TrendingOffer[] = rows.map((r) => {
    // v1: no real performance data — both score components default to 1.0
    // and ranking falls back to alphabetical-by-domain on the tie-break.
    const expectedValue = 1;
    const fairnessScore = 1;
    const blendedScore = 0.5 * expectedValue + 0.5 * fairnessScore;
    return {
      offerId: r.offerId,
      tenantId: r.tenantId,
      tenantDomain: r.tenantDomain,
      tenantNiche: r.tenantNiche,
      brand: r.tenantMoneyWord
        ? titleCase(r.tenantMoneyWord)
        : brandFromDomain(r.tenantDomain),
      logoUrl: r.logoUrl,
      title: r.title,
      description: r.description,
      ctaUrl: r.ctaUrl,
      expectedValue,
      fairnessScore,
      blendedScore,
    };
  });

  scored.sort((a, b) => {
    if (b.blendedScore !== a.blendedScore) return b.blendedScore - a.blendedScore;
    return a.tenantDomain.localeCompare(b.tenantDomain);
  });

  return scored.slice(0, limit);
}
