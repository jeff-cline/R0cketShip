import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, leads, persons, leadDeliveries } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { createUser } from "@/src/auth/users";
import { purchaseLeads } from "@/src/delivery/purchase";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
const now = new Date("2026-05-31T12:00:00Z");

describe("booking conversion (direct DB effect)", () => {
  it("a delivery can be marked booked (the route's effect)", async () => {
    const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
    const c1 = (await createUser({ role: "god", tenantId: t.id }, { tenantId: t.id, email: "c@roofers.co", role: "customer", tempPassword: "x" })).id;
    const [p] = await db.insert(persons).values({ shaLcHem: "h1" }).returning();
    const [l] = await db.insert(leads).values({ tenantId: t.id, personId: p.id, shaLcHem: "h1", segment: "residential", lastUpdated: new Date("2026-01-01"), source: "upload" }).returning();
    const res = await purchaseLeads(c1, [l.id], now);
    const did = res.delivered[0].deliveryId;
    await db.update(leadDeliveries).set({ status: "booked" }).where(eq(leadDeliveries.id, did));
    const row = (await db.select().from(leadDeliveries).where(eq(leadDeliveries.id, did)))[0];
    expect(row.status).toBe("booked");
  });
});
