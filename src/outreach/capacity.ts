import { eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { outreachQueue } from "../db/schema";
import { platformTenantId, poolCapacity } from "../email/mailbox";

const DAY = 24 * 60 * 60 * 1000;
export const PER_MAILBOX_CAP = 50; // Zapmail/Google default daily cap.

/** Mailboxes needed to clear `queued` sends within `daysLeft`, given each does `cap`/day. */
export function requiredMailboxes(queued: number, daysLeft: number, cap: number = PER_MAILBOX_CAP): number {
  if (queued <= 0) return 0;
  const days = Math.max(1, daysLeft);
  return Math.ceil(queued / days / Math.max(1, cap));
}

export interface CapacityPlan {
  queued: number;
  mailboxes: number;
  dailyCapacity: number;
  daysLeft: number;
  dailyDemand: number;
  requiredMailboxes: number;
  deficitMailboxes: number;
}

/** Platform-wide outreach capacity picture: backlog vs pool throughput vs the nearest deadline. */
export async function planCapacity(): Promise<CapacityPlan> {
  const platform = await platformTenantId();
  const empty: CapacityPlan = { queued: 0, mailboxes: 0, dailyCapacity: 0, daysLeft: 7, dailyDemand: 0, requiredMailboxes: 0, deficitMailboxes: 0 };
  if (!platform) return empty;

  const agg = (
    await db
      .select({ queued: sql<number>`count(*)::int`, earliest: sql<string | null>`min(${outreachQueue.batchDeadline})` })
      .from(outreachQueue)
      .where(eq(outreachQueue.status, "queued"))
  )[0];

  const queued = agg?.queued ?? 0;
  const pool = await poolCapacity(platform);
  const earliestMs = agg?.earliest ? new Date(agg.earliest).getTime() : Date.now() + 7 * DAY;
  const daysLeft = Math.max(1, Math.ceil((earliestMs - Date.now()) / DAY));
  const dailyDemand = Math.ceil(queued / daysLeft);
  const req = requiredMailboxes(queued, daysLeft, PER_MAILBOX_CAP);

  return {
    queued,
    mailboxes: pool.mailboxes,
    dailyCapacity: pool.cap,
    daysLeft,
    dailyDemand,
    requiredMailboxes: req,
    deficitMailboxes: Math.max(0, req - pool.mailboxes),
  };
}
