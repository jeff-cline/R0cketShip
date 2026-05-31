import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { ingestRows } from "@/src/leads/ingest";
import { leadCounts } from "@/src/leads/stats";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string;
beforeEach(async () => {
  const [a] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = a.id;
});
function rows(arr: Record<string, string>[]) { return (async function* () { for (const r of arr) yield r; })(); }

describe("leadCounts", () => {
  it("counts totals, tiers, segments, and top zips (tenant-scoped)", async () => {
    const now = new Date("2026-05-31T12:00:00Z");
    await ingestRows(tA, "upload", rows([
      { sha256_lc_hem: "a", personal_zip: "30265", last_updated: "2026-05-31 00:00:00" },
      { sha256_lc_hem: "b", personal_zip: "30265", last_updated: "2026-05-28 00:00:00" },
      { sha256_lc_hem: "c", personal_zip: "10001", company_name: "Acme", last_updated: "2026-01-01 00:00:00" },
    ]));
    const s = await leadCounts(tA, now);
    expect(s.total).toBe(3);
    expect(s.byTier.real_time).toBe(1);
    expect(s.byTier.one_week).toBe(1);
    expect(s.byTier.older).toBe(1);
    expect(s.bySegment.residential).toBe(2);
    expect(s.bySegment.commercial).toBe(1);
    expect(s.topZips[0]).toEqual({ zip: "30265", count: 2 });
  });
});
