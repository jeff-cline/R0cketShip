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

export async function subscribeZip(customerId: string, zip: string, offer: SubscriptionOffer = "data") {
  const user = (await db.select().from(users).where(eq(users.id, customerId)).limit(1))[0];
  if (!user) throw new Error("user not found");
  const dup = await db.select().from(zipSubscriptions)
    .where(and(eq(zipSubscriptions.customerId, customerId), eq(zipSubscriptions.zip, zip), eq(zipSubscriptions.status, "active"))).limit(1);
  if (dup.length) throw new Error("already subscribed to this ZIP");

  const activeCount = (await db.select().from(zipSubscriptions)
    .where(and(eq(zipSubscriptions.customerId, customerId), eq(zipSubscriptions.status, "active")))).length;
  const tenant = (await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1))[0];
  const price = volumeDiscountedPrice(baseMonthlyPrice(tenant.monthlyPriceDefault, offer), activeCount);

  const [sub] = await db.insert(zipSubscriptions)
    .values({ tenantId: user.tenantId, customerId, zip, offer, monthlyPrice: String(price), status: "active" }).returning();

  const wallet = (await db.select().from(wallets).where(eq(wallets.userId, customerId)).limit(1))[0];
  const [payment] = await db.insert(payments).values({
    tenantId: user.tenantId, walletId: wallet.id, provider: "manual",
    amountUsd: String(price), credits: "0", purpose: "subscription", subscriptionId: sub.id, status: "pending",
  }).returning();

  return { subscription: sub, payment };
}

export async function cancelZip(customerId: string, subscriptionId: string) {
  const sub = (await db.select().from(zipSubscriptions).where(eq(zipSubscriptions.id, subscriptionId)).limit(1))[0];
  if (!sub || sub.customerId !== customerId) throw new Error("Not authorized");
  await db.update(zipSubscriptions).set({ status: "canceled", canceledAt: new Date() }).where(eq(zipSubscriptions.id, subscriptionId));
}
