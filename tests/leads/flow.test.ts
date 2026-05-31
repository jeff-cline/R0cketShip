import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tenants, persons, leads } from "@/src/db/schema";
import { parseCsvStream } from "@/src/leads/parse";
import { ingestRows } from "@/src/leads/ingest";
import { leadCounts } from "@/src/leads/stats";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string;
beforeEach(async () => {
  const [a] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = a.id;
});

describe("ingestion flow (CSV)", () => {
  it("ingests a CSV with multi-value phones, dedupes on re-import, and reports counts", async () => {
    const csv =
      'sha256_lc_hem,first_name,personal_phone,personal_zip,company_name,last_updated\n' +
      'h1,Susan,"+1850, +1851",32301,,2026-05-30 00:00:00\n' +
      'h2,Glen,+1770,30265,Pallas Inc,2026-01-01 00:00:00\n';

    const s1 = await ingestRows(tA, "upload", parseCsvStream(csv));
    expect(s1).toEqual({ inserted: 2, updated: 0, skipped: 0, errors: 0 });

    const h1 = (await db.select().from(leads).where(eq(leads.shaLcHem, "h1")))[0];
    expect(h1.personalPhones).toEqual(["+1850", "+1851"]);
    expect(h1.segment).toBe("residential");
    const h2 = (await db.select().from(leads).where(eq(leads.shaLcHem, "h2")))[0];
    expect(h2.segment).toBe("commercial");

    const s2 = await ingestRows(tA, "upload", parseCsvStream(csv));
    expect(s2).toEqual({ inserted: 0, updated: 0, skipped: 2, errors: 0 });
    expect((await db.select().from(persons)).length).toBe(2);

    const counts = await leadCounts(tA, new Date("2026-05-31T12:00:00Z"));
    expect(counts.total).toBe(2);
    expect(counts.bySegment).toEqual({ residential: 1, commercial: 1 });
  });
});
