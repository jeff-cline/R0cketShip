import { eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { leads, leadDeliveries, calls } from "../db/schema";
import { ageTier, type AgeTier } from "../leads/age-tier";
import { predictiveScore } from "./scoring";

/** Persons (by hash) with a booked/sold delivery OR a booked/sold call in ANY tenant. */
export async function convertedHashes(): Promise<Set<string>> {
  const dels = await db.select({ leadId: leadDeliveries.leadId }).from(leadDeliveries).where(inArray(leadDeliveries.status, ["booked", "sold"]));
  const callRows = await db.select({ leadId: calls.leadId }).from(calls).where(inArray(calls.disposition, ["booked", "sold"]));
  const leadIds = [...new Set([...dels.map((d) => d.leadId), ...callRows.map((c) => c.leadId)])];
  if (leadIds.length === 0) return new Set();
  const hashRows = await db.select({ sha: leads.shaLcHem }).from(leads).where(inArray(leads.id, leadIds));
  return new Set(hashRows.map((r) => r.sha));
}

export async function personFootprint(shaLcHem: string) {
  return db.select().from(leads).where(eq(leads.shaLcHem, shaLcHem));
}

export async function globalLeadCounts(now: Date = new Date()) {
  const all = await db.select({ sha: leads.shaLcHem, tenantId: leads.tenantId, lastUpdated: leads.lastUpdated, segment: leads.segment, zip: leads.zip }).from(leads);
  const byTier: Record<AgeTier, number> = { real_time: 0, one_week: 0, thirty_day: 0, older: 0 };
  const bySegment = { residential: 0, commercial: 0 };
  const zipCounts = new Map<string, number>();
  const personTenants = new Map<string, Set<string>>();
  for (const r of all) {
    byTier[r.lastUpdated ? ageTier(r.lastUpdated, now) : "older"]++;
    bySegment[r.segment]++;
    if (r.zip) zipCounts.set(r.zip, (zipCounts.get(r.zip) ?? 0) + 1);
    if (!personTenants.has(r.sha)) personTenants.set(r.sha, new Set());
    personTenants.get(r.sha)!.add(r.tenantId);
  }
  const crossSitePersons = [...personTenants.values()].filter((s) => s.size >= 2).length;
  const topZips = [...zipCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([zip, count]) => ({ zip, count }));
  return { totalLeads: all.length, distinctPersons: personTenants.size, crossSitePersons, byTier, bySegment, topZips };
}

export async function predictiveLeads(tenantId: string, limit = 25, now: Date = new Date()) {
  const converted = await convertedHashes();
  const rows = await db.select().from(leads).where(eq(leads.tenantId, tenantId));
  const scored = rows.map((l) => {
    const tier = l.lastUpdated ? ageTier(l.lastUpdated, now) : "older";
    const convertedElsewhere = converted.has(l.shaLcHem);
    return {
      leadId: l.id, zip: l.zip, tier, scoreCategory: l.scoreCategory, convertedElsewhere,
      score: predictiveScore({ scoreCategory: l.scoreCategory, convertedElsewhere, ageTier: tier, hasCompany: !!l.companyName }),
    };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
