import { eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { payments, creditLedger, coupons, wallets } from "../db/schema";
import { validateCoupon } from "./coupons";
import { getProvider } from "./provider";

export async function createTopup(walletId: string, amountUsd: number, couponCode?: string) {
  const wallet = (await db.select().from(wallets).where(eq(wallets.id, walletId)).limit(1))[0];
  if (!wallet) throw new Error("wallet not found");

  let credits = amountUsd;
  let appliedCoupon: string | null = null;
  if (couponCode) {
    const v = await validateCoupon(couponCode, wallet.tenantId, amountUsd);
    if (!v.ok) throw new Error(`coupon: ${v.reason}`);
    credits += v.bonusCredits;
    appliedCoupon = couponCode;
  }

  const [payment] = await db
    .insert(payments)
    .values({
      tenantId: wallet.tenantId,
      walletId,
      provider: "manual",
      amountUsd: String(amountUsd),
      credits: String(credits),
      couponCode: appliedCoupon,
      status: "pending",
    })
    .returning();

  const start = await getProvider("manual").startTopup({ id: payment.id, amountUsd });
  return { payment, start };
}

/** Idempotent: flips pending -> paid, writes the topup ledger entry, bumps coupon redemptions once. */
export async function confirmPayment(paymentId: string) {
  return db.transaction(async (tx) => {
    const p = (
      await tx.select().from(payments).where(eq(payments.id, paymentId)).limit(1).for("update")
    )[0];
    if (!p) throw new Error("payment not found");
    if (p.status !== "pending") return p;

    await tx.update(payments).set({ status: "paid", paidAt: new Date() }).where(eq(payments.id, paymentId));
    await tx.insert(creditLedger).values({
      walletId: p.walletId,
      tenantId: p.tenantId,
      amount: p.credits,
      type: "topup",
      description: "Top-up",
      refId: p.id,
    });
    if (p.couponCode) {
      const c = (await tx.select().from(coupons).where(eq(coupons.code, p.couponCode)).limit(1))[0];
      if (c) {
        await tx.update(coupons).set({ timesRedeemed: sql`${coupons.timesRedeemed} + 1` }).where(eq(coupons.id, c.id));
      }
    }
    return { ...p, status: "paid" as const };
  });
}

export async function listPendingPayments(tenantId?: string) {
  const rows = await db.select().from(payments).where(eq(payments.status, "pending"));
  return tenantId ? rows.filter((p) => p.tenantId === tenantId) : rows;
}

export async function paymentsByTenant() {
  const rows = await db.select().from(payments);
  const byTenant = new Map<string, { count: number; usd: number }>();
  for (const p of rows) {
    if (p.status !== "paid") continue;
    const cur = byTenant.get(p.tenantId) ?? { count: 0, usd: 0 };
    cur.count += 1;
    cur.usd += parseFloat(p.amountUsd);
    byTenant.set(p.tenantId, cur);
  }
  return [...byTenant.entries()].map(([tenantId, v]) => ({ tenantId, ...v }));
}
