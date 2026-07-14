import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/src/db/client";
import {
  outreachQueue,
  advertiserSendEvents,
  advertiserCampaigns,
  advertiserClickEvents,
  tenants,
} from "@/src/db/schema";
import { getOutreachOffer } from "@/src/outreach/offers";
import { chargeForClick, MIN_CPA_CENTS } from "@/src/advertiser/wallet";
import { creditReferralForClick } from "@/src/advertiser/referrals";
import { getDefaultLander, logMissedOpp } from "@/src/outreach/missed_ops";

/** Validate and normalize a CTA URL. Returns either the normalized URL or null
 *  so the caller can decide how to handle the failure (log a missed
 *  opportunity, redirect to the configured fallback, etc.). */
function validateRedirectTarget(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch {
    // fallthrough
  }
  return null;
}

export const runtime = "nodejs";

/**
 * Tracked CTA dispatcher. Tries the Phase 1 (tenant outreach) token namespace
 * first; if not found, falls through to Phase 2 (advertiser ad) tokens.
 *
 * For advertiser tokens we additionally:
 *   - record a click event with the charge amount (= campaign.max_cpa_cents)
 *   - debit the advertiser wallet (idempotent; never below zero)
 *   - bump campaign stats
 *   - flip out-of-budget campaigns when the wallet drops past the floor
 *   - trigger referral payout to whoever brought the advertiser in
 *
 * Either way, we 302 to the relevant ctaUrl.
 */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ua = req.headers.get("user-agent");
  const ip = req.headers.get("x-forwarded-for") ?? null;
  const referrer = req.headers.get("referer") ?? null;

  // 1) Phase 1 — tenant outreach token
  const tenantHit = (
    await db.select().from(outreachQueue).where(eq(outreachQueue.clickToken, token)).limit(1)
  )[0];
  if (tenantHit) {
    await db
      .update(outreachQueue)
      .set({
        clicks: sql`${outreachQueue.clicks} + 1`,
        clickedAt: tenantHit.clickedAt ?? new Date(),
      })
      .where(eq(outreachQueue.id, tenantHit.id));

    const offer = await getOutreachOffer(tenantHit.tenantId);
    const validatedTarget = validateRedirectTarget(offer?.ctaUrl);
    if (validatedTarget && offer?.active) {
      return NextResponse.redirect(validatedTarget, { status: 302 });
    }

    // Couldn't route cleanly — log the missed opportunity and send them to
    // the god-configured fallback lander (default: /trending) so we still
    // monetize the click.
    const fallback = await getDefaultLander();
    let source: "invalid_cta_url" | "offer_inactive" | "no_offer";
    if (!offer) source = "no_offer";
    else if (!offer.active) source = "offer_inactive";
    else source = "invalid_cta_url";
    await logMissedOpp({
      tenantId: tenantHit.tenantId,
      source,
      sourceToken: token,
      redirectedTo: fallback,
      userAgent: ua,
      ip,
      referrer,
    });
    return NextResponse.redirect(fallback, { status: 302 });
  }

  // 2) Phase 2 — advertiser ad token
  const adHit = (
    await db
      .select()
      .from(advertiserSendEvents)
      .where(eq(advertiserSendEvents.trackingToken, token))
      .limit(1)
  )[0];
  if (!adHit) {
    // Unknown token — log a missed opportunity (no tenant attribution) and
    // route to the default lander.
    const fallback = await getDefaultLander();
    await logMissedOpp({
      tenantId: null,
      source: "unknown_token",
      sourceToken: token,
      redirectedTo: fallback,
      userAgent: ua,
      ip,
      referrer,
    });
    return NextResponse.redirect(fallback, { status: 302 });
  }

  const campaign = (
    await db
      .select()
      .from(advertiserCampaigns)
      .where(eq(advertiserCampaigns.id, adHit.campaignId))
      .limit(1)
  )[0];
  if (!campaign) return NextResponse.redirect("https://r0cketship.com/", { status: 302 });

  // Insert click event (the charge_cents we plan to take is the campaign's
  // CPA; the actual debit may be smaller if the wallet is below CPA — wallet
  // module clamps charge to balance and we keep recording the click).
  const inserted = await db
    .insert(advertiserClickEvents)
    .values({
      sendEventId: adHit.id,
      campaignId: campaign.id,
      chargeCents: campaign.maxCpaCents,
      userAgent: req.headers.get("user-agent") ?? null,
      ip: req.headers.get("x-forwarded-for") ?? req.headers.get("host") ?? null,
    })
    .returning({ id: advertiserClickEvents.id });
  const clickId = inserted[0]?.id;

  const charge = await chargeForClick({
    advertiserId: campaign.advertiserId,
    campaignId: campaign.id,
    clickId: clickId ?? token,
    amountCents: campaign.maxCpaCents,
  });

  // Update campaign stats — sends/clicks/spend trackers (denormalized).
  await db
    .update(advertiserCampaigns)
    .set({
      totalClicks: sql`${advertiserCampaigns.totalClicks} + 1`,
      todayClicks: sql`${advertiserCampaigns.todayClicks} + 1`,
      totalSpendCents: sql`${advertiserCampaigns.totalSpendCents} + ${charge.actualChargeCents}`,
      todaySpendCents: sql`${advertiserCampaigns.todaySpendCents} + ${charge.actualChargeCents}`,
      updatedAt: new Date(),
    })
    .where(eq(advertiserCampaigns.id, campaign.id));

  // Out-of-budget transition: if the wallet just crossed below the $5 floor,
  // mark this campaign (and any other actives belonging to the same advertiser)
  // as out_of_budget so the optimizer stops selecting them.
  if (charge.balance < MIN_CPA_CENTS && campaign.status === "active") {
    await db
      .update(advertiserCampaigns)
      .set({ status: "out_of_budget", updatedAt: new Date() })
      .where(eq(advertiserCampaigns.advertiserId, campaign.advertiserId));
  }

  // Referral payout (15% × 12mo window). Fires only when an active referral
  // exists for this advertiser; otherwise no-op.
  if (clickId && charge.actualChargeCents > 0) {
    await creditReferralForClick({
      advertiserId: campaign.advertiserId,
      clickId,
      chargeCents: charge.actualChargeCents,
    }).catch(() => {
      // Don't fail the click redirect on referral bookkeeping issues — log and continue.
    });
  }

  // Defense in depth for advertiser ads too — same URL guard.
  const adTarget = validateRedirectTarget(campaign.ctaUrl);
  if (adTarget) {
    return NextResponse.redirect(adTarget, { status: 302 });
  }
  const fallback = await getDefaultLander();
  await logMissedOpp({
    tenantId: null,
    source: "invalid_cta_url",
    sourceToken: token,
    redirectedTo: fallback,
    userAgent: req.headers.get("user-agent"),
    ip: req.headers.get("x-forwarded-for"),
    referrer: req.headers.get("referer"),
  });
  return NextResponse.redirect(fallback, { status: 302 });
}
