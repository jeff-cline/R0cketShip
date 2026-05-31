import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, leads, persons } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { searchAvailableLeads, availableCount, pickAvailableLeads } from "@/src/delivery/search";
import { purchaseLeads } from "@/src/delivery/purchase";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
const now = new Date("2026-05-31T12:00:00Z");
let tA: string, customerId: string;

async function addLead(sha: string, opts: { zip?: string; segment?: "residential" | "commercial"; lastUpdated?: string; score?: string }) {
  const [p] = await db.insert(persons).values({ shaLcHem: sha }).returning();
  const [l] = await db.insert(leads).values({
    tenantId: tA, personId: p.id, shaLcHem: sha, zip: opts.zip ?? "30265",
    segment: opts.segment ?? "residential", scoreCategory: opts.score ?? "low",
    lastUpdated: opts.lastUpdated ? new Date(opts.lastUpdated) : null, source: "upload",
  }).returning();
  return l.id;
}

beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
  const u = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "x" });
  customerId = u.id;
});

describe("searchAvailableLeads", () => {
  it("returns preview rows with tier + price and no PII", async () => {
    await addLead("h1", { lastUpdated: "2026-05-31 00:00:00" }); // real_time -> 11
    const rows = await searchAvailableLeads(customerId, tA, {}, 100, now);
    expect(rows.length).toBe(1);
    expect(rows[0]).toMatchObject({ zip: "30265", tier: "real_time", price: 11 });
    expect(rows[0]).not.toHaveProperty("firstName");
    expect(rows[0]).not.toHaveProperty("personalPhones");
  });

  it("honors zip / segment / score / tier filters", async () => {
    await addLead("h1", { zip: "30265", segment: "residential", score: "high", lastUpdated: "2026-05-31 00:00:00" });
    await addLead("h2", { zip: "10001", segment: "commercial", score: "low", lastUpdated: "2026-01-01 00:00:00" });
    expect((await searchAvailableLeads(customerId, tA, { zips: ["30265"] }, 100, now)).length).toBe(1);
    expect((await searchAvailableLeads(customerId, tA, { segment: "commercial" }, 100, now)).length).toBe(1);
    expect((await searchAvailableLeads(customerId, tA, { score: "high" }, 100, now)).length).toBe(1);
    expect((await searchAvailableLeads(customerId, tA, { tier: "older" }, 100, now)).length).toBe(1);
  });

  it("excludes leads the customer already purchased", async () => {
    const id = await addLead("h1", { lastUpdated: "2026-01-01 00:00:00" }); // older -> 1.44
    await purchaseLeads(customerId, [id], now);
    expect((await searchAvailableLeads(customerId, tA, {}, 100, now)).length).toBe(0);
    expect(await availableCount(customerId, tA, {}, now)).toBe(0);
  });

  it("pickAvailableLeads returns freshest-first ids up to the limit", async () => {
    const older = await addLead("h1", { lastUpdated: "2026-01-01 00:00:00" });
    const newer = await addLead("h2", { lastUpdated: "2026-05-30 00:00:00" });
    const picked = await pickAvailableLeads(customerId, tA, {}, 1, now);
    expect(picked).toEqual([newer]);
  });
});
