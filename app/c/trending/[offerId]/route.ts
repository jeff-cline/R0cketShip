import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { outreachOffers, tenants, trendingClicks } from "@/src/db/schema";

/**
 * Validate and normalize a CTA URL. Returns a safe absolute URL string
 * (falls back to the provided fallback if the input is missing or invalid).
 * Never throws — clicks must always redirect successfully.
 *
 * Mirrors the helper in app/c/[token]/route.ts. Kept inline here so the two
 * click-tracking routes stay independent.
 */
function safeRedirectTarget(
  raw: string | null | undefined,
  fallback: string,
): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return fallback;
  try {
    const u = new URL(trimmed);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch {
    // fallthrough
  }
  return fallback;
}

export const runtime = "nodejs";

/**
 * Trending-page click dispatcher.
 *
 * GET /c/trending/<offerId>
 *   1. Looks up the outreach offer by id, joined to its tenant.
 *   2. Records one `trending_clicks` row (best-effort — never blocks the
 *      redirect; this is the data foundation for the monetization layer).
 *   3. If the offer is active and the tenant is active, redirects to the
 *      offer's ctaUrl (validated with `safeRedirectTarget`).
 *   4. Otherwise falls back to the tenant's homepage, then to r0cketship.com.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ offerId: string }> },
) {
  const { offerId } = await params;
  const ua = req.headers.get("user-agent");
  const ip = req.headers.get("x-forwarded-for") ?? null;
  const referrer = req.headers.get("referer") ?? null;

  const row = (
    await db
      .select({
        ctaUrl: outreachOffers.ctaUrl,
        active: outreachOffers.active,
        tenantId: outreachOffers.tenantId,
        tenantDomain: tenants.domain,
        tenantStatus: tenants.status,
      })
      .from(outreachOffers)
      .innerJoin(tenants, eq(outreachOffers.tenantId, tenants.id))
      .where(eq(outreachOffers.id, offerId))
      .limit(1)
  )[0];

  // Compute where we're actually going to send the visitor first, then record
  // the attribution row with that target so the analytics row tells the whole
  // story (which offer, which tenant, where the click went).
  let target: string;
  let tenantIdForLog: string | null = null;

  if (!row) {
    target = "https://r0cketship.com/";
  } else {
    tenantIdForLog = row.tenantId;
    const tenantHome = row.tenantDomain
      ? `https://${row.tenantDomain}/`
      : "https://r0cketship.com/";
    if (!row.active || row.tenantStatus !== "active") {
      target = tenantHome;
    } else {
      target = safeRedirectTarget(row.ctaUrl, tenantHome);
    }
  }

  // Fire-and-forget the click row — a DB hiccup must never break the click
  // experience. Errors are swallowed; the row is "lossy by design" the same
  // way a CDN access log is.
  try {
    await db.insert(trendingClicks).values({
      offerId,
      tenantId: tenantIdForLog,
      redirectedTo: target,
      referrer,
      userAgent: ua,
      ip,
    });
  } catch {
    // ignore
  }

  return NextResponse.redirect(target, { status: 302 });
}
