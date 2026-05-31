import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tenants, leads, persons, leadDeliveries } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { getWalletForUser } from "@/src/billing/wallet";
import { walletBalance } from "@/src/billing/ledger";
import { purchaseLeads } from "@/src/delivery/purchase";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
const now = new Date("2026-05-31T12:00:00Z");
let tA: string, customerId: string;

async function addLead(sha: string, lastUpdated: string) {
  const [p] = await db.insert(persons).values({ shaLcHem: sha }).returning();
  const [l] = await db.insert(leads).values({ tenantId: tA, personId: p.id, shaLcHem: sha, zip: "30265", segment: "residential", lastUpdated: new Date(lastUpdated), source: "upload" }).returning();
  return l.id;
}

beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
  const u = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "x" });
  customerId = u.id;
});

describe("purchaseLeads", () => {
  it("debits the summed price and creates deliveries", async () => {
    const a = await addLead("h1", "2026-01-01 00:00:00"); // older 1.44
    const b = await addLead("h2", "2026-01-01 00:00:00"); // older 1.44
    const res = await purchaseLeads(customerId, [a, b], now);
    expect(res.totalCharged).toBe(2.88);
    expect(res.delivered.length).toBe(2);
    const w = (await getWalletForUser(customerId))!;
    expect(await walletBalance(w.id)).toBe(47.12); // 50 - 2.88
    expect((await db.select().from(leadDeliveries)).length).toBe(2);
  });

  it("rejects when balance is insufficient and charges nothing", async () => {
    // 5 real_time leads at 11 each = 55 > 50
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) ids.push(await addLead(`r${i}`, "2026-05-31 00:00:00"));
    await expect(purchaseLeads(customerId, ids, now)).rejects.toThrow(/insufficient/i);
    const w = (await getWalletForUser(customerId))!;
    expect(await walletBalance(w.id)).toBe(50); // unchanged
    expect((await db.select().from(leadDeliveries)).length).toBe(0);
  });

  it("skips leads the customer already owns (no double charge)", async () => {
    const a = await addLead("h1", "2026-01-01 00:00:00");
    await purchaseLeads(customerId, [a], now);
    const res = await purchaseLeads(customerId, [a], now);
    expect(res).toMatchObject({ totalCharged: 0, skipped: 1 });
    const w = (await getWalletForUser(customerId))!;
    expect(await walletBalance(w.id)).toBe(48.56); // charged once: 50 - 1.44
  });

  it("ignores lead ids from another tenant", async () => {
    const [tB] = await db.insert(tenants).values({ domain: "solar.co", niche: "solar", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
    const [p] = await db.insert(persons).values({ shaLcHem: "x" }).returning();
    const [foreign] = await db.insert(leads).values({ tenantId: tB.id, personId: p.id, shaLcHem: "x", segment: "residential", source: "upload" }).returning();
    const res = await purchaseLeads(customerId, [foreign.id], now);
    expect(res.delivered.length).toBe(0);
  });
});
