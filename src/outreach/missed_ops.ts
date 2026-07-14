/**
 * Missed-opportunity logging.
 *
 * Any tracked click that can't be routed cleanly to a real CTA target lands
 * here, with the source reason classified. White-labels see this as a "you're
 * leaving money on the table — fund/activate your offer" nudge in their admin.
 * The fallback redirect lands the user on the god-configured `/trending`
 * lander so we still monetize the click.
 */
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { missedOpportunities, tenantIntegrations, tenants } from "../db/schema";

const DEFAULT_FALLBACK = "https://r0cketship.com/trending";

let _cachedLander: { url: string; expiresAt: number } | null = null;
const LANDER_TTL_MS = 30_000;

/** Read the god-configured "missed clicks default lander" with a 30s cache.
 *  Falls back to https://r0cketship.com/trending if no row exists yet. */
export async function getDefaultLander(): Promise<string> {
  if (_cachedLander && _cachedLander.expiresAt > Date.now()) {
    return _cachedLander.url;
  }
  const rows = await db
    .select({ url: tenantIntegrations.marketplaceDefaultLander })
    .from(tenantIntegrations)
    .innerJoin(tenants, eq(tenants.id, tenantIntegrations.tenantId))
    .where(eq(tenants.domain, "r0cketship.com"))
    .limit(1);
  const url = rows[0]?.url?.trim() || DEFAULT_FALLBACK;
  _cachedLander = { url, expiresAt: Date.now() + LANDER_TTL_MS };
  return url;
}

export function invalidateLanderCache(): void {
  _cachedLander = null;
}

export type MissedSource =
  | "invalid_cta_url"
  | "offer_inactive"
  | "no_offer"
  | "tenant_frozen"
  | "out_of_budget"
  | "expired_token"
  | "unknown_token";

export async function logMissedOpp(input: {
  tenantId: string | null;
  source: MissedSource;
  sourceToken?: string | null;
  redirectedTo: string;
  userAgent?: string | null;
  ip?: string | null;
  referrer?: string | null;
}): Promise<void> {
  try {
    await db.insert(missedOpportunities).values({
      tenantId: input.tenantId,
      source: input.source,
      sourceToken: input.sourceToken ?? null,
      redirectedTo: input.redirectedTo,
      userAgent: input.userAgent ?? null,
      ip: input.ip ?? null,
      referrer: input.referrer ?? null,
    });
  } catch {
    // Best-effort logging — never block a click redirect on a write failure.
  }
}
