import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { leads, leadDeliveries } from "../db/schema";
import { ageTier, type AgeTier } from "../leads/age-tier";
import { leadPrice } from "../billing/pricing";
import type { LeadFilters, LeadPreview } from "./types";

type LeadRow = typeof leads.$inferSelect;

async function ownedLeadIds(customerId: string): Promise<Set<string>> {
  const rows = await db.select({ leadId: leadDeliveries.leadId }).from(leadDeliveries).where(eq(leadDeliveries.customerId, customerId));
  return new Set(rows.map((r) => r.leadId));
}
function tierOf(lead: LeadRow, now: Date): AgeTier {
  return lead.lastUpdated ? ageTier(lead.lastUpdated, now) : "older";
}
function matches(lead: LeadRow, f: LeadFilters, now: Date): boolean {
  if (f.zips && f.zips.length > 0 && (!lead.zip || !f.zips.includes(lead.zip))) return false;
  if (f.segment && lead.segment !== f.segment) return false;
  if (f.score && lead.scoreCategory !== f.score) return false;
  if (f.tier && tierOf(lead, now) !== f.tier) return false;
  return true;
}
async function availableRows(customerId: string, tenantId: string, f: LeadFilters, now: Date): Promise<LeadRow[]> {
  const owned = await ownedLeadIds(customerId);
  const rows = await db.select().from(leads).where(eq(leads.tenantId, tenantId));
  return rows.filter((l) => !owned.has(l.id) && matches(l, f, now));
}

export async function searchAvailableLeads(customerId: string, tenantId: string, filters: LeadFilters, limit = 100, now: Date = new Date()): Promise<LeadPreview[]> {
  const rows = await availableRows(customerId, tenantId, filters, now);
  return rows.slice(0, limit).map((l) => {
    const tier = tierOf(l, now);
    return { leadId: l.id, zip: l.zip, city: l.city, state: l.state, segment: l.segment, scoreCategory: l.scoreCategory, tier, price: leadPrice(tier) };
  });
}
export async function availableCount(customerId: string, tenantId: string, filters: LeadFilters, now: Date = new Date()): Promise<number> {
  return (await availableRows(customerId, tenantId, filters, now)).length;
}
export async function pickAvailableLeads(customerId: string, tenantId: string, filters: LeadFilters, limit: number, now: Date = new Date()): Promise<string[]> {
  const rows = await availableRows(customerId, tenantId, filters, now);
  rows.sort((a, b) => (b.lastUpdated?.getTime() ?? 0) - (a.lastUpdated?.getTime() ?? 0));
  return rows.slice(0, limit).map((l) => l.id);
}
