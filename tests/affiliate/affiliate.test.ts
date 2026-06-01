import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { getOrCreateCode, codeOwner } from "@/src/affiliate/code";
import { recordReferral, affiliateStats } from "@/src/affiliate/referral";
import { getWalletForUser } from "@/src/billing/wallet";
import { walletBalance } from "@/src/billing/ledger";
import { createTopup, confirmPayment } from "@/src/billing/topup";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string, aff: string, referred: string, other: string;
beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
  aff = (await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "aff@roofers.co", role: "customer", tempPassword: "x" })).id;
  referred = (await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "ref@roofers.co", role: "customer", tempPassword: "x" })).id;
  other = (await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "other@roofers.co", role: "customer", tempPassword: "x" })).id;
});

describe("affiliate", () => {
  it("getOrCreateCode is stable + idempotent", async () => {
    const a = await getOrCreateCode(aff);
    expect(a).toMatch(/^[A-Z0-9]+$/);
    expect(await getOrCreateCode(aff)).toBe(a);
    expect(await codeOwner(a)).toBe(aff);
  });
  it("recordReferral links a valid code; rejects self / unknown / already-referred", async () => {
    const code = await getOrCreateCode(aff);
    expect(await recordReferral(aff, code)).toBe(false); // self
    expect(await recordReferral(referred, "NOPE")).toBe(false); // unknown
    expect(await recordReferral(referred, code)).toBe(true);
    expect(await recordReferral(referred, code)).toBe(false); // already referred
  });
  it("a referred customer's confirmed top-up pays the referrer 10%", async () => {
    const code = await getOrCreateCode(aff);
    await recordReferral(referred, code);
    const affWallet = (await getWalletForUser(aff))!;
    expect(await walletBalance(affWallet.id)).toBe(50);
    const { payment } = await createTopup((await getWalletForUser(referred))!.id, 20);
    await confirmPayment(payment.id);
    expect(await walletBalance(affWallet.id)).toBe(52); // 50 + 10% of 20
    const stats = await affiliateStats(aff);
    expect(stats.referrals).toBe(1);
    expect(stats.earnedCredits).toBe(2);
  });
  it("a NON-referred customer's top-up pays no commission", async () => {
    const code = await getOrCreateCode(aff);
    const affWallet = (await getWalletForUser(aff))!;
    const { payment } = await createTopup((await getWalletForUser(other))!.id, 20);
    await confirmPayment(payment.id);
    expect(await walletBalance(affWallet.id)).toBe(50); // unchanged
  });
});
