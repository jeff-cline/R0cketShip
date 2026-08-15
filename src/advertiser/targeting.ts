/**
 * Phase 2 Task 9: targeting filters + reach estimator + per-lead matcher.
 *
 * Targeting is a small DSL with a handful of dimensions:
 *   - zip[]: exact-match list of ZIPs
 *   - segments[]: residential | commercial
 *   - age_tiers[]: real_time | one_week | thirty_day | older (per leads.last_updated)
 *   - niches[]: tenant niche OR moneyWord (case-insensitive)
 *   - income_min / income_max: numeric bands parsed from leads.income_range (e.g. "50k-75k")
 *
 * Reach estimation runs a COUNT(DISTINCT) over the leads table with the filter
 * applied, with a 60-second in-memory cache (per filter-fingerprint) so the
 * UI sliders don't hammer the DB on every keystroke.
 *
 * Lead → eligible-campaigns matching pulls one lead + tenant and runs the
 * filter logic in JS against every advertiser's active campaign that has
 * wallet headroom for at least one CPA charge and isn't dedup'd by a prior send.
 */
import { createHash } from "node:crypto";
import { and, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "../db/client";
import {
  advertiserCampaigns,
  advertiserSendEvents,
  advertisers,
  leads,
  tenants,
} from "../db/schema";
import { ageTier } from "../leads/age-tier";
import type { CampaignRow } from "./campaigns";

export type AgeTier = "real_time" | "one_week" | "thirty_day" | "older";
export type Segment = "residential" | "commercial";

export interface TargetingFilters {
  /** Exact-match ZIP codes. */
  zip?: string[];
  /** Two-letter US state codes (e.g. "CA", "TX"). Matches `leads.state`. */
  states?: string[];
  segments?: Segment[];
  age_tiers?: AgeTier[];
  niches?: string[];
  /** Income gates. Pass 0 (or undefined) to skip. */
  income_min?: number;
  income_max?: number;
}

const VALID_SEGMENTS = new Set<Segment>(["residential", "commercial"]);
const VALID_AGE_TIERS = new Set<AgeTier>(["real_time", "one_week", "thirty_day", "older"]);

/**
 * Defensive shape-parsing. Accept anything; coerce scalars to single-element
 * arrays where appropriate; drop unknown keys; drop empty arrays so they don't
 * accidentally become "WHERE zip IN ()". Returns `{}` if input is garbage.
 */
export function parseTargeting(raw: unknown): TargetingFilters {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const r = raw as Record<string, unknown>;
  const out: TargetingFilters = {};

  const zip = coerceStringArray(r.zip);
  if (zip.length) out.zip = zip;

  const states = coerceStringArray(r.states)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z]{2}$/.test(s));
  if (states.length) out.states = Array.from(new Set(states));

  const segments = coerceStringArray(r.segments)
    .map((s) => s.toLowerCase())
    .filter((s): s is Segment => VALID_SEGMENTS.has(s as Segment));
  if (segments.length) out.segments = Array.from(new Set(segments));

  const tiers = coerceStringArray(r.age_tiers)
    .map((s) => s.toLowerCase())
    .filter((s): s is AgeTier => VALID_AGE_TIERS.has(s as AgeTier));
  if (tiers.length) out.age_tiers = Array.from(new Set(tiers));

  const niches = coerceStringArray(r.niches).map((s) => s.trim()).filter(Boolean);
  if (niches.length) out.niches = Array.from(new Set(niches));

  // Treat 0 or empty as "no filter" so the default UI value doesn't accidentally
  // narrow to leads-with-known-income-≥-0.
  const incMin = coerceNumber(r.income_min);
  if (incMin !== null && incMin > 0) out.income_min = incMin;
  const incMax = coerceNumber(r.income_max);
  if (incMax !== null && incMax > 0) out.income_max = incMax;

  return out;
}

function coerceStringArray(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === "string" && x.length > 0);
  }
  if (typeof v === "string" && v.length > 0) return [v];
  return [];
}

function coerceNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

/**
 * Build a Drizzle SQL WHERE fragment for the targeting filters. Returns
 * `undefined` if no filters are active (caller should not include a WHERE).
 *
 * Age-tier filtering is implemented as a timestamp predicate against
 * `leads.last_updated` relative to the supplied `now` (defaults to current
 * time), so it can be reused inside COUNT queries deterministically.
 *
 * `niches` joins (in caller scope) `tenants` so it can match either
 * `tenants.niche` or `tenants.money_word` case-insensitively.
 *
 * `income_min/max`: the schema stores `income_range` as text like "50k-75k".
 * We extract the lower bound as a heuristic (good enough for v1; follow-on:
 * structured income tier columns in `persons`).
 */
