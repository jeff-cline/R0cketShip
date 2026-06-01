import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tenants, tenantIntegrations } from "@/src/db/schema";
import { getIntegrations, setIntegrations } from "@/src/integrations/store";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string;
beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
});

describe("integrations store", () => {
  it("returns defaults when nothing is set", async () => {
    const v = await getIntegrations(tA);
    expect(v.activePaymentProvider).toBe("manual");
    expect(v.stripeSecret).toBeNull();
  });
  it("set then get returns plaintext; DB holds ciphertext", async () => {
    await setIntegrations(tA, { stripeSecret: "sk_test_123", stripePublishable: "pk_test_1", activePaymentProvider: "stripe" });
    const v = await getIntegrations(tA);
    expect(v.stripeSecret).toBe("sk_test_123");
    expect(v.stripePublishable).toBe("pk_test_1");
    expect(v.activePaymentProvider).toBe("stripe");
    const raw = (await db.select().from(tenantIntegrations).where(eq(tenantIntegrations.tenantId, tA)))[0];
    expect(raw.stripeSecretEnc).not.toBe("sk_test_123");
    expect(raw.stripeSecretEnc!.startsWith("v1:")).toBe(true);
  });
  it("undefined secret fields keep the existing value (upsert)", async () => {
    await setIntegrations(tA, { stripeSecret: "sk_keep" });
    await setIntegrations(tA, { twilioAccountSid: "AC123" }); // does not touch stripe
    const v = await getIntegrations(tA);
    expect(v.stripeSecret).toBe("sk_keep");
    expect(v.twilioAccountSid).toBe("AC123");
  });
});
