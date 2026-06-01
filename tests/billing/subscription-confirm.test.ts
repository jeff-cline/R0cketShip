import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, zipSubscriptions } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { createUser } from "@/src/auth/users";
import { getWalletForUser } from "@/src/billing/wallet";
import { walletBalance } from "@/src/billing/ledger";
import { subscribeZip } from "@/src/billing/subscriptions";
import { confirmPayment } from "@/src/billing/topup";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string, customerId: string, walletId: string;

beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "sub-confirm.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
  const u = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c@sub-confirm.co", role: "customer", tempPassword: "x" });
  customerId = u.id;
  walletId = (await getWalletForUser(u.id))!.id;
});

describe("subscription payment confirmation", () => {
  it("confirming a subscription payment advances paid_through and grants NO credits", async () => {
    const { subscription, payment } = await subscribeZip(customerId, "30265");
    const balBefore = await walletBalance(walletId);
    await confirmPayment(payment.id);
    expect(await walletBalance(walletId)).toBe(balBefore); // no credit granted
    const sub = (await db.select().from(zipSubscriptions).where(eq(zipSubscriptions.id, subscription.id)))[0];
    expect(sub.paidThrough).not.toBeNull();
  });
});
