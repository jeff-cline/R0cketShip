/**
 * Offer-box selection — given a configured offer box, pick the actual offers
 * that should fill it on render. Pure read-only against the database; safe to
 * call from server components, route handlers, and admin previews.
 *
 * v1 scoring rules:
 *   - Only `outreachOffers.active = true` and `tenants.status = 'active'` rows
 *     are eligible.
 *   - Blended score = 1.0 for every candidate (placeholder — future versions
 *     can plug in CTR / EPC / freshness signals here without touching callers).
 *   - Tiebreaker: brand alphabetical (title-cased money word) so the output
 *     is deterministic for snapshot copy and email pre-render.
 *
 * Modes (mirror `offerBoxMode` enum in schema):
 *   - main_only      — 1 top offer (any niche)
 *   - by_niche       — up to `maxOffers` pulled from the configured niche list
 *   - niche_plus_n   — 1 niche-hero, then (maxOffers - 1) general offers
 *                      (general pool excludes the hero)
 *   - top_n_all      — top `maxOffers` across the whole network
 */
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { outreachOffers, tenants } from "../db/schema";

export interface BoxOffer {
  kind: "outreach";
  offerId: string;
  tenantId: string;
  tenantDomain: string;
  tenantNiche: string;
  /** Title-cased moneyWord (e.g. "Solar Leads"). Used as the brand label. */
  brand: string;
  logoUrl: string | null;
  title: string;
  description: string;
  ctaUrl: string;
}

export interface OfferBoxConfig {
  id: string;
  mode: "main_only" | "by_niche" | "niche_plus_n" | "top_n_all";
  niches: string[];
  maxOffers: number;
}

interface Candidate extends BoxOffer {
  score: number;
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

async function loadCandidates(filter?: { niches?: string[] }): Promise<Candidate[]> {
  const baseConds = [eq(outreachOffers.active, true), eq(tenants.status, "active")];
  const whereClause =
    filter?.niches && filter.niches.length > 0
      ? and(...baseConds, inArray(tenants.niche, filter.niches))
      : and(...baseConds);

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
      moneyWord: tenants.moneyWord,
    })
    .from(outreachOffers)
    .innerJoin(tenants, eq(outreachOffers.tenantId, tenants.id))
    .where(whereClause);

  const candidates: Candidate[] = rows.map((r) => ({
    kind: "outreach" as const,
    offerId: r.offerId,
    tenantId: r.tenantId,
    tenantDomain: r.tenantDomain,
    tenantNiche: r.tenantNiche,
    brand: titleCase(r.moneyWord ?? r.tenantDomain),
    logoUrl: r.logoUrl,
    title: r.title,
    description: r.description,
    ctaUrl: r.ctaUrl,
    score: 1.0,
  }));

  // Deterministic order: score desc, then brand alpha. With v1 score=1 the
  // brand tiebreaker is what matters — output is stable for HTML snapshots.
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.brand.localeCompare(b.brand);
  });
  return candidates;
}

function strip<T extends BoxOffer & { score: number }>(c: T): BoxOffer {
  // Drop the score before returning — callers don't need it and it isn't part
  // of the public BoxOffer shape.
  const { score: _score, ...rest } = c;
  void _score;
  return rest;
}

export async function selectOffersForBox(box: OfferBoxConfig): Promise<BoxOffer[]> {
  const cap = Math.max(1, Math.min(9, Math.floor(box.maxOffers || 1)));

  if (box.mode === "main_only") {
    const all = await loadCandidates();
    return all.slice(0, 1).map(strip);
  }

  if (box.mode === "by_niche") {
    if (box.niches.length === 0) return [];
    const niched = await loadCandidates({ niches: box.niches });
    return niched.slice(0, cap).map(strip);
  }

  if (box.mode === "niche_plus_n") {
    const heroPool =
      box.niches.length > 0
        ? await loadCandidates({ niches: box.niches })
        : await loadCandidates();
    const hero = heroPool[0];
    if (!hero) return [];

    const rest = await loadCandidates();
    const filler = rest.filter((c) => c.offerId !== hero.offerId).slice(0, Math.max(0, cap - 1));
    return [hero, ...filler].map(strip);
  }

  // top_n_all
  const all = await loadCandidates();
  return all.slice(0, cap).map(strip);
}
