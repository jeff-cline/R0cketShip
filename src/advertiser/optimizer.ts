/**
 * Phase 2: minimal v1 optimizer.
 *
 * Heuristic only — the real eCPM bandit lands in Phase 4. This v1 does:
 *   1. Build the eligible advertiser campaign set for a given lead.
 *   2. Score each on (a) expected value = CPA × estimatedClickRate, and
 *      (b) fairness = 1 / (1 + sendsToday).
 *   3. Pick weighted-random with a 50/50 blend so even low-score ads get
 *      occasional exploration.
 *
 * The actual "send" is performed by `sendAdToLead` which records the
 * `advertiser_send_events` row and pushes the email through the shared
 * mailbox pool.
 */
import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import {
  advertiserCampaigns,
  advertiserSendEvents,
  leads,
  tenants,
} from "../db/schema";
import { pickEligibleCampaignsForLead } from "./targeting";
import { sendViaPool } from "../email/mailbox";
import { isSuppressed } from "../outreach/verify";
import { brandFromDomain } from "../outreach/render";
import { renderAdvertiserAd } from "./render";

const MAILING_ADDRESS =
  process.env.OUTREACH_MAILING_ADDRESS ||
  "R0cketShip · 1209 Mountain Road Pl NE, Albuquerque, NM 87110";

const BASELINE_CLICK_RATE = 0.01;
const HISTORICAL_MINIMUM_SENDS = 100;

export interface ScoredCampaign {
  campaignId: string;
  advertiserId: string;
  maxCpaCents: number;
  emailSubject: string;
  emailBodyHtml: string;
  ctaLabel: string;
  expectedValue: number;
  fairnessScore: number;
  blendedScore: number;
}

function normalize(values: number[]): number[] {
  const max = Math.max(...values, 0);
  if (max === 0) return values.map(() => 0);
  return values.map((v) => v / max);
}

/** Returns one campaign from the eligible set chosen by weighted-random over
 *  the blended score. Returns null when no campaigns are eligible. */
export async function pickAdForLead(leadId: string): Promise<ScoredCampaign | null> {
  const eligible = await pickEligibleCampaignsForLead(leadId);
  if (eligible.length === 0) return null;

  const evRaw = eligible.map((c) => {
    const rate =
      c.totalSends >= HISTORICAL_MINIMUM_SENDS
        ? c.totalClicks / c.totalSends
        : BASELINE_CLICK_RATE;
    return c.maxCpaCents * rate;
  });
  const fairnessRaw = eligible.map((c) => 1 / (1 + c.todaySends));
  const ev = normalize(evRaw);
  const fair = normalize(fairnessRaw);
  const blended = ev.map((e, i) => 0.5 * e + 0.5 * (fair[i] ?? 0));

  // Weighted-random selection over blended scores.
  const total = blended.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  let pickedIndex = 0;
  for (let i = 0; i < blended.length; i++) {
    const score = blended[i] ?? 0;
    if (r < score) {
      pickedIndex = i;
      break;
    }
    r -= score;
  }
  const picked = eligible[pickedIndex];
  if (!picked) return null;
  return {
    campaignId: picked.id,
    advertiserId: picked.advertiserId,
    maxCpaCents: picked.maxCpaCents,
    emailSubject: picked.emailSubject,
    emailBodyHtml: picked.emailBodyHtml,
    ctaLabel: picked.ctaLabel,
    expectedValue: evRaw[pickedIndex] ?? 0,
    fairnessScore: fairnessRaw[pickedIndex] ?? 0,
    blendedScore: blended[pickedIndex] ?? 0,
  };
}

/** Send a chosen ad to a chosen lead. Idempotent on (campaign, lead) — the
 *  send_events unique index prevents double-sends. */
export async function sendAdToLead(input: {
  campaignId: string;
  leadId: string;
}): Promise<{ status: "sent" | "skipped" | "failed"; reason?: string }> {
  const lead = (
    await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1)
  )[0];
  if (!lead) return { status: "failed", reason: "lead_not_found" };

  const campaign = (
    await db
      .select()
      .from(advertiserCampaigns)
      .where(eq(advertiserCampaigns.id, input.campaignId))
      .limit(1)
  )[0];
  if (!campaign) return { status: "failed", reason: "campaign_not_found" };
  if (campaign.status !== "active") return { status: "skipped", reason: "not_active" };

  // Find a deliverable email on the lead.
  const toAddr = (() => {
    if (Array.isArray(lead.emails) && lead.emails.length > 0) {
      const first = lead.emails[0]?.trim();
      if (first) return first.toLowerCase();
    }
    if (lead.businessEmail) return lead.businessEmail.toLowerCase();
    return null;
  })();
  if (!toAddr) return { status: "skipped", reason: "no_email" };
  if (await isSuppressed(toAddr)) return { status: "skipped", reason: "suppressed" };

  const trackingToken = randomBytes(24).toString("base64url");

  // Insert send event up front so the unique index blocks any concurrent
  // duplicate. If the insert fails on conflict, we've already sent — bail.
  let sendEventId: string | undefined;
  try {
    const inserted = await db
      .insert(advertiserSendEvents)
      .values({
        campaignId: campaign.id,
        leadId: lead.id,
        trackingToken,
      })
      .returning({ id: advertiserSendEvents.id });
    sendEventId = inserted[0]?.id;
  } catch {
    return { status: "skipped", reason: "already_sent" };
  }
  if (!sendEventId) return { status: "failed", reason: "send_event_insert" };

  // Tenant context for the From: domain + tracked CTA base URL.
  const tenant = (
    await db.select({ domain: tenants.domain }).from(tenants).where(eq(tenants.id, lead.tenantId)).limit(1)
  )[0];
  const domain = tenant?.domain ?? "r0cketship.com";
  const brand = brandFromDomain(domain);
  const baseUrl = `https://${domain}`;

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

  const result = await sendViaPool(lead.tenantId, { to: toAddr, subject, html }, "outreach");
  if (result.status === "sent") {
    await db
      .update(advertiserSendEvents)
      .set({ mailboxId: result.mailboxId, sentAt: new Date() })
      .where(eq(advertiserSendEvents.id, sendEventId));
    await db
      .update(advertiserCampaigns)
      .set({
        totalSends: sql`${advertiserCampaigns.totalSends} + 1`,
        todaySends: sql`${advertiserCampaigns.todaySends} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(advertiserCampaigns.id, campaign.id));
    return { status: "sent" };
  }
  // Roll back the send_events row if we couldn't actually send — otherwise
  // we'd block future retries via the unique index.
  await db.delete(advertiserSendEvents).where(eq(advertiserSendEvents.id, sendEventId));
  if (result.status === "skipped") return { status: "skipped", reason: result.reason ?? "pool_unavailable" };
  return { status: "failed", reason: result.reason ?? "send_failed" };
  // Note: brand variable retained for future use in subject templating.
  void brand;
}