export function targetingToWhereClause(filters: TargetingFilters, now: Date = new Date()): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.zip && filters.zip.length) {
    clauses.push(inArray(leads.zip, filters.zip));
  }

  if (filters.states && filters.states.length) {
    // Match either `leads.state` or `leads.companyState` (uppercased) — covers
    // residential AND commercial rows where state often lives on the company.
    const upper = filters.states.map((s) => s.toUpperCase());
    clauses.push(
      sql`(UPPER(${leads.state}) IN ${upper} OR UPPER(${leads.companyState}) IN ${upper})`,
    );
  }

  if (filters.segments && filters.segments.length) {
    clauses.push(inArray(leads.segment, filters.segments));
  }

  if (filters.age_tiers && filters.age_tiers.length) {
    clauses.push(ageTierClause(filters.age_tiers, now));
  }

  if (filters.niches && filters.niches.length) {
    const lower = filters.niches.map((s) => s.toLowerCase());
    clauses.push(
      sql`(LOWER(${tenants.niche}) IN ${lower} OR LOWER(${tenants.moneyWord}) IN ${lower})`,
    );
  }

  if (filters.income_min !== undefined || filters.income_max !== undefined) {
    // Heuristic income parser. Strip non-digit trailing letters then cast.
    const lowerBound = sql`NULLIF(regexp_replace(split_part(${leads.incomeRange}, '-', 1), '[^0-9]', '', 'g'), '')::int * 1000`;
    if (filters.income_min !== undefined) {
      clauses.push(sql`${lowerBound} >= ${filters.income_min}`);
    }
    if (filters.income_max !== undefined) {
      clauses.push(sql`${lowerBound} <= ${filters.income_max}`);
    }
  }

  if (!clauses.length) return undefined;
  return and(...clauses);
}

function ageTierClause(tiers: AgeTier[], now: Date): SQL {
  const DAY = 86_400_000;
  const nowMs = now.getTime();
  const ors: SQL[] = [];
  for (const tier of tiers) {
    switch (tier) {
      case "real_time":
        ors.push(sql`${leads.lastUpdated} > ${new Date(nowMs - DAY)}`);
        break;
      case "one_week":
        ors.push(
          sql`(${leads.lastUpdated} <= ${new Date(nowMs - DAY)} AND ${leads.lastUpdated} > ${new Date(nowMs - 7 * DAY)})`,
        );
        break;
      case "thirty_day":
        ors.push(
          sql`(${leads.lastUpdated} <= ${new Date(nowMs - 7 * DAY)} AND ${leads.lastUpdated} > ${new Date(nowMs - 30 * DAY)})`,
        );
        break;
      case "older":
        ors.push(sql`(${leads.lastUpdated} IS NULL OR ${leads.lastUpdated} <= ${new Date(nowMs - 30 * DAY)})`);
        break;
    }
  }
  // OR them together. (Drizzle's `or()` mirrors and; using sql template keeps
  // the parenthesization explicit.)
  return sql`(${sql.join(ors, sql` OR `)})`;
}

// ---------------- reach estimator with 60s in-memory cache ----------------

interface ReachCacheEntry { value: number; expiresAt: number }
const reachCache = new Map<string, ReachCacheEntry>();
const CACHE_TTL_MS = 60_000;

/** For tests / cron eviction. */
export function _clearReachCache(): void {
  reachCache.clear();
}

function filterFingerprint(filters: TargetingFilters): string {
  // Stable key ordering so {zip:["1"], segments:["x"]} == {segments:["x"], zip:["1"]}.
  const keys = Object.keys(filters).sort();
  const stable: Record<string, unknown> = {};
  for (const k of keys) {
    const v = (filters as Record<string, unknown>)[k];
    stable[k] = Array.isArray(v) ? [...v].sort() : v;
  }
  return createHash("md5").update(JSON.stringify(stable)).digest("hex");
}

/**
 * Estimate the number of distinct leads matching `filters`. Cached for 60s
 * per filter fingerprint to keep slider UX snappy.
 *
 * NOTE: an empty filter set returns the total lead count (no targeting = blast).
 */
export async function estimateReach(filters: TargetingFilters): Promise<number> {
  const key = filterFingerprint(filters);
  const cached = reachCache.get(key);
  const nowMs = Date.now();
  if (cached && cached.expiresAt > nowMs) return cached.value;

  const where = targetingToWhereClause(filters);
  const needsTenantJoin = !!(filters.niches && filters.niches.length);

  const query = needsTenantJoin
    ? db
        .select({ count: sql<string>`COUNT(DISTINCT ${leads.id})` })
        .from(leads)
        .innerJoin(tenants, eq(tenants.id, leads.tenantId))
    : db.select({ count: sql<string>`COUNT(DISTINCT ${leads.id})` }).from(leads);

  const rows = where ? await query.where(where) : await query;
  const value = Number(rows[0]?.count ?? 0);
  reachCache.set(key, { value, expiresAt: nowMs + CACHE_TTL_MS });
  return value;
}

// ---------------- per-lead campaign picker ----------------

/**
 * Inspect a single lead and return every advertiser campaign that should be
 * eligible to send it ad mail, considering:
 *  - campaign.status === 'active'
 *  - advertiser.wallet_balance_cents >= campaign.max_cpa_cents
 *  - targeting filters match (run in JS against the loaded lead + tenant)
 *  - no prior advertiser_send_events row for (campaign_id, lead_id)
 *  - daily budget (today_spend_cents + max_cpa_cents) <= daily_budget_cents
 */
