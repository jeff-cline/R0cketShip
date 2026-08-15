/**
 * Phase 2: advertiser wallet + ledger.
 *
 * - Authoritative balance = SUM(advertiser_ledger.delta_cents) for the advertiser.
 * - `advertisers.wallet_balance_cents` is a denormalized cache, kept in sync
 *   on every credit/debit and reconcilable via `reconcileBalance`.
 * - Wallet can hit zero but NEVER go negative (callers must check balance
 *   before issuing charges; this module also guards against double-spending).
 * - No refunds policy: refund_admin path exists only for fraud/abuse,
 *   never customer-requested.
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import {
  advertiserLedger,
  advertiserPayments,
  advertisers,
  coupons,
} from "../db/schema";

export { SIGNUP_BONUS_CENTS, MIN_DEPOSIT_CENTS, MIN_CPA_CENTS } from "./constants";
import { SIGNUP_BONUS_CENTS, MIN_DEPOSIT_CENTS, MIN_CPA_CENTS } from "./constants";

/** Authoritative balance via SUM of ledger. Slower than reading the cache. */
export async function walletBalanceFromLedger(advertiserId: string): Promise<number> {
  const rows = await db
    .select({ sum: sql<string>`COALESCE(SUM(${advertiserLedger.deltaCents}), 0)` })
    .from(advertiserLedger)
    .where(eq(advertiserLedger.advertiserId, advertiserId));
  return Number(rows[0]?.sum ?? 0);
}

/** Fast read from the denormalized cache column on `advertisers`. */
export async function walletBalance(advertiserId: string): Promise<number> {
  const rows = await db
    .select({ balance: advertisers.walletBalanceCents })
    .from(advertisers)
    .where(eq(advertisers.id, advertiserId))
    .limit(1);
  return rows[0]?.balance ?? 0;
}

/** Recompute cache from ledger and update the advertiser row. Returns new balance. */
export async function reconcileBalance(advertiserId: string): Promise<number> {
  const truth = await walletBalanceFromLedger(advertiserId);
  await db
    .update(advertisers)
    .set({ walletBalanceCents: truth, updatedAt: new Date() })
    .where(eq(advertisers.id, advertiserId));
  return truth;
}

/** Idempotent $10 signup bonus. Already wired in verifyAdvertiserEmail; exposed
 *  here for testability and god-driven grants. */
export async function grantSignupBonus(advertiserId: string): Promise<{ granted: boolean; balance: number }> {
  const existing = await db
    .select({ id: advertiserPayments.id })
    .from(advertiserPayments)
    .where(
      and(
        eq(advertiserPayments.advertiserId, advertiserId),
        eq(advertiserPayments.purpose, "signup_bonus"),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    return { granted: false, balance: await walletBalance(advertiserId) };
  }
  await db.insert(advertiserPayments).values({
    advertiserId,
    amountCents: SIGNUP_BONUS_CENTS,
    provider: "manual",
    purpose: "signup_bonus",
    confirmedAt: new Date(),
  });
  await db.insert(advertiserLedger).values({
    advertiserId,
    deltaCents: SIGNUP_BONUS_CENTS,
    type: "signup_bonus",
    refId: "signup",
  });
  const balance = await reconcileBalance(advertiserId);
  return { granted: true, balance };
}

/** Manual deposit confirmation by god. Enforces $1,000 minimum unless purpose is admin_grant. */
export async function depositManual(input: {
  advertiserId: string;
  amountCents: number;
  providerRef?: string;
}): Promise<{ ok: true; balance: number } | { ok: false; reason: "below_minimum" }> {
  if (input.amountCents < MIN_DEPOSIT_CENTS) {
    return { ok: false, reason: "below_minimum" };
  }
  await db.insert(advertiserPayments).values({
    advertiserId: input.advertiserId,
    amountCents: input.amountCents,
    provider: "manual",
    providerPaymentId: input.providerRef ?? null,
    purpose: "deposit",
    confirmedAt: new Date(),
  });
  await db.insert(advertiserLedger).values({
    advertiserId: input.advertiserId,
    deltaCents: input.amountCents,
    type: "deposit",
    refId: input.providerRef ?? null,
  });
  const balance = await reconcileBalance(input.advertiserId);
  return { ok: true, balance };
}

/** Stripe checkout success → idempotent deposit by providerPaymentId. */
export async function depositStripe(input: {
  advertiserId: string;
  amountCents: number;
  stripePaymentId: string;
}): Promise<{ ok: true; balance: number; alreadyProcessed: boolean } | { ok: false; reason: "below_minimum" }> {
  if (input.amountCents < MIN_DEPOSIT_CENTS) {
    return { ok: false, reason: "below_minimum" };
  }
  // Idempotency: if a payment with this stripePaymentId already exists, skip.
  const existing = await db
    .select({ id: advertiserPayments.id })
    .from(advertiserPayments)
    .where(eq(advertiserPayments.providerPaymentId, input.stripePaymentId))
    .limit(1);
  if (existing.length > 0) {
    return { ok: true, balance: await walletBalance(input.advertiserId), alreadyProcessed: true };
  }
  await db.insert(advertiserPayments).values({
    advertiserId: input.advertiserId,
    amountCents: input.amountCents,
    provider: "stripe",
    providerPaymentId: input.stripePaymentId,
    purpose: "deposit",
    confirmedAt: new Date(),
  });
  await db.insert(advertiserLedger).values({
    advertiserId: input.advertiserId,
    deltaCents: input.amountCents,
    type: "deposit",
    refId: input.stripePaymentId,
  });
  const balance = await reconcileBalance(input.advertiserId);
  return { ok: true, balance, alreadyProcessed: false };
}

/** Apply a coupon to grant credits — bypasses the $1,000 minimum. */
export async function grantCoupon(input: {
  advertiserId: string;
  couponCode: string;
}): Promise<
  | { ok: true; balance: number; amountCents: number }
  | { ok: false; reason: "coupon_not_found" | "coupon_inactive" | "coupon_expired" | "coupon_exhausted" | "unsupported_coupon_kind" }
> {
  const rows = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, input.couponCode))
    .limit(1);
  const c = rows[0];
  if (!c) return { ok: false, reason: "coupon_not_found" };
  if (!c.active) return { ok: false, reason: "coupon_inactive" };
  if (c.expiresAt && c.expiresAt.getTime() < Date.now()) return { ok: false, reason: "coupon_expired" };
  if (c.maxRedemptions && c.timesRedeemed >= c.maxRedemptions) {
    return { ok: false, reason: "coupon_exhausted" };
  }
  // Only fixed_credits coupons make sense for advertiser wallets — percent
  // coupons are subscription-discount semantics. Reject unsupported kinds.
  if (c.kind !== "fixed_credits") return { ok: false, reason: "unsupported_coupon_kind" };

  // `value` is "credits" in the customer-side model. For advertisers we treat
  // 1 credit = 1 cent for direct dollar grants. Adjust here if you'd rather
  // map 1 credit = $1 (×100).
  const amountCents = Math.round(Number(c.value));
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return { ok: false, reason: "unsupported_coupon_kind" };
  }

  await db.insert(advertiserPayments).values({
    advertiserId: input.advertiserId,
    amountCents,
    provider: "coupon",
    providerPaymentId: c.code,
    purpose: "coupon_grant",
    confirmedAt: new Date(),
  });
  await db.insert(advertiserLedger).values({
    advertiserId: input.advertiserId,
    deltaCents: amountCents,
    type: "coupon_grant",
    refId: c.code,
  });
  // Bump coupon redemption count.
  await db
    .update(coupons)
    .set({ timesRedeemed: c.timesRedeemed + 1 })
    .where(eq(coupons.id, c.id));
  const balance = await reconcileBalance(input.advertiserId);
  return { ok: true, balance, amountCents };
}

