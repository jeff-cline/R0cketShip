/**
 * Outreach observability helpers (god-only callers).
 *
 * Two surfaces:
 *   1. `/admin/outreach/queue`  — browse the per-lead send queue
 *   2. `/admin/outreach/mailboxes` — per-mailbox health + delivery efficiency
 *
 * Callers are expected to auth-gate. These helpers do not enforce scope.
 */
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "../db/client";
import { emailMailboxes, emailOutbound, outreachQueue, tenants } from "../db/schema";

const DAY = 24 * 60 * 60 * 1000;

export type QueueStatus = "queued" | "sent" | "skipped" | "suppressed" | "failed";

export interface QueueRow {
  id: string;
  tenantId: string;
  tenantDomain: string;
  toAddr: string;
  status: QueueStatus;
  scheduledFor: Date;
  batchDeadline: Date;
  sentAt: Date | null;
  clicks: number;
  error: string | null;
  mailboxAddress: string | null;
}

export interface ListQueueOpts {
  status?: QueueStatus[];
  tenantId?: string;
  limit?: number;
  offset?: number;
  scheduledBefore?: Date;
  /**
   * Order rows. Default is `desc` (most-recent activity first), useful for
   * scanning recent sends + failures. Use `asc` when surfacing "what's next"
   * for queued/due rows.
   */
  order?: "asc" | "desc";
}

/**
 * Paginated browse of the outreach send queue, joined to tenants (for domain)
 * and to email_mailboxes (for the resolved sender address).
 */
export async function listQueue(
  opts: ListQueueOpts = {},
): Promise<{ rows: QueueRow[]; total: number }> {
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 500);
  const offset = Math.max(opts.offset ?? 0, 0);

  const conds = [];
  if (opts.status && opts.status.length > 0) {
    conds.push(inArray(outreachQueue.status, opts.status));
  }
  if (opts.tenantId) {
    conds.push(eq(outreachQueue.tenantId, opts.tenantId));
  }
  if (opts.scheduledBefore) {
    conds.push(lte(outreachQueue.scheduledFor, opts.scheduledBefore));
  }
  const whereExpr = conds.length > 0 ? and(...conds) : undefined;

  const baseSel = db
    .select({
      id: outreachQueue.id,
      tenantId: outreachQueue.tenantId,
      tenantDomain: tenants.domain,
      toAddr: outreachQueue.toAddr,
      status: outreachQueue.status,
      scheduledFor: outreachQueue.scheduledFor,
      batchDeadline: outreachQueue.batchDeadline,
      sentAt: outreachQueue.sentAt,
      clicks: outreachQueue.clicks,
      error: outreachQueue.error,
      mailboxAddress: emailMailboxes.address,
    })
    .from(outreachQueue)
    .leftJoin(tenants, eq(tenants.id, outreachQueue.tenantId))
    .leftJoin(emailMailboxes, eq(emailMailboxes.id, outreachQueue.mailboxId));

  const queryWithWhere = whereExpr ? baseSel.where(whereExpr) : baseSel;

  const order = opts.order ?? "desc";
  const rows = await queryWithWhere
    .orderBy(
      order === "asc"
        ? asc(outreachQueue.scheduledFor)
        : desc(outreachQueue.scheduledFor),
    )
    .limit(limit)
    .offset(offset);

  // Total count (same filter, no join needed for accuracy).
  const totalCountQuery = db
    .select({ c: sql<number>`count(*)::int` })
    .from(outreachQueue);
  const totalRow = whereExpr
    ? await totalCountQuery.where(whereExpr)
    : await totalCountQuery;
  const total = Number(totalRow[0]?.c ?? 0);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      tenantDomain: r.tenantDomain ?? "—",
      toAddr: r.toAddr,
      status: r.status as QueueStatus,
      scheduledFor: r.scheduledFor,
      batchDeadline: r.batchDeadline,
      sentAt: r.sentAt,
      clicks: r.clicks,
      error: r.error,
      mailboxAddress: r.mailboxAddress,
    })),
    total,
  };
}

export interface MailboxStat {
  id: string;
  address: string;
  displayName: string | null;
  provider: string;
  tenantId: string;
  tenantDomain: string;
  dailyCap: number;
  sentToday: number;
  status: "active" | "paused";
  sent7d: number;
  failed7d: number;
  skipped7d: number;
  deliveryRate7d: number;
  burnoutWatch: boolean;
}

/**
 * Per-mailbox health snapshot. 7-day stats come from `email_outbound` joined
 * by mailboxId. Delivery rate denominator excludes `skipped` (skipped = pool
 * exhausted, not a mailbox-health issue).
 */
