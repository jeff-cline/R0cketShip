import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, leads, persons, creditLedger } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { createUser } from "@/src/auth/users";
import { getWalletForUser } from "@/src/billing/wallet";
import { walletBalance } from "@/src/billing/ledger";
import { subscribeZip } from "@/src/billing/subscriptions";
import { purchaseLeads } from "@/src/delivery/purchase";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
const now = new Date("2026-05-31T12:00:00Z");
let tA: string, c1: string;
async function addLead(sha: string, zip: string) {
  const [p] = await db.insert(persons).values({ shaLcHem: sha }).returning();
  const [l] = await db.insert(leads).values({ tenantId: tA, personId: p.id, shaLcHem: sha, zip, segment: "residential", lastUpdated: new Date("2026-05-31"), source: "upload" }).returning();
  return l.id;
}
beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
  c1 = (await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c1@roofers.co", role: "customer", tempPassword: "x" })).id;
});

describe("subscribed ZIP delivers free leads", () => {
  it("a lead in a subscribed ZIP costs 0 and writes no lead_charge", async () => {
    await subscribeZip(c1, "30265");
    const id = await addLead("h1", "30265"); // real_time would be 11, but subscribed -> 0
    const res = await purchaseLeads(c1, [id], now);
    expect(res.totalCharged).toBe(0);
    const w = (await getWalletForUser(c1))!;
    expect(await walletBalance(w.id)).toBe(50); // unchanged
    expect((await db.select().from(creditLedger).where(eq(creditLedger.type, "lead_charge"))).length).toBe(0);
  });
  it("a lead in a NON-subscribed ZIP keeps tier pricing", async () => {
    await subscribeZip(c1, "30265");
    const id = await addLead("h2", "99999"); // not subscribed, real_time -> 11
    const res = await purchaseLeads(c1, [id], now);
    expect(res.totalCharged).toBe(11);
  });
});
