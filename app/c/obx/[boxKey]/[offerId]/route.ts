/**
 * Click tracker for offer-box embeds.
 *
 * GET /c/obx/<boxKey>/<offerId>
 *
 *   1. Resolve the offer box by key (return a soft 302 to /trending if it
 *      doesn't exist or is inactive).
 *   2. Look up the outreach offer + parent tenant; only redirect to the real
 *      CTA if both are active and the cta_url is a valid http(s) URL.
 *   3. Record an `offer_box_clicks` row (referrer, user-agent, ip) so the
 *      admin list page can show 30-day counts and we can monetize.
 *   4. 302 to the destination — never throw; clicks always redirect.
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { offerBoxClicks, offerBoxes, outreachOffers, tenants } from "@/src/db/schema";

export const runtime = "nodejs";

const FALLBACK = "https://r0cketship.com/trending";

function safeRedirectTarget(raw: string | null | undefined, fallback: string): string {
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ boxKey: string; offerId: string }> },
) {
  const { boxKey, offerId } = await params;

  // 1) Resolve the box; if missing/inactive we soft-fallback to trending so
  //    stale embeds still send useful traffic somewhere.
  const box = (
    await db
      .select({ id: offerBoxes.id, active: offerBoxes.active })
      .from(offerBoxes)
      .where(eq(offerBoxes.key, boxKey))
      .limit(1)
  )[0];
  if (!box || !box.active) {
    return NextResponse.redirect(FALLBACK, { status: 302 });
  }

  // 2) Look up the offer + tenant for the redirect target.
  const offer = (
    await db
      .select({
        ctaUrl: outreachOffers.ctaUrl,
        active: outreachOffers.active,
        tenantStatus: tenants.status,
        tenantDomain: tenants.domain,
      })
      .from(outreachOffers)
      .innerJoin(tenants, eq(outreachOffers.tenantId, tenants.id))
      .where(eq(outreachOffers.id, offerId))
      .limit(1)
  )[0];

  // 3) Record the click. We still record clicks on stale offers because the
  //    click *happened* — knowing about it is useful for diagnostics.
  await db.insert(offerBoxClicks).values({
    offerBoxId: box.id,
    offerKind: "outreach",
    offerId,
    referrer: req.headers.get("referer") ?? null,
    userAgent: req.headers.get("user-agent") ?? null,
    ip: req.headers.get("x-forwarded-for") ?? req.headers.get("host") ?? null,
  });

  // 4) Decide redirect target.
  if (!offer || !offer.active || offer.tenantStatus !== "active") {
    return NextResponse.redirect(FALLBACK, { status: 302 });
  }
  const tenantHome = offer.tenantDomain ? `https://${offer.tenantDomain}/` : FALLBACK;
  const target = safeRedirectTarget(offer.ctaUrl, tenantHome);
  return NextResponse.redirect(target, { status: 302 });
}
