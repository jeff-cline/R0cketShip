import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { commissionLedger, payoutSettings, payoutBatches, users } from "../db/schema";

export type PayoutMethod = "manual" | "paypal" | "stripe_connect";

export async function getPayoutSettings(userId: string) {
  const row = (await db.select().from(payoutSettings).where(eq(payoutSettings.userId, userId)).limit(1))[0];
  return row ?? { userId, method: "manual" as PayoutMethod, paypalEmail: null, stripeConnectId: null };
}

export async function setPayoutSettings(userId: string, patch: { method?: PayoutMethod; paypalEmail?: string | null; stripeConnectId?: string | null }) {
  const existing = (await db.select().from(payoutSettings).where(eq(payoutSettings.userId, userId)).limit(1))[0];
  const values = {
    userId,
    method: patch.method ?? existing?.method ?? "manual",
    paypalEmail: patch.paypalEmail !== undefined ? patch.paypalEmail : existing?.paypalEmail ?? null,
    stripeConnectId: patch.stripeConnectId !== undefined ? patch.stripeConnectId : existing?.stripeConnectId ?? null,
    updatedAt: new Date(),
  };
  if (existing) await db.update(payoutSettings).set(values).where(eq(payoutSettings.userId, userId));
  else await db.insert(payoutSettings).values(values);
}

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export interface PayoutLine {
  ownerUserId: string;
  email: string;
  method: PayoutMethod;
  destination: string | null;
  amount: number;
}

/**
 * Queue a payout run for a month (run on the 21st for the prior month). Rolls that
 * month's `accrued` commissions → `owed`, attaches them to a batch, and returns the
 * per-partner totals. Execution (PayPal/Stripe/manual) happens via markBatchPaid.
 */
export async function runPayoutBatch(periodMonth: string, scope: "platform" | "tenant" | null, createdBy: string): Promise<{ batchId: string | null; total: number; lines: PayoutLine[] }> {
  const conds = [eq(commissionLedger.periodMonth, periodMonth), eq(commissionLedger.status, "accrued")];
  if (scope) conds.push(eq(commissionLedger.scope, scope));
  const rows = await db.select().from(commissionLedger).where(and(...conds));
  if (rows.length === 0) return { batchId: null, total: 0, lines: [] };

  const total = rows.reduce((s, r) => s + num(r.amount), 0);
  const [batch] = await db.insert(payoutBatches).values({ runMonth: periodMonth, scope: scope ?? undefined, createdBy, status: "queued", totalAmount: String(total) }).returning();
  await db.update(commissionLedger).set({ status: "owed", payoutBatchId: batch.id }).where(and(...conds));

  // Group by owner.
  const byOwner = new Map<string, number>();
  for (const r of rows) byOwner.set(r.ownerUserId, (byOwner.get(r.ownerUserId) ?? 0) + num(r.amount));
  const lines: PayoutLine[] = [];
  for (const [ownerUserId, amount] of byOwner) {
    const u = (await db.select({ email: users.email }).from(users).where(eq(users.id, ownerUserId)).limit(1))[0];
    const ps = await getPayoutSettings(ownerUserId);
    lines.push({ ownerUserId, email: u?.email ?? "(unknown)", method: ps.method as PayoutMethod, destination: ps.paypalEmail ?? ps.stripeConnectId ?? null, amount });
  }
  lines.sort((a, b) => b.amount - a.amount);
  return { batchId: batch.id, total, lines };
}

/** Mark a queued batch as paid (after PayPal/Stripe/manual disbursement). */
export async function markBatchPaid(batchId: string): Promise<void> {
  await db.update(commissionLedger).set({ status: "paid" }).where(eq(commissionLedger.payoutBatchId, batchId));
  await db.update(payoutBatches).set({ status: "sent" }).where(eq(payoutBatches.id, batchId));
}

export async function listPayoutBatches() {
  return db.select().from(payoutBatches).orderBy(sql`${payoutBatches.createdAt} desc`).limit(24);
}
