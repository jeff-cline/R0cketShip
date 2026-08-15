import { and, asc, eq, lte } from "drizzle-orm";
import { db } from "../db/client";
import { outreachQueue, tenants } from "../db/schema";
import { sendViaPool } from "../email/mailbox";
import { getOutreachOffer, type OutreachOffer } from "./offers";
import { brandFromDomain, renderOutreach } from "./render";
import { isSuppressed } from "./verify";
import { ensureCapacity } from "./autoscale";

const MAILING_ADDRESS = process.env.OUTREACH_MAILING_ADDRESS || "R0cketShip · 1209 Mountain Road Pl NE, Albuquerque, NM 87110";

export interface DrainResult {
  due: number;
  sent: number;
  suppressed: number;
  failed: number;
  outOfCapacity: boolean;
}

interface TenantCtx {
  domain: string;
  brand: string;
  baseUrl: string;
  offer: OutreachOffer | null;
}

async function tenantCtx(tenantId: string, cache: Map<string, TenantCtx>): Promise<TenantCtx> {
  const hit = cache.get(tenantId);
  if (hit) return hit;
  const t = (await db.select({ domain: tenants.domain }).from(tenants).where(eq(tenants.id, tenantId)).limit(1))[0];
  const domain = t?.domain ?? "r0cketship.com";
  const ctx: TenantCtx = { domain, brand: brandFromDomain(domain), baseUrl: `https://${domain}`, offer: await getOutreachOffer(tenantId) };
  cache.set(tenantId, ctx);
  return ctx;
}

/**
 * Send every outreach row that's due, up to `limit`, through the shared pool.
 * Stops early when the pool is out of daily capacity (rows stay queued for the next tick).
 */
export async function drainDue(limit = 200): Promise<DrainResult> {
  const res: DrainResult = { due: 0, sent: 0, suppressed: 0, failed: 0, outOfCapacity: false };
  const now = new Date();
  const rows = await db
    .select()
    .from(outreachQueue)
    .where(and(eq(outreachQueue.status, "queued"), lte(outreachQueue.scheduledFor, now)))
    .orderBy(asc(outreachQueue.scheduledFor))
    .limit(limit);
  res.due = rows.length;

  const cache = new Map<string, TenantCtx>();
  for (const row of rows) {
    if (await isSuppressed(row.toAddr)) {
      await db.update(outreachQueue).set({ status: "suppressed" }).where(eq(outreachQueue.id, row.id));
      res.suppressed++;
      continue;
    }
    const ctx = await tenantCtx(row.tenantId, cache);
    if (!ctx.offer || !ctx.offer.active) {
      await db.update(outreachQueue).set({ status: "skipped", error: "offer missing/inactive" }).where(eq(outreachQueue.id, row.id));
      continue;
    }
    const { subject, html } = renderOutreach({ offer: ctx.offer, brand: ctx.brand, baseUrl: ctx.baseUrl, clickToken: row.clickToken, address: MAILING_ADDRESS });
    const out = await sendViaPool(row.tenantId, { to: row.toAddr, subject, html }, "outreach");
    if (out.status === "sent") {
      await db.update(outreachQueue).set({ status: "sent", sentAt: new Date(), mailboxId: out.mailboxId }).where(eq(outreachQueue.id, row.id));
      res.sent++;
    } else if (out.status === "skipped") {
      // Pool exhausted for the day — leave this and the rest queued, stop the tick.
      res.outOfCapacity = true;
      break;
    } else {
      await db.update(outreachQueue).set({ status: "failed", error: out.reason ?? "send failed" }).where(eq(outreachQueue.id, row.id));
      res.failed++;
    }
  }
  return res;
}

/** One scheduler cycle: top up capacity, then drain due sends. */
export async function tick(limit = 200): Promise<{ drain: DrainResult; autoscale: Awaited<ReturnType<typeof ensureCapacity>> }> {
  const autoscale = await ensureCapacity();
  const drain = await drainDue(limit);
  return { drain, autoscale };
}
