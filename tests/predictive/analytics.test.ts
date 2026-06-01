import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, leads, persons } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { purchaseLeads } from "@/src/delivery/purchase";
import { updateDelivery } from "@/src/delivery/crm";
import { convertedHashes, globalLeadCounts, predictiveLeads } from "@/src/predictive/analytics";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
const now = new Date("2026-05-31T12:00:00Z");
let tA: string, tB: string;
async function addLead(tenantId: string, sha: string, opts: { zip?: string; score?: string; lu?: string }) {
  const existing = (await db.select().from(persons).where((await import("drizzle-orm")).eq(persons.shaLcHem, sha)).limit(1))[0];
  const p = existing ?? (await db.insert(persons).values({ shaLcHem: sha }).returning())[0];
  const [l] = await db.insert(leads).values({ tenantId, personId: p.id, shaLcHem: sha, zip: opts.zip ?? "30265", segment: "residential", scoreCategory: opts.score ?? "low", lastUpdated: opts.lu ? new Date(opts.lu) : null, source: "upload" }).returning();
  return l.id;
}
beforeEach(async () => {
  const [a] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  const [b] = await db.insert(tenants).values({ domain: "solar.co", niche: "solar", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = a.id; tB = b.id;
});

describe("predictive analytics", () => {
  it("convertedHashes includes a person sold in another tenant", async () => {
    const sharedLeadB = await addLead(tB, "shared", { lu: "2026-01-01" });
    const custB = (await createUser({ role: "god", tenantId: tB }, { tenantId: tB, email: "cb@solar.co", role: "customer", tempPassword: "x" })).id;
    const res = await purchaseLeads(custB, [sharedLeadB], now);
    await updateDelivery(custB, res.delivered[0].deliveryId, { status: "sold", saleValue: 9000 });
    const h = await convertedHashes();
    expect(h.has("shared")).toBe(true);
    expect(h.has("nobody")).toBe(false);
  });

  it("predictiveLeads ranks a high-intent converted-elsewhere lead above a cold one", async () => {
    // person 'shared' converted in tenant B; also present in tenant A with high intent + recent
    const sharedB = await addLead(tB, "shared", { lu: "2026-01-01" });
    const custB = (await createUser({ role: "god", tenantId: tB }, { tenantId: tB, email: "cb@solar.co", role: "customer", tempPassword: "x" })).id;
    const r = await purchaseLeads(custB, [sharedB], now);
    await updateDelivery(custB, r.delivered[0].deliveryId, { status: "sold", saleValue: 1 });
    await addLead(tA, "shared", { zip: "30265", score: "high", lu: "2026-05-31" }); // hot in tenant A
    await addLead(tA, "cold", { zip: "10001", score: "low", lu: "2026-01-01" });    // cold in tenant A
    const ranked = await predictiveLeads(tA, 25, now);
    expect(ranked[0].scoreCategory).toBe("high");
    expect(ranked[0].convertedElsewhere).toBe(true);
    expect(ranked[0].score).toBeGreaterThan(ranked[ranked.length - 1].score);
  });

  it("globalLeadCounts counts distinct + cross-site persons across two tenants sharing a hash", async () => {
    await addLead(tA, "shared", { lu: "2026-05-31" });
    await addLead(tB, "shared", { lu: "2026-05-31" });
    await addLead(tA, "solo", { lu: "2026-05-31" });
    const g = await globalLeadCounts(now);
    expect(g.totalLeads).toBe(3);
    expect(g.distinctPersons).toBe(2); // shared + solo
    expect(g.crossSitePersons).toBe(1); // shared spans A + B
  });
});