export async function mailboxStats(): Promise<MailboxStat[]> {
  const since = new Date(Date.now() - 7 * DAY);

  // Pull mailboxes joined to tenants.
  const boxes = await db
    .select({
      id: emailMailboxes.id,
      address: emailMailboxes.address,
      displayName: emailMailboxes.displayName,
      provider: emailMailboxes.provider,
      tenantId: emailMailboxes.tenantId,
      tenantDomain: tenants.domain,
      dailyCap: emailMailboxes.dailyCap,
      sentToday: emailMailboxes.sentToday,
      status: emailMailboxes.status,
    })
    .from(emailMailboxes)
    .leftJoin(tenants, eq(tenants.id, emailMailboxes.tenantId))
    .orderBy(emailMailboxes.address);

  // Aggregate 7-day outbound counts grouped by mailbox + status.
  const agg = await db
    .select({
      mailboxId: emailOutbound.mailboxId,
      status: emailOutbound.status,
      c: sql<number>`count(*)::int`,
    })
    .from(emailOutbound)
    .where(gte(emailOutbound.createdAt, since))
    .groupBy(emailOutbound.mailboxId, emailOutbound.status);

  type Counts = { sent: number; failed: number; skipped: number };
  const byBox = new Map<string, Counts>();
  for (const r of agg) {
    if (!r.mailboxId) continue;
    const cur = byBox.get(r.mailboxId) ?? { sent: 0, failed: 0, skipped: 0 };
    if (r.status === "sent") cur.sent += Number(r.c);
    else if (r.status === "failed") cur.failed += Number(r.c);
    else if (r.status === "skipped") cur.skipped += Number(r.c);
    byBox.set(r.mailboxId, cur);
  }

  return boxes.map((b) => {
    const c = byBox.get(b.id) ?? { sent: 0, failed: 0, skipped: 0 };
    const denom = c.sent + c.failed;
    const deliveryRate = denom > 0 ? c.sent / denom : 0;
    const burnoutWatch = c.sent >= 25 && deliveryRate < 0.85 && denom > 0;
    return {
      id: b.id,
      address: b.address,
      displayName: b.displayName,
      provider: b.provider,
      tenantId: b.tenantId,
      tenantDomain: b.tenantDomain ?? "—",
      dailyCap: b.dailyCap,
      sentToday: b.sentToday,
      status: b.status as "active" | "paused",
      sent7d: c.sent,
      failed7d: c.failed,
      skipped7d: c.skipped,
      deliveryRate7d: deliveryRate,
      burnoutWatch,
    };
  });
}

export interface OutreachOverview {
  queued: number;
  sentToday: number;
  failedToday: number;
  dueWithin1h: number;
  totalMailboxes: number;
  activeMailboxes: number;
  burnoutWatchCount: number;
}

/**
 * Top-of-page snapshot for both observability pages. One trip per metric —
 * acceptable since these are small aggregate queries on small tables.
 */
export async function outreachOverview(): Promise<OutreachOverview> {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);

  const queuedRow = (
    await db
      .select({ c: sql<number>`count(*)::int` })
      .from(outreachQueue)
      .where(eq(outreachQueue.status, "queued"))
  )[0];

  const sentTodayRow = (
    await db
      .select({ c: sql<number>`count(*)::int` })
      .from(outreachQueue)
      .where(and(eq(outreachQueue.status, "sent"), gte(outreachQueue.sentAt, dayStart)))
  )[0];

  const failedTodayRow = (
    await db
      .select({ c: sql<number>`count(*)::int` })
      .from(outreachQueue)
      .where(and(eq(outreachQueue.status, "failed"), gte(outreachQueue.createdAt, dayStart)))
  )[0];

  const dueRow = (
    await db
      .select({ c: sql<number>`count(*)::int` })
      .from(outreachQueue)
      .where(
        and(
          eq(outreachQueue.status, "queued"),
          gte(outreachQueue.scheduledFor, now),
          lte(outreachQueue.scheduledFor, in1h),
        ),
      )
  )[0];

  const mailboxesRow = (
    await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${emailMailboxes.status} = 'active')::int`,
      })
      .from(emailMailboxes)
  )[0];

  // Burnout watch needs the per-mailbox computation; reuse mailboxStats().
  const stats = await mailboxStats();
  const burnoutWatchCount = stats.filter((s) => s.burnoutWatch).length;

  return {
    queued: Number(queuedRow?.c ?? 0),
    sentToday: Number(sentTodayRow?.c ?? 0),
    failedToday: Number(failedTodayRow?.c ?? 0),
    dueWithin1h: Number(dueRow?.c ?? 0),
    totalMailboxes: Number(mailboxesRow?.total ?? 0),
    activeMailboxes: Number(mailboxesRow?.active ?? 0),
    burnoutWatchCount,
  };
}
