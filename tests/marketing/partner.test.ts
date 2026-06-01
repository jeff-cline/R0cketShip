import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { submitApplication, listApplications } from "@/src/marketing/partner";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string;
beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
});

describe("epartner applications", () => {
  it("stores an application and lists it (tenant-scoped)", async () => {
    await submitApplication(tA, { name: "Pat", businessName: "Pat Roofing", annualRevenue: "5000000", agreeExit: true, approachedBefore: false });
    const rows = await listApplications(tA);
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe("Pat");
    expect(rows[0].agreeExit).toBe(true);
  });
});
