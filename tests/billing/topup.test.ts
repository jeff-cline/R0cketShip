import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tenants, coupons } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { getWalletForUser } from "@/src/billing/wallet";
import { walletBalance } from "@/src/billing/ledger";
import { createTopup, confirmPayment, listPendingPayments } from "@/src/billing/topup";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string, walletId: string;
beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
  const u = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "x" });
  walletId = (await getWalletForUser(u.id))!.id;
});

describe("top-up + confirm", () => {
  it("creates a pending payment and does not change the balance until confirmed", async () => {
    const { payment, start } = await createTopup(walletId, 20);
    expect(start.kind).toBe("manual");
    expect(payment.status).toBe("pending");
    expect(Number(payment.credits)).toBe(20);
    expect(await walletBalance(walletId)).toBe(50);
    expect((await listPendingPayments(tA)).length).toBe(1);
  });

  it("applies a fixed-credits coupon to the credited amount", async () => {
    await db.insert(coupons).values({ code: "PLUS10", kind: "fixed_credits", value: "10" });
    const { payment } = await createTopup(walletId, 20, "PLUS10");
    expect(Number(payment.credits)).toBe(30);
    await confirmPayment(payment.id);
    expect(await walletBalance(walletId)).toBe(80);
  });

  it("confirm is idempotent — double confirm credits once", async () => {
    const { payment } = await createTopup(walletId, 20);
    await confirmPayment(payment.id);
    await confirmPayment(payment.id);
    expect(await walletBalance(walletId)).toBe(70);
  });

  it("confirming increments coupon redemptions exactly once", async () => {
    await db.insert(coupons).values({ code: "ONCE5", kind: "fixed_credits", value: "5", maxRedemptions: 1 });
    const { payment } = await createTopup(walletId, 10, "ONCE5");
    await confirmPayment(payment.id);
    await confirmPayment(payment.id);
    const c = (await db.select().from(coupons).where(eq(coupons.code, "ONCE5")))[0];
    expect(c.timesRedeemed).toBe(1);
  });

  it("rejects a top-up with an invalid coupon", async () => {
    await expect(createTopup(walletId, 20, "NOPE")).rejects.toThrow();
  });
});
