import { describe, it, expect, beforeEach } from "vitest";
import { db, pool } from "@/src/db/client";
import {
  advertiserCampaigns,
  advertiserSendEvents,
  advertisers,
  leads,
  persons,
  tenants,
} from "@/src/db/schema";
import {
  parseTargeting,
  estimateReach,
  pickEligibleCampaignsForLead,
  parseIncomeRangeLower,
  _clearReachCache,
} from "@/src/advertiser/targeting";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };

async function cleanAll(): Promise<void> {
  // Tear down everything we touch. tests/setup.ts handles core tables but not
  // the advertiser tables, so this is the union.
  await pool.query("TRUNCATE TABLE advertiser_send_events, advertiser_click_events, advertiser_ledger, advertiser_payments, advertiser_intake, advertiser_sessions, advertiser_referrals, advertiser_referral_payouts, advertiser_campaigns, advertisers, leads, persons, tenants RESTART IDENTITY CASCADE");
  _clearReachCache();
}

async function makeTenant(opts: { domain: string; niche: string; moneyWord?: string }): Promise<string> {
  const [t] = await db.insert(tenants).values({
    domain: opts.domain,
    niche: opts.niche,
    moneyWord: opts.moneyWord ?? opts.niche,
    theme,
    offers: [],
    monthlyPriceDefault: "1500",
  }).returning({ id: tenants.id });
  return t.id;
}

async function makeLead(opts: {
  tenantId: string;
  zip?: string;
  segment?: "residential" | "commercial";
  incomeRange?: string;
  lastUpdated?: Date;
  shaSeed?: string;
}): Promise<string> {
  const sha = opts.shaSeed ?? `sha-${Math.random().toString(36).slice(2, 12)}`;
  const [p] = await db.insert(persons).values({ shaLcHem: sha }).returning({ id: persons.id });
  const [l] = await db.insert(leads).values({
    tenantId: opts.tenantId,
    personId: p.id,
    shaLcHem: sha,
    segment: opts.segment ?? "residential",
    source: "upload",
    zip: opts.zip ?? null,
    incomeRange: opts.incomeRange ?? null,
    lastUpdated: opts.lastUpdated ?? null,
  }).returning({ id: leads.id });
  return l.id;
}

async function makeAdvertiser(opts: {
  email?: string;
  walletBalanceCents?: number;
} = {}): Promise<string> {
  const [a] = await db.insert(advertisers).values({
    email: opts.email ?? `adv-${Math.random().toString(36).slice(2, 10)}@x.com`,
    passwordHash: "x",
    status: "approved",
    walletBalanceCents: opts.walletBalanceCents ?? 10_000,
  }).returning({ id: advertisers.id });
  return a.id;
}

async function makeCampaign(opts: {
  advertiserId: string;
  status?: "active" | "paused" | "pending";
  maxCpaCents?: number;
  dailyBudgetCents?: number | null;
  todaySpendCents?: number;
  targetingFilters?: Record<string, unknown>;
}): Promise<string> {
  const [c] = await db.insert(advertiserCampaigns).values({
    advertiserId: opts.advertiserId,
    name: "Campaign",
    status: opts.status ?? "active",
    emailSubject: "s",
    emailBodyHtml: "<p>x</p>",
    ctaUrl: "https://example.com",
    maxCpaCents: opts.maxCpaCents ?? 500,
    dailyBudgetCents: opts.dailyBudgetCents ?? null,
    todaySpendCents: opts.todaySpendCents ?? 0,
    targetingFilters: opts.targetingFilters ?? {},
  }).returning({ id: advertiserCampaigns.id });
  return c.id;
}

