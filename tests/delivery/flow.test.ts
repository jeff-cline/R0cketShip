import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, leads, persons } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { getWalletForUser } from "@/src/billing/wallet";
import { walletBalance } from "@/src/billing/ledger";
import { searchAvailableLeads } from "@/src/delivery/search";
import { purchaseLeads } from "@/src/delivery/purchase";
import { myDeliveries, updateDelivery, deliveryStats } from "@/src/delivery/crm";

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

describe("delivery flow", () => {
  it("buy → CRM → mark sold → non-exclusive for second customer", async () => {
    const a = await addLead("h1"); const b = await addLead("h2");
    const res = await purchaseLeads(c1, [a, b], now);
    expect(res.totalCharged).toBe(2.88);
    const w1 = (await getWalletForUser(c1))!;
    expect(await walletBalance(w1.id)).toBe(47.12);

    expect((await searchAvailableLeads(c1, tA, {}, 100, now)).length).toBe(0);
    expect((await searchAvailableLeads(c2, tA, {}, 100, now)).length).toBe(2);
    await purchaseLeads(c2, [a], now);
    const w2 = (await getWalletForUser(c2))!;
    expect(await walletBalance(w2.id)).toBe(48.56);

    const d = (await myDeliveries(c1))[0];
    await updateDelivery(c1, d.deliveryId, { status: "sold", saleValue: 9000 });
    const s = await deliveryStats(c1);
    expect(s.conversions).toBe(1);
    expect(s.revenue).toBe(9000);
  });
});
