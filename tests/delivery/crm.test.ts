import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, leads, persons } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { purchaseLeads } from "@/src/delivery/purchase";
import { myDeliveries, updateDelivery, deliveryStats, deliveriesCsv } from "@/src/delivery/crm";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
const now = new Date("2026-05-31T12:00:00Z");
let tA: string, c1: string, c2: string;

async function addLead(sha: string) {
  const [p] = await db.insert(persons).values({ shaLcHem: sha }).returning();
  const [l] = await db.insert(leads).values({ tenantId: tA, personId: p.id, shaLcHem: sha, firstName: "Sue", zip: "30265", segment: "residential", lastUpdated: new Date("2026-01-01"), source: "upload" }).returning();
  return l.id;
}

beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
  c1 = (await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c1@roofers.co", role: "customer", tempPassword: "x" })).id;
  c2 = (await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c2@roofers.co", role: "customer", tempPassword: "x" })).id;
});

describe("crm", () => {
  it("myDeliveries returns full contact for the owner", async () => {
    const id = await addLead("h1");
    await purchaseLeads(c1, [id], now);
    const rows = await myDeliveries(c1);
    expect(rows.length).toBe(1);
    expect(rows[0].firstName).toBe("Sue");
    expect(rows[0].status).toBe("new");
  });

  it("updateDelivery: owner can update; another customer cannot", async () => {
    const id = await addLead("h1");
    const res = await purchaseLeads(c1, [id], now);
    const deliveryId = res.delivered[0].deliveryId;
    await updateDelivery(c1, deliveryId, { status: "sold", saleValue: 9000, notes: "won" });
    expect((await myDeliveries(c1))[0].status).toBe("sold");
    await expect(updateDelivery(c2, deliveryId, { status: "dead" })).rejects.toThrow();
  });

  it("deliveryStats counts conversions and revenue", async () => {
    const a = await addLead("h1"); const b = await addLead("h2");
    const r = await purchaseLeads(c1, [a, b], now);
    await updateDelivery(c1, r.delivered[0].deliveryId, { status: "sold", saleValue: 9000 });
    await updateDelivery(c1, r.delivered[1].deliveryId, { status: "booked" });
    const s = await deliveryStats(c1);
    expect(s.delivered).toBe(2);
    expect(s.conversions).toBe(2);
    expect(s.revenue).toBe(9000);
    expect(s.creditsSpent).toBe(2.88);
  });

  it("deliveriesCsv produces a header + rows", () => {
    const csv = deliveriesCsv([
      { firstName: "Sue", lastName: "X", zip: "30265", status: "new", priceCredits: "1.44", saleValue: null, phones: "+1800", emails: "a@b.co" } as any,
    ]);
    expect(csv.split("\n")[0]).toContain("first_name");
    expect(csv).toContain("Sue");
  });
});