describe("parseTargeting", () => {
  it("strips unknown keys", () => {
    expect(parseTargeting({ zip: ["1"], evilKey: "x", more: 42 } as unknown)).toEqual({ zip: ["1"] });
  });
  it("returns {} for garbage / non-objects", () => {
    expect(parseTargeting(null)).toEqual({});
    expect(parseTargeting(undefined)).toEqual({});
    expect(parseTargeting(42)).toEqual({});
    expect(parseTargeting("string")).toEqual({});
    expect(parseTargeting([1, 2, 3])).toEqual({});
  });
  it("coerces a scalar string into a single-element array (zip)", () => {
    expect(parseTargeting({ zip: "30265" })).toEqual({ zip: ["30265"] });
  });
  it("drops empty arrays so they don't become WHERE IN ()", () => {
    expect(parseTargeting({ zip: [], segments: [] })).toEqual({});
  });
  it("filters invalid segment / age_tier values, lowercases inputs", () => {
    expect(parseTargeting({ segments: ["RESIDENTIAL", "bogus", "commercial"] })).toEqual({
      segments: ["residential", "commercial"],
    });
    expect(parseTargeting({ age_tiers: ["real_time", "nope"] })).toEqual({
      age_tiers: ["real_time"],
    });
  });
  it("dedups niche arrays", () => {
    expect(parseTargeting({ niches: ["roofing", "roofing", "solar"] })).toEqual({
      niches: ["roofing", "solar"],
    });
  });
  it("coerces numeric strings for income bounds", () => {
    expect(parseTargeting({ income_min: "50000", income_max: 100000 })).toEqual({
      income_min: 50000,
      income_max: 100000,
    });
  });
});

describe("parseIncomeRangeLower", () => {
  it("parses '50k-75k' as 50000", () => {
    expect(parseIncomeRangeLower("50k-75k")).toBe(50_000);
  });
  it("parses raw numbers '50000-75000' as 50000", () => {
    expect(parseIncomeRangeLower("50000-75000")).toBe(50_000);
  });
  it("returns null for unparseable input", () => {
    expect(parseIncomeRangeLower(null)).toBeNull();
    expect(parseIncomeRangeLower("")).toBeNull();
    expect(parseIncomeRangeLower("unknown")).toBeNull();
  });
});

describe("estimateReach", () => {
  beforeEach(async () => {
    await cleanAll();
  });

  it("counts distinct leads matching a zip filter, and caches within 60s", async () => {
    const tA = await makeTenant({ domain: "roofers.co", niche: "roofing" });
    await makeLead({ tenantId: tA, zip: "30265", shaSeed: "s1" });
    await makeLead({ tenantId: tA, zip: "30265", shaSeed: "s2" });
    await makeLead({ tenantId: tA, zip: "90210", shaSeed: "s3" });

    const first = await estimateReach({ zip: ["30265"] });
    expect(first).toBe(2);

    // Mutate the underlying data — the cache must still hand back 2 within the
    // TTL window. (Don't clear the cache; that's the whole point.)
    await makeLead({ tenantId: tA, zip: "30265", shaSeed: "s4" });
    const cached = await estimateReach({ zip: ["30265"] });
    expect(cached).toBe(2);

    // After clearing, we should see the live count.
    _clearReachCache();
    const live = await estimateReach({ zip: ["30265"] });
    expect(live).toBe(3);
  });

  it("filters by segment + niche (joining tenants)", async () => {
    const roofers = await makeTenant({ domain: "roofers.co", niche: "roofing" });
    const solar = await makeTenant({ domain: "solar.co", niche: "solar" });
    await makeLead({ tenantId: roofers, segment: "residential", shaSeed: "a" });
    await makeLead({ tenantId: roofers, segment: "commercial", shaSeed: "b" });
    await makeLead({ tenantId: solar, segment: "residential", shaSeed: "c" });

    expect(await estimateReach({ niches: ["roofing"], segments: ["residential"] })).toBe(1);
    _clearReachCache();
    expect(await estimateReach({ niches: ["solar"] })).toBe(1);
  });
});

