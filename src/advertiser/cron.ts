/**
 * Phase 2: per-tick maintenance for the advertising marketplace.
 *
 * Called from the box crontab handler (`/api/outreach/tick`) alongside the
 * Phase 1 outreach drain. Two responsibilities:
 *   1. At UTC midnight: reset `today*` counters on every campaign.
 *   2. Every tick: re-activate campaigns that flipped to `out_of_budget`
 *      once their advertiser deposited more credit.
 */
import { eq, sql, and, gte } from "drizzle-orm";
import { db } from "../db/client";
import { advertiserCampaigns, advertisers } from "../db/schema";
import { MIN_CPA_CENTS } from "./wallet";

interface MarketplaceTickResult {
  dailyReset: boolean;
  reactivated: number;
}

let lastResetUtcDay: string | null = null;

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Run once per tick. Returns counts of work performed for logging. */
export async function marketplaceTick(): Promise<MarketplaceTickResult> {
  const now = new Date();
  const today = utcDayKey(now);
  let dailyReset = false;

  // 1) Daily reset of today* counters — fires on the first tick after UTC midnight.
  if (lastResetUtcDay !== today) {
    await db
      .update(advertiserCampaigns)
      .set({
        todaySends: 0,
        todayClicks: 0,
        todaySpendCents: 0,
        updatedAt: new Date(),
      })
      .where(sql`true`);
    lastResetUtcDay = today;
    dailyReset = true;
  }

  // 2) Reactivate out_of_budget campaigns whose advertiser now has enough
  //    balance to cover at least one click at the campaign's CPA.
  //    Done as a single SQL update via a correlated EXISTS.
  const reactivated = await db
    .update(advertiserCampaigns)
    .set({ status: "active", updatedAt: new Date() })
    .where(
      and(
        eq(advertiserCampaigns.status, "out_of_budget"),
        // Wallet balance is the denormalized cache on the advertiser row.
        sql`EXISTS (
          SELECT 1 FROM ${advertisers}
          WHERE ${advertisers.id} = ${advertiserCampaigns.advertiserId}
            AND ${advertisers.walletBalanceCents} >= ${advertiserCampaigns.maxCpaCents}
            AND ${advertisers.status} = 'approved'
        )`,
        gte(advertiserCampaigns.maxCpaCents, MIN_CPA_CENTS),
      ),
    )
    .returning({ id: advertiserCampaigns.id });

  return { dailyReset, reactivated: reactivated.length };
}
