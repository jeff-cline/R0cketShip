import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, coupons } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { getWalletForUser, grantCredits } from "@/src/billing/wallet";
import { walletBalance } from "@/src/billing/ledger";
import { createTopup, confirmPayment } from "@/src/billing/topup";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string;
beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
});

describe("billing flow", () => {
  it("bonus → coupon top-up → confirm → admin grant → adjustment", async () => {
    const u = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "x" });
    const w = (await getWalletForUser(u.id))!;
    expect(await walletBalance(w.id)).toBe(50);

    await db.insert(coupons).values({ code: "GET10", kind: "fixed_credits", value: "10" });
    const { payment } = await createTopup(w.id, 20, "GET10");
    expect(await walletBalance(w.id)).toBe(50);
    await confirmPayment(payment.id);
    expect(await walletBalance(w.id)).toBe(80);

    await grantCredits(w.id, 25, "promo");
    expect(await walletBalance(w.id)).toBe(105);
    await grantCredits(w.id, -5, "fix");
    expect(await walletBalance(w.id)).toBe(100);
  });
});
