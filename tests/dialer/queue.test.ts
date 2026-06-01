import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, leads, persons, leadDeliveries } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { createUser } from "@/src/auth/users";
import { purchaseLeads } from "@/src/delivery/purchase";
import { nextLeadToCall, recordCall, agentKpis } from "@/src/dialer/queue";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
const now = new Date("2026-05-31T12:00:00Z");
let tA: string, agent: string;
async function addLead(sha: string, lu: string) {
  const [p] = await db.insert(persons).values({ shaLcHem: sha }).returning();
  const [l] = await db.insert(leads).values({ tenantId: tA, personId: p.id, shaLcHem: sha, zip: "30265", segment: "residential", lastUpdated: new Date(lu), source: "upload" }).returning();
  return l.id;
}
beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
  agent = (await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "agent@roofers.co", role: "agent", tempPassword: "x" })).id;
});

describe("call queue", () => {
  it("nextLeadToCall returns an un-worked lead, then excludes a terminal disposition", async () => {
    const a = await addLead("h1", "2026-05-30");
    const first = await nextLeadToCall(tA, now);
    expect(first?.id).toBe(a);
    await recordCall(tA, a, agent, { disposition: "dead" });
    expect(await nextLeadToCall(tA, now)).toBeNull(); // only lead is now terminal
  });
  it("a future callback is not due; a past callback is", async () => {
    const a = await addLead("h1", "2026-05-30");
    await recordCall(tA, a, agent, { disposition: "callback", callbackAt: new Date("2026-06-15") });
    expect(await nextLeadToCall(tA, now)).toBeNull(); // callback in the future
    await recordCall(tA, a, agent, { disposition: "callback", callbackAt: new Date("2026-05-01") });
    expect((await nextLeadToCall(tA, now))?.id).toBe(a); // due
  });
  it("recordCall booked mirrors to the delivery; agentKpis aggregates", async () => {
    const a = await addLead("h1", "2026-01-01");
    const cust = (await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "x" })).id;
    await purchaseLeads(cust, [a], now);
    await recordCall(tA, a, agent, { disposition: "sold", saleValue: 9000 });
    const d = (await db.select().from(leadDeliveries).where(eq(leadDeliveries.leadId, a)))[0];
    expect(d.status).toBe("sold");
    const k = await agentKpis(agent);
    expect(k.calls).toBe(1);
    expect(k.bookings).toBe(1);
    expect(k.revenue).toBe(9000);
  });
});