export async function pickEligibleCampaignsForLead(leadId: string): Promise<CampaignRow[]> {
  const leadRows = await db
    .select({
      id: leads.id,
      tenantId: leads.tenantId,
      zip: leads.zip,
      state: leads.state,
      companyState: leads.companyState,
      segment: leads.segment,
      incomeRange: leads.incomeRange,
      lastUpdated: leads.lastUpdated,
    })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);
  const lead = leadRows[0];
  if (!lead) return [];

  const tenantRows = await db
    .select({ id: tenants.id, niche: tenants.niche, moneyWord: tenants.moneyWord })
    .from(tenants)
    .where(eq(tenants.id, lead.tenantId))
    .limit(1);
  const tenant = tenantRows[0];

  // Pull every active campaign whose advertiser has wallet headroom for a charge.
  const candidates = await db
    .select({
      campaign: advertiserCampaigns,
      walletBalanceCents: advertisers.walletBalanceCents,
    })
    .from(advertiserCampaigns)
    .innerJoin(advertisers, eq(advertisers.id, advertiserCampaigns.advertiserId))
    .where(eq(advertiserCampaigns.status, "active"));

  if (!candidates.length) return [];

  const campaignIds = candidates.map((c) => c.campaign.id);
  // Dedup: which campaigns have already sent to this lead?
  const priorSends = await db
    .select({ campaignId: advertiserSendEvents.campaignId })
    .from(advertiserSendEvents)
    .where(
      and(
        eq(advertiserSendEvents.leadId, leadId),
        inArray(advertiserSendEvents.campaignId, campaignIds),
      ),
    );
  const alreadySent = new Set(priorSends.map((r) => r.campaignId));

  const now = new Date();
  const tier = lead.lastUpdated ? ageTier(lead.lastUpdated, now) : "older";

  const out: CampaignRow[] = [];
  for (const { campaign, walletBalanceCents } of candidates) {
    if (alreadySent.has(campaign.id)) continue;
    if (walletBalanceCents < campaign.maxCpaCents) continue;
    if (
      campaign.dailyBudgetCents != null &&
      campaign.todaySpendCents + campaign.maxCpaCents > campaign.dailyBudgetCents
    ) {
      continue;
    }
    if (!leadMatchesFilters(campaign.targetingFilters as TargetingFilters, {
      zip: lead.zip,
      state: lead.state,
      companyState: lead.companyState,
      segment: lead.segment,
      tier,
      incomeRange: lead.incomeRange,
      tenantNiche: tenant?.niche ?? null,
      tenantMoneyWord: tenant?.moneyWord ?? null,
    })) {
      continue;
    }
    out.push(campaign);
  }
  return out;
}

interface LeadView {
  zip: string | null;
  state: string | null;
  companyState: string | null;
  segment: Segment;
  tier: AgeTier;
  incomeRange: string | null;
  tenantNiche: string | null;
  tenantMoneyWord: string | null;
}

function leadMatchesFilters(rawFilters: TargetingFilters | null | undefined, lead: LeadView): boolean {
  const filters = parseTargeting(rawFilters ?? {});
  if (filters.zip && filters.zip.length && (!lead.zip || !filters.zip.includes(lead.zip))) return false;
  if (filters.states && filters.states.length) {
    const upper = filters.states.map((s) => s.toUpperCase());
    const leadStates = [lead.state, lead.companyState].filter(Boolean).map((s) => (s as string).toUpperCase());
    if (!leadStates.some((s) => upper.includes(s))) return false;
  }
  if (filters.segments && filters.segments.length && !filters.segments.includes(lead.segment)) return false;
  if (filters.age_tiers && filters.age_tiers.length && !filters.age_tiers.includes(lead.tier)) return false;
  if (filters.niches && filters.niches.length) {
    const wanted = filters.niches.map((s) => s.toLowerCase());
    const have = [lead.tenantNiche, lead.tenantMoneyWord].filter(Boolean).map((s) => (s as string).toLowerCase());
    if (!have.some((h) => wanted.includes(h))) return false;
  }
  if (filters.income_min !== undefined || filters.income_max !== undefined) {
    const parsed = parseIncomeRangeLower(lead.incomeRange);
    if (parsed === null) return false;
    if (filters.income_min !== undefined && parsed < filters.income_min) return false;
    if (filters.income_max !== undefined && parsed > filters.income_max) return false;
  }
  return true;
}

/**
 * Parse the lower bound out of a text income_range like "50k-75k" → 50_000.
 * Returns null if unparseable. Follow-on: structured income columns.
 */
export function parseIncomeRangeLower(range: string | null | undefined): number | null {
  if (!range) return null;
  const head = range.split("-")[0] ?? "";
  const digits = head.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const k = /k/i.test(head) ? 1000 : 1;
  const n = Number(digits) * k;
  return Number.isFinite(n) ? n : null;
}