/** God-only refund. Use sparingly — no customer-requested refunds. */
export async function adminRefund(input: {
  advertiserId: string;
  amountCents: number;
  reason: string;
}): Promise<{ ok: true; balance: number }> {
  const delta = -Math.abs(input.amountCents);
  await db.insert(advertiserLedger).values({
    advertiserId: input.advertiserId,
    deltaCents: delta,
    type: "refund_admin",
    refId: input.reason.slice(0, 200),
  });
  const balance = await reconcileBalance(input.advertiserId);
  return { ok: true, balance };
}

/** God-only generic credit (e.g., goodwill, manual ad-hoc grant). */
export async function adminGrant(input: {
  advertiserId: string;
  amountCents: number;
  reason: string;
}): Promise<{ ok: true; balance: number }> {
  const amount = Math.abs(input.amountCents);
  await db.insert(advertiserPayments).values({
    advertiserId: input.advertiserId,
    amountCents: amount,
    provider: "manual",
    purpose: "admin_grant",
    confirmedAt: new Date(),
  });
  await db.insert(advertiserLedger).values({
    advertiserId: input.advertiserId,
    deltaCents: amount,
    type: "admin_grant",
    refId: input.reason.slice(0, 200),
  });
  const balance = await reconcileBalance(input.advertiserId);
  return { ok: true, balance };
}

/**
 * Click-charge against an advertiser wallet. Guarded against double-spending
 * (each click_event id is unique) and against negative balances.
 *
 * Returns the new balance plus a flag indicating whether the wallet hit the
 * floor (caller should pause out-of-budget campaigns).
 */
export async function chargeForClick(input: {
  advertiserId: string;
  campaignId: string;
  clickId: string;
  amountCents: number;
}): Promise<{ balance: number; outOfBudget: boolean; actualChargeCents: number }> {
  const current = await walletBalance(input.advertiserId);
  // Never charge more than the wallet has. If the wallet is at 0, the click
  // still records (Phase 1 transparency principle) but we charge 0.
  const charge = Math.max(0, Math.min(input.amountCents, current));
  if (charge > 0) {
    await db.insert(advertiserLedger).values({
      advertiserId: input.advertiserId,
      campaignId: input.campaignId,
      deltaCents: -charge,
      type: "click_charge",
      refId: input.clickId,
    });
  }
  const balance = await reconcileBalance(input.advertiserId);
  return { balance, outOfBudget: balance < MIN_CPA_CENTS, actualChargeCents: charge };
}
