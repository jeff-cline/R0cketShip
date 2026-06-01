import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tenants, payments, commissionLedger } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { getWalletForUser } from "@/src/billing/wallet";
import { getOrCreatePartnerCode, getOrCreateRepCode, attributeSignup, markActivated } from "@/src/referral/core";
import { computeCommission, accrueCommissionForPayment } from "@/src/referral/commission";
import { partnerFunnel, partnerEarnings } from "@/src/referral/reports";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };

describe("computeCommission (pure, % of earner's margin)", () => {
  it("tenant partner earns rate × white-label share", () => {
    // $100, platform fee 60% → white-label share 40% → 20% of that = $8
    expect(computeCommission(100, 0.6, 0.2, "tenant").amount).toBeCloseTo(8, 6);
  });
  it("platform rep earns rate × platform share", () => {
    // $100, platform fee 60% → 20% of the 60% = $12
    expect(computeCommission(100, 0.6, 0.2, "platform").amount).toBeCloseTo(12, 6);
  });
  it("clamps rate/fee and ignores non-positive amounts", () => {
    expect(computeCommission(-5, 0.6, 0.2, "tenant").amount).toBe(0);
    expect(computeCommission(100, 1.5, 2, "platform").amount).toBeCloseTo(100, 6); // fee→1, rate→1
  });
});

describe("referral attribution + accrual", () => {
  let tId: string;
  let ownerId: string;
  let referredId: string;
  beforeEach(async () => {
    const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500", platformFeeRate: "0.60", partnerRate: "0.20" }).returning();
    tId = t.id;
    const owner = await createUser({ role: "god", tenantId: tId }, { tenantId: tId, email: "partner@roofers.co", role: "partner", tempPassword: "x" });
    ownerId = owner.id;
    const referred = await createUser({ role: "god", tenantId: tId }, { tenantId: tId, email: "lead@roofers.co", role: "customer", tempPassword: "x" });
    referredId = referred.id;
  });

  async function paidPayment(amount: string, paidAt: Date) {
    const wallet = (await getWalletForUser(referredId))!;
    const [p] = await db.insert(payments).values({ tenantId: tId, walletId: wallet.id, provider: "stripe", amountUsd: amount, credits: amount, status: "paid", purpose: "topup", paidAt }).returning();
    return p;
  }

  it("attributes one referral, tracks the funnel, accrues commission on a paid upgrade", async () => {
    const code = await getOrCreatePartnerCode(ownerId, tId);
    expect(await attributeSignup(referredId, code.code)).toBe(true);
    expect(await attributeSignup(referredId, code.code)).toBe(false); // already attributed

    await markActivated(referredId);
    let f = await partnerFunnel(ownerId);
    expect(f).toMatchObject({ referred: 1, activated: 1, upgraded: 0 });

    const d0 = new Date("2026-03-10T00:00:00Z");
    const r = await accrueCommissionForPayment(await paidPayment("100", d0));
    expect(r.accrued).toBe(true);
    expect(r.amount).toBeCloseTo(8, 6); // tenant: 0.2 × 0.4 × 100

    f = await partnerFunnel(ownerId);
    expect(f.upgraded).toBe(1);
    expect((await partnerEarnings(ownerId)).earned).toBeCloseTo(8, 6);
  });

  it("does not accrue twice for the same payment (idempotent)", async () => {
    const code = await getOrCreatePartnerCode(ownerId, tId);
    await attributeSignup(referredId, code.code);
    const p = await paidPayment("100", new Date("2026-03-10T00:00:00Z"));
    expect((await accrueCommissionForPayment(p)).accrued).toBe(true);
    expect((await accrueCommissionForPayment(p)).accrued).toBe(false);
    const rows = await db.select().from(commissionLedger).where(eq(commissionLedger.paymentId, p.id));
    expect(rows.length).toBe(1);
  });

  it("does not accrue after the 12-month window", async () => {
    const code = await getOrCreatePartnerCode(ownerId, tId);
    await attributeSignup(referredId, code.code);
    // First payment opens the window at d0.
    await accrueCommissionForPayment(await paidPayment("100", new Date("2026-03-10T00:00:00Z")));
    // A payment 13 months later is outside the window.
    const late = await accrueCommissionForPayment(await paidPayment("100", new Date("2027-04-10T00:00:00Z")));
    expect(late.accrued).toBe(false);
  });

  it("a platform rep code earns on the platform share", async () => {
    const code = await getOrCreateRepCode(ownerId);
    await attributeSignup(referredId, code.code);
    const r = await accrueCommissionForPayment(await paidPayment("100", new Date("2026-03-10T00:00:00Z")));
    expect(r.amount).toBeCloseTo(12, 6); // platform: 0.2 × 0.6 × 100
  });
});
