import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { zipSubscriptions, users, tenants, wallets, payments } from "../db/schema";
import { baseMonthlyPrice, volumeDiscountedPrice, type SubscriptionOffer } from "./subscription-pricing";

export async function subscribedZips(customerId: string): Promise<Set<string>> {
  const rows = await db.select({ zip: zipSubscriptions.zip }).from(zipSubscriptions)
    .where(and(eq(zipSubscriptions.customerId, customerId), eq(zipSubscriptions.status, "active")));
  return new Set(rows.map((r) => r.zip));
}

export async function listSubscriptions(customerId: string) {
  return db.select().from(zipSubscriptions).where(eq(zipSubscriptions.customerId, customerId));
}

export async function subscribeZip(customerId: string, zip: string, offer: SubscriptionOffer = "data", couponCode?: string) {
  const { validateDiscountCoupon, redeemCoupon, discounted } = await import("./discount-coupons");
  const user = (await db.select().from(users).where(eq(users.id, customerId)).limit(1))[0];
  if (!user) throw new Error("user not found");
  const dup = await db.select().from(zipSubscriptions)
    .where(and(eq(zipSubscriptions.customerId, customerId), eq(zipSubscriptions.zip, zip), eq(zipSubscriptions.status, "active"))).limit(1);
  if (dup.length) throw new Error("already subscribed to this ZIP");

  const activeCount = (await db.select().from(zipSubscriptions)
    .where(and(eq(zipSubscriptions.customerId, customerId), eq(zipSubscriptions.status, "active")))).length;
  const tenant = (await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1))[0];
  const price = volumeDiscountedPrice(baseMonthlyPrice(tenant.monthlyPriceDefault, offer), activeCount);

  // Optional god-issued discount coupon.
  let coupon: Awaited<ReturnType<typeof validateDiscountCoupon>> | null = null;
  if (couponCode && couponCode.trim()) {
    coupon = await validateDiscountCoupon(couponCode, user.tenantId);
    if (!coupon.ok) throw new Error(`coupon: ${coupon.reason}`);
  }
  const firstPrice = coupon ? discounted(price, coupon.percent!) : price;
  // discountMonthsLeft: undefined when no coupon; null when "forever"; else remaining months AFTER this invoice.
  const monthsLeft = coupon ? (coupon.durationMonths == null ? null : Math.max(0, coupon.durationMonths - 1)) : undefined;

  const [sub] = await db.insert(zipSubscriptions)
    .values({
      tenantId: user.tenantId, customerId, zip, offer, monthlyPrice: String(price), status: "active",
      couponCode: coupon ? couponCode!.trim().toUpperCase() : null,
      discountPercent: coupon ? String(coupon.percent) : null,
      discountMonthsLeft: monthsLeft,
    }).returning();

  const wallet = (await db.select().from(wallets).where(eq(wallets.userId, customerId)).limit(1))[0];
  const [payment] = await db.insert(payments).values({
    tenantId: user.tenantId, walletId: wallet.id, provider: "manual",
    amountUsd: String(firstPrice), credits: "0", purpose: "subscription", subscriptionId: sub.id, status: "pending",
    couponCode: coupon ? couponCode!.trim().toUpperCase() : null,
  }).returning();

  if (coupon) await redeemCoupon(coupon.couponId!);
  return { subscription: sub, payment };
}

/**
 * Create the next monthly invoice for an active subscription, applying any
 * remaining coupon discount (and decrementing the discounted months). For the
 * (currently manual) renewal flow.
 */
export async function createRenewalInvoice(subscriptionId: string) {
  const { discounted } = await import("./discount-coupons");
  const sub = (await db.select().from(zipSubscriptions).where(eq(zipSubscriptions.id, subscriptionId)).limit(1))[0];
  if (!sub || sub.status !== "active") throw new Error("subscription not active");
  const wallet = (await db.select().from(wallets).where(eq(wallets.userId, sub.customerId)).limit(1))[0];
  let price = parseFloat(sub.monthlyPrice);
  // forever (discountMonthsLeft null but couponCode set) OR months remaining.
  const discountApplies = sub.couponCode && sub.discountPercent != null && (sub.discountMonthsLeft == null || sub.discountMonthsLeft > 0);
  if (discountApplies) {
    price = discounted(price, parseFloat(sub.discountPercent!));
    if (sub.discountMonthsLeft != null) {
      await db.update(zipSubscriptions).set({ discountMonthsLeft: Math.max(0, sub.discountMonthsLeft - 1) }).where(eq(zipSubscriptions.id, sub.id));
    }
  }
  const [payment] = await db.insert(payments).values({
    tenantId: sub.tenantId, walletId: wallet.id, provider: "manual",
    amountUsd: String(price), credits: "0", purpose: "subscription", subscriptionId: sub.id, status: "pending",
    couponCode: discountApplies ? sub.couponCode : null,
  }).returning();
  return payment;
}

export async function cancelZip(customerId: string, subscriptionId: string) {
  const sub = (await db.select().from(zipSubscriptions).where(eq(zipSubscriptions.id, subscriptionId)).limit(1))[0];
  if (!sub || sub.customerId !== customerId) throw new Error("Not authorized");
  await db.update(zipSubscriptions).set({ status: "canceled", canceledAt: new Date() }).where(eq(zipSubscriptions.id, subscriptionId));
}
