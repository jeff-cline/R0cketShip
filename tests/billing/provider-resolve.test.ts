import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { setIntegrations } from "@/src/integrations/store";
import { resolveTopupProvider } from "@/src/billing/provider-resolve";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string;
beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
});

describe("resolveTopupProvider", () => {
  it("returns manual when no keys", async () => {
    expect((await resolveTopupProvider(tA)).name).toBe("manual");
  });
  it("returns stripe when active=stripe and a secret is set", async () => {
    await setIntegrations(tA, { stripeSecret: "sk_test_1", activePaymentProvider: "stripe" });
    expect((await resolveTopupProvider(tA)).name).toBe("stripe");
  });
  it("returns manual when active=stripe but no secret", async () => {
    await setIntegrations(tA, { activePaymentProvider: "stripe" });
    expect((await resolveTopupProvider(tA)).name).toBe("manual");
  });
  it("returns paypal when active=paypal and client+secret set", async () => {
    await setIntegrations(tA, { paypalClientId: "cid", paypalSecret: "sec", activePaymentProvider: "paypal" });
    expect((await resolveTopupProvider(tA)).name).toBe("paypal");
  });
});
