import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { partnerReferrals, referralCodes, tenants, commissionLedger, wallets } from "../db/schema";

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}
function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

/**
 * Commission = rate × the EARNER'S MARGIN on the collected amount.
 * - tenant scope (white-label partner): margin = white-label's share = (1 − platformFeeRate)
 * - platform scope (sales rep): margin = r0cketship's share = platformFeeRate
 */
export function computeCommission(amount: number, platformFeeRate: number, rate: number, scope: "platform" | "tenant"): { basis: number; amount: number } {
  const amt = amount > 0 ? amount : 0;
  const fee = clamp01(platformFeeRate);
  const marginShare = scope === "platform" ? fee : 1 - fee;
  const basis = amt * marginShare;
  return { basis, amount: basis * clamp01(rate) };
}

/**
 * Accrue commission for one PAID payment by a referred user. Idempotent per payment.
 * First paid payment sets the referral's 12-month window; payments after the window earn nothing.
 * The $50 free signup credit is never a payment, so it never earns.
 */
export async function accrueCommissionForPayment(payment: {
  id: string;
  tenantId: string;
  walletId: string;
  amountUsd: string | number;
  paidAt?: Date | string | null;
}): Promise<{ accrued: boolean; amount?: number }> {
  const w = (await db.select({ userId: wallets.userId }).from(wallets).where(eq(wallets.id, payment.walletId)).limit(1))[0];
  if (!w) return { accrued: false };

  const ref = (await db.select().from(partnerReferrals).where(eq(partnerReferrals.referredUserId, w.userId)).limit(1))[0];
  if (!ref) return { accrued: false };

  const rc = (await db.select().from(referralCodes).where(eq(referralCodes.id, ref.referralCodeId)).limit(1))[0];
  if (!rc || rc.status !== "active") return { accrued: false };

  const now = payment.paidAt ? new Date(payment.paidAt) : new Date();

  // First upgrade opens the 12-month commission window.
  let windowEndsAt = ref.windowEndsAt;
  if (!ref.upgradedAt) {
    windowEndsAt = new Date(now);
    windowEndsAt.setMonth(windowEndsAt.getMonth() + 12);
    await db.update(partnerReferrals).set({ upgradedAt: now, windowEndsAt }).where(eq(partnerReferrals.id, ref.id));
  }
  if (windowEndsAt && now > windowEndsAt) return { accrued: false };

  // One commission row per payment.
  const dup = (await db.select({ id: commissionLedger.id }).from(commissionLedger).where(eq(commissionLedger.paymentId, payment.id)).limit(1))[0];
  if (dup) return { accrued: false };

  const amount = num(payment.amountUsd);
  if (amount <= 0) return { accrued: false };

  const t = (await db.select({ fee: tenants.platformFeeRate }).from(tenants).where(eq(tenants.id, payment.tenantId)).limit(1))[0];
  const { basis, amount: commission } = computeCommission(amount, num(t?.fee ?? "0.6"), num(rc.customerRate), rc.scope);
  if (commission <= 0) return { accrued: false };

  await db.insert(commissionLedger).values({
    referralCodeId: rc.id,
    ownerUserId: rc.ownerUserId,
    referredUserId: w.userId,
    paymentId: payment.id,
    kind: "customer",
    basisAmount: String(basis),
    rate: String(clamp01(num(rc.customerRate))),
    amount: String(commission),
    scope: rc.scope,
    tenantId: payment.tenantId,
    periodMonth: now.toISOString().slice(0, 7),
    status: "accrued",
  });
  return { accrued: true, amount: commission };
}
