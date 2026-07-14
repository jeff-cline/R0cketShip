/**
 * Phase 2: send a test email of an advertiser's campaign creative.
 *
 * Used from /advertise/campaigns/[id] via a server action. Renders the same
 * email an actual recipient would see and ships it through the shared mailbox
 * pool to:
 *   - the advertiser's signup email (so they preview what their ad looks like)
 *   - CC: whatever the `marketplace_cc_founder_email` god toggle resolves to
 *     (default 'jeff.cline@me.com'; empty disables the CC)
 *
 * The CTA URL is the campaign's real CTA (we want the preview to feel real)
 * but the tracking token is a one-off prefixed "test_" so any clicks from the
 * test send do NOT charge the advertiser wallet (see `app/c/[token]/route.ts`).
 */
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import {
  advertiserCampaigns,
  advertisers,
  tenantIntegrations,
  tenants,
} from "../db/schema";
import { sendViaPool } from "../email/mailbox";
import { renderAdvertiserAd } from "./render";
import { brandFromDomain } from "../outreach/render";

const MAILING_ADDRESS =
  process.env.OUTREACH_MAILING_ADDRESS ||
  "R0cketShip · 1209 Mountain Road Pl NE, Albuquerque, NM 87110";

export interface TestSendResult {
  status: "sent" | "failed" | "skipped";
  to?: string;
  cc?: string | null;
  reason?: string;
}

/** Pull the CC-the-founder email from the god toggle row. Returns null when
 *  the toggle is empty (= CC disabled). */
async function loadCcAddress(): Promise<string | null> {
  const rows = await db
    .select({ cc: tenantIntegrations.marketplaceCcFounderEmail })
    .from(tenantIntegrations)
    .innerJoin(tenants, eq(tenants.id, tenantIntegrations.tenantId))
    .where(eq(tenants.domain, "r0cketship.com"))
    .limit(1);
  const raw = rows[0]?.cc?.trim() ?? "";
  return raw.length > 0 ? raw : null;
}

export async function sendCampaignTestEmail(input: {
  campaignId: string;
  /** Owner check — caller passes the advertiser's id; we verify they own it. */
  advertiserId: string;
}): Promise<TestSendResult> {
  const campaign = (
    await db
      .select()
      .from(advertiserCampaigns)
      .where(eq(advertiserCampaigns.id, input.campaignId))
      .limit(1)
  )[0];
  if (!campaign) return { status: "failed", reason: "campaign_not_found" };
  if (campaign.advertiserId !== input.advertiserId) {
    return { status: "failed", reason: "not_owner" };
  }

  const advertiser = (
    await db
      .select()
      .from(advertisers)
      .where(eq(advertisers.id, input.advertiserId))
      .limit(1)
  )[0];
  if (!advertiser) return { status: "failed", reason: "advertiser_not_found" };

  // Find the r0cketship.com tenant for both the pool's "from" identity and
  // the click-tracker base URL.
  const tenant = (
    await db.select({ id: tenants.id, domain: tenants.domain }).from(tenants).where(eq(tenants.domain, "r0cketship.com")).limit(1)
  )[0];
  const baseUrl = `https://${tenant?.domain ?? "r0cketship.com"}`;
  const brand = brandFromDomain(tenant?.domain ?? "r0cketship.com");
  void brand;

  // Test-only tracking token — prefixed so the click handler can skip wallet
  // charges if this test ever generates a click (defense in depth; the token
  // also won't exist in `advertiser_send_events`, so a click would route to
  // the campaign's CTA URL without any charge).
  const trackingToken = `test_${randomBytes(18).toString("base64url")}`;

  const { subject, html } = renderAdvertiserAd({
    campaign: {
      emailSubject: campaign.emailSubject,
      emailBodyHtml: campaign.emailBodyHtml,
      ctaLabel: campaign.ctaLabel,
    },
    baseUrl,
    trackingToken,
    mailingAddress: MAILING_ADDRESS,
  });

  const cc = await loadCcAddress();
  const previewSubject = `[TEST] ${subject}`;
  const previewHtml = `
    <div style="background:#FFF8F0;border-left:4px solid #FF6B35;padding:12px 14px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1a1a1a">
      <strong style="color:#FF6B35">Test preview.</strong> This is exactly what recipients will see when your campaign delivers.
      Tracking is disabled for this test send — clicks will not charge your wallet.
    </div>
    ${html}
  `;

  const result = await sendViaPool(
    tenant?.id ?? "",
    { to: advertiser.email, cc: cc ?? undefined, subject: previewSubject, html: previewHtml },
    "outreach",
  );

  if (result.status === "sent") {
    return { status: "sent", to: advertiser.email, cc };
  }
  if (result.status === "skipped") {
    return { status: "skipped", to: advertiser.email, cc, reason: result.reason ?? "pool_unavailable" };
  }
  return { status: "failed", to: advertiser.email, cc, reason: result.reason ?? "send_failed" };
}
