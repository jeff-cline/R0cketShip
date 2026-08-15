import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { db } from "../db/client";
import { leads, outreachQueue } from "../db/schema";
import { getOutreachOffer } from "./offers";
import { leadEmail, validSyntax, hasMx, isSuppressed } from "./verify";

const DAY = 24 * 60 * 60 * 1000;
export const DRIP_WINDOW_MS = 5 * DAY; // spread sends across 5 days …
export const DRIP_DEADLINE_MS = 7 * DAY; // … so the batch always clears inside 7.

/**
 * Evenly spaced send times across [startMs, startMs + windowMs].
 * n=1 → [startMs]; n≥2 → first at start, last at start+window.
 */
export function spreadSchedule(n: number, startMs: number, windowMs: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [startMs];
  const step = windowMs / (n - 1);
  return Array.from({ length: n }, (_, i) => Math.round(startMs + i * step));
}

export interface EnqueueResult {
  queued: number;
  skippedNoOffer: boolean;
  skippedNoEmail: number;
  skippedSuppressed: number;
  skippedBadAddress: number;
  skippedDuplicate: number;
}

/**
 * Queue outreach for newly-ingested leads of a white-label. One email per lead,
 * dripped across the window. Skips leads with no/invalid/suppressed address.
 * Idempotent: a (tenant, lead) already queued is never re-queued.
 */
export async function enqueueLeads(tenantId: string, leadIds: string[]): Promise<EnqueueResult> {
  const res: EnqueueResult = { queued: 0, skippedNoOffer: false, skippedNoEmail: 0, skippedSuppressed: 0, skippedBadAddress: 0, skippedDuplicate: 0 };
  if (!leadIds.length) return res;

  const offer = await getOutreachOffer(tenantId);
  if (!offer || !offer.active) {
    res.skippedNoOffer = true;
    return res;
  }

  const rows = await db
    .select({ id: leads.id, emails: leads.emails, businessEmail: leads.businessEmail })
    .from(leads)
    .where(inArray(leads.id, leadIds));

  const now = Date.now();
  // First decide which leads are mailable, then spread the schedule across that count.
  const mailable: { leadId: string; toAddr: string }[] = [];
  for (const r of rows) {
    const addr = leadEmail(r);
    if (!addr) { res.skippedNoEmail++; continue; }
    if (!validSyntax(addr)) { res.skippedBadAddress++; continue; }
    if (await isSuppressed(addr)) { res.skippedSuppressed++; continue; }
    if (!(await hasMx(addr))) { res.skippedBadAddress++; continue; }
    mailable.push({ leadId: r.id, toAddr: addr });
  }

  const times = spreadSchedule(mailable.length, now + 60_000, DRIP_WINDOW_MS);
  const deadline = new Date(now + DRIP_DEADLINE_MS);

  for (let i = 0; i < mailable.length; i++) {
    const inserted = await db
      .insert(outreachQueue)
      .values({
        tenantId,
        leadId: mailable[i].leadId,
        toAddr: mailable[i].toAddr,
        scheduledFor: new Date(times[i]),
        batchDeadline: deadline,
        clickToken: randomUUID(),
      })
      .onConflictDoNothing({ target: [outreachQueue.tenantId, outreachQueue.leadId] })
      .returning({ id: outreachQueue.id });
    if (inserted.length) res.queued++;
    else res.skippedDuplicate++;
  }
  return res;
}
