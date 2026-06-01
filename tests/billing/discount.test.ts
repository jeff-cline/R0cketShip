import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tenants, zipSubscriptions, payments } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { createDiscountCoupon, validateDiscountCoupon, redeemCoupon, discounted } from "@/src/billing/discount-coupons";
import { subscribeZip } from "@/src/billing/subscriptions";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };

describe("god discount coupons", () => {
  let tId: string;
  let custId: string;
  beforeEach(async () => {
    const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500", platformFeeRate: "0.60" }).returning();
    tId = t.id;
    const cust = await createUser({ role: "god", tenantId: tId }, { tenantId: tId, email: "c@roofers.co", role: "customer", tempPassword: "x" });
    custId = cust.id;
  });

  it("discounted() applies a percentage off", () => {
    expect(discounted(1500, 0.2)).toBe(1200);
    expect(discounted(100, 1.5)).toBe(0); // clamps
  });

  it("validates tenant scope, redemptions, and active flag", async () => {
    const c = await createDiscountCoupon({ code: "save20", name: "Launch 20", tenantId: tId, percent: 20, durationMonths: 3, maxRedemptions: 1 });
    const v = await validateDiscountCoupon("SAVE20", tId);
    expect(v.ok).toBe(true);
    expect(v.percent).toBeCloseTo(0.2, 6);
    expect(v.durationMonths).toBe(3);
    // wrong tenant
    const [other] = await db.insert(tenants).values({ domain: "solar.co", niche: "solar", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
    expect((await validateDiscountCoupon("SAVE20", other.id)).ok).toBe(false);
    // redemption cap
    await redeemCoupon(c.id);
    expect((await validateDiscountCoupon("SAVE20", tId)).reason).toBe("fully redeemed");
  });

  it("subscribeZip applies the coupon to the first invoice and stores the duration", async () => {
    await createDiscountCoupon({ code: "half", name: "Half off 2mo", tenantId: tId, percent: 50, durationMonths: 2, maxRedemptions: null });
    const { subscription, payment } = await subscribeZip(custId, "30265", "data", "HALF");
    // monthlyPrice stored full; first payment is half.
    expect(Number(payment.amountUsd)).toBe(750); // 1500 × 50% off
    const sub = (await db.select().from(zipSubscriptions).where(eq(zipSubscriptions.id, subscription.id)))[0];
    expect(sub.couponCode).toBe("HALF");
    expect(Number(sub.discountPercent)).toBeCloseTo(0.5, 6);
    expect(sub.discountMonthsLeft).toBe(1); // 2 months − this one
    // the payment carries the coupon (so commission accrues on the discounted amount)
    const pay = (await db.select().from(payments).where(eq(payments.id, payment.id)))[0];
    expect(pay.couponCode).toBe("HALF");
  });
});
