import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { leads } from "../db/schema";
import { ageTier, type AgeTier } from "./age-tier";
import type { Segment } from "./types";

export interface LeadCounts {
  total: number;
  byTier: Record<AgeTier, number>;
  bySegment: Record<Segment, number>;
  topZips: { zip: string; count: number }[];
}

export async function leadCounts(tenantId: string, now: Date = new Date()): Promise<LeadCounts> {
  const all = await db
    .select({ lastUpdated: leads.lastUpdated, segment: leads.segment, zip: leads.zip })
    .from(leads)
    .where(eq(leads.tenantId, tenantId));

  const byTier: Record<AgeTier, number> = { real_time: 0, one_week: 0, thirty_day: 0, older: 0 };
  const bySegment: Record<Segment, number> = { residential: 0, commercial: 0 };
  const zipCounts = new Map<string, number>();

  for (const r of all) {
    byTier[r.lastUpdated ? ageTier(r.lastUpdated, now) : "older"]++;
    bySegment[r.segment]++;
    if (r.zip) zipCounts.set(r.zip, (zipCounts.get(r.zip) ?? 0) + 1);
  }

  const topZips = [...zipCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([zip, count]) => ({ zip, count }));

  return { total: all.length, byTier, bySegment, topZips };
}
