import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { getIntegration, setIntegration, deliverLeadToWebhook } from "@/src/delivery/webhook";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string, customerId: string;
beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
  customerId = (await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "x" })).id;
});
afterEach(() => vi.unstubAllGlobals());

describe("webhook integration", () => {
  it("setIntegration upserts and getIntegration reads it back", async () => {
    await setIntegration(customerId, tA, { webhookUrl: "https://x.test/hook", webhookSecret: "s3cr3t", active: true });
    const i = await getIntegration(customerId);
    expect(i?.webhookUrl).toBe("https://x.test/hook");
    await setIntegration(customerId, tA, { webhookUrl: "https://y.test/hook", webhookSecret: null, active: false });
    const i2 = await getIntegration(customerId);
    expect(i2?.webhookUrl).toBe("https://y.test/hook");
    expect(i2?.active).toBe(false);
  });

  it("posts JSON with the secret header when configured", async () => {
    const calls: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: any) => { calls.push({ url, init }); return new Response("ok", { status: 200 }); }));
    await setIntegration(customerId, tA, { webhookUrl: "https://x.test/hook", webhookSecret: "s3cr3t", active: true });
    const integ = (await getIntegration(customerId))!;
    const status = await deliverLeadToWebhook(integ, { leadId: "l1", zip: "30265" });
    expect(status).toBe("ok");
    expect(calls[0].url).toBe("https://x.test/hook");
    expect(calls[0].init.headers["x-webhook-secret"]).toBe("s3cr3t");
    expect(JSON.parse(calls[0].init.body).zip).toBe("30265");
  });

  it("a failing endpoint does not throw and records last_status", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    await setIntegration(customerId, tA, { webhookUrl: "https://x.test/hook", webhookSecret: null, active: true });
    const integ = (await getIntegration(customerId))!;
    const status = await deliverLeadToWebhook(integ, { leadId: "l1" });
    expect(status).toMatch(/fail/i);
    const after = await getIntegration(customerId);
    expect(after?.lastStatus).toMatch(/fail/i);
  });
});
