import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { createCoupon, validateCoupon, listCoupons } from "@/src/billing/coupons";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string, tB: string;
beforeEach(async () => {
  const [a] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  const [b] = await db.insert(tenants).values({ domain: "solar.co", niche: "solar", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = a.id; tB = b.id;
});

describe("coupons", () => {
  it("fixed_credits coupon yields its value as bonus", async () => {
    await createCoupon({ code: "SAVE10", kind: "fixed_credits", value: 10, tenantId: tA });
    expect(await validateCoupon("SAVE10", tA, 20)).toEqual({ ok: true, bonusCredits: 10 });
  });

  it("percent coupon yields a percentage of the USD amount", async () => {
    await createCoupon({ code: "PCT25", kind: "percent", value: 25, tenantId: null });
    expect(await validateCoupon("PCT25", tA, 80)).toEqual({ ok: true, bonusCredits: 20 });
  });

  it("rejects inactive, expired, over-max, and wrong-tenant", async () => {
    await createCoupon({ code: "OFF", kind: "fixed_credits", value: 5, active: false });
    expect((await validateCoupon("OFF", tA, 10)).ok).toBe(false);
    await createCoupon({ code: "OLD", kind: "fixed_credits", value: 5, expiresAt: new Date(Date.now() - 1000) });
    expect((await validateCoupon("OLD", tA, 10)).ok).toBe(false);
    await createCoupon({ code: "ONCE", kind: "fixed_credits", value: 5, maxRedemptions: 0 });
    expect((await validateCoupon("ONCE", tA, 10)).ok).toBe(false);
    await createCoupon({ code: "BONLY", kind: "fixed_credits", value: 5, tenantId: tB });
    expect((await validateCoupon("BONLY", tA, 10)).ok).toBe(false);
  });

  it("rejects an unknown code", async () => {
    expect((await validateCoupon("NOPE", tA, 10)).ok).toBe(false);
  });

  it("lists coupons", async () => {
    await createCoupon({ code: "L1", kind: "fixed_credits", value: 5 });
    expect((await listCoupons()).length).toBe(1);
  });
});
