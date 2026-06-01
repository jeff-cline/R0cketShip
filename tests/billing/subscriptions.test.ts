import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, payments } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { createUser } from "@/src/auth/users";
import { subscribeZip, cancelZip, listSubscriptions, subscribedZips } from "@/src/billing/subscriptions";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string, c1: string, c2: string;
beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
  c1 = (await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c1@roofers.co", role: "customer", tempPassword: "x" })).id;
  c2 = (await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c2@roofers.co", role: "customer", tempPassword: "x" })).id;
});

describe("zip subscriptions", () => {
  it("first ZIP is full price + creates a pending subscription payment", async () => {
    const { subscription, payment } = await subscribeZip(c1, "30265");
    expect(Number(subscription.monthlyPrice)).toBe(1500);
    expect(payment.status).toBe("pending");
    expect(payment.purpose).toBe("subscription");
    expect(Number(payment.credits)).toBe(0);
    expect([...(await subscribedZips(c1))]).toEqual(["30265"]);
  });
  it("second ZIP gets the 10% volume discount", async () => {
    await subscribeZip(c1, "30265");
    const { subscription } = await subscribeZip(c1, "30266");
    expect(Number(subscription.monthlyPrice)).toBe(1350);
  });
  it("rejects a duplicate active ZIP", async () => {
    await subscribeZip(c1, "30265");
    await expect(subscribeZip(c1, "30265")).rejects.toThrow();
  });
  it("cancel is owner-only and removes it from subscribedZips", async () => {
    const { subscription } = await subscribeZip(c1, "30265");
    await expect(cancelZip(c2, subscription.id)).rejects.toThrow();
    await cancelZip(c1, subscription.id);
    expect((await subscribedZips(c1)).size).toBe(0);
    expect((await listSubscriptions(c1)).length).toBe(1); // still listed as canceled
  });
});