describe("pickEligibleCampaignsForLead", () => {
  beforeEach(async () => {
    await cleanAll();
  });

  it("returns active matching campaigns and skips paused ones", async () => {
    const tA = await makeTenant({ domain: "roofers.co", niche: "roofing" });
    const leadId = await makeLead({ tenantId: tA, zip: "30265" });
    const advA = await makeAdvertiser({ walletBalanceCents: 10_000 });
    const advB = await makeAdvertiser({ email: "p@x.com", walletBalanceCents: 10_000 });
    const cActive = await makeCampaign({ advertiserId: advA, status: "active" });
    await makeCampaign({ advertiserId: advB, status: "paused" });

    const eligible = await pickEligibleCampaignsForLead(leadId);
    expect(eligible.map((c) => c.id)).toEqual([cActive]);
  });

  it("skips campaigns whose advertiser wallet can't cover the CPA", async () => {
    const tA = await makeTenant({ domain: "roofers.co", niche: "roofing" });
    const leadId = await makeLead({ tenantId: tA, zip: "30265" });
    const broke = await makeAdvertiser({ walletBalanceCents: 100 }); // < 500
    const rich = await makeAdvertiser({ email: "r@x.com", walletBalanceCents: 10_000 });
    await makeCampaign({ advertiserId: broke, status: "active", maxCpaCents: 500 });
    const cOk = await makeCampaign({ advertiserId: rich, status: "active", maxCpaCents: 500 });

    const eligible = await pickEligibleCampaignsForLead(leadId);
    expect(eligible.map((c) => c.id)).toEqual([cOk]);
  });

  it("dedups campaigns that already sent to this lead", async () => {
    const tA = await makeTenant({ domain: "roofers.co", niche: "roofing" });
    const leadId = await makeLead({ tenantId: tA, zip: "30265" });
    const advA = await makeAdvertiser();
    const advB = await makeAdvertiser({ email: "b@x.com" });
    const sentAlready = await makeCampaign({ advertiserId: advA, status: "active" });
    const fresh = await makeCampaign({ advertiserId: advB, status: "active" });

    await db.insert(advertiserSendEvents).values({
      campaignId: sentAlready,
      leadId,
      trackingToken: `tok-${Math.random()}`,
    });

    const eligible = await pickEligibleCampaignsForLead(leadId);
    expect(eligible.map((c) => c.id)).toEqual([fresh]);
  });

  it("skips a campaign whose daily budget would be blown by one more charge", async () => {
    const tA = await makeTenant({ domain: "roofers.co", niche: "roofing" });
    const leadId = await makeLead({ tenantId: tA, zip: "30265" });
    const advTight = await makeAdvertiser({ walletBalanceCents: 10_000 });
    const advHeadroom = await makeAdvertiser({ email: "h@x.com", walletBalanceCents: 10_000 });

    // 1000-cent budget, 600 spent today, 500 CPA → 1100 > 1000 → blocked.
    await makeCampaign({
      advertiserId: advTight,
      status: "active",
      maxCpaCents: 500,
      dailyBudgetCents: 1000,
      todaySpendCents: 600,
    });
    // No daily budget cap → always allowed.
    const allowed = await makeCampaign({
      advertiserId: advHeadroom,
      status: "active",
      maxCpaCents: 500,
      dailyBudgetCents: null,
    });

    const eligible = await pickEligibleCampaignsForLead(leadId);
    expect(eligible.map((c) => c.id)).toEqual([allowed]);
  });

  it("respects zip targeting filter", async () => {
    const tA = await makeTenant({ domain: "roofers.co", niche: "roofing" });
    const leadId = await makeLead({ tenantId: tA, zip: "30265" });
    const advA = await makeAdvertiser();
    const matches = await makeCampaign({
      advertiserId: advA,
      status: "active",
      targetingFilters: { zip: ["30265"] },
    });
    const advB = await makeAdvertiser({ email: "b@x.com" });
    await makeCampaign({
      advertiserId: advB,
      status: "active",
      targetingFilters: { zip: ["90210"] },
    });

    const eligible = await pickEligibleCampaignsForLead(leadId);
    expect(eligible.map((c) => c.id)).toEqual([matches]);
  });

  it("returns [] when the lead doesn't exist", async () => {
    const eligible = await pickEligibleCampaignsForLead("00000000-0000-0000-0000-000000000000");
    expect(eligible).toEqual([]);
  });
});
