import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tenants, persons, leads } from "@/src/db/schema";
import { ingestRows } from "@/src/leads/ingest";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string, tB: string;
beforeEach(async () => {
  const [a] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  const [b] = await db.insert(tenants).values({ domain: "solar.co", niche: "solar", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = a.id; tB = b.id;
});
function rows(arr: Record<string, string>[]) { return (async function* () { for (const r of arr) yield r; })(); }

describe("ingestRows", () => {
  it("inserts new leads and creates one person per hash", async () => {
    const s = await ingestRows(tA, "upload", rows([
      { sha256_lc_hem: "h1", personal_zip: "30265", last_updated: "2026-05-01 00:00:00" },
      { sha256_lc_hem: "h2", personal_zip: "30265", company_name: "Acme", last_updated: "2026-05-01 00:00:00" },
    ]));
    expect(s).toEqual({ inserted: 2, updated: 0, skipped: 0, errors: 0 });
    expect((await db.select().from(persons)).length).toBe(2);
    expect((await db.select().from(leads).where(eq(leads.tenantId, tA))).length).toBe(2);
  });

  it("ingests a row missing the hash by deriving a key from email (no data lost)", async () => {
    const s = await ingestRows(tA, "upload", rows([{ business_email: "a@b.com", personal_zip: "30265" }]));
    expect(s.inserted).toBe(1);
    expect(s.errors).toBe(0);
  });

  it("derives a row-hash key when only a zip is present, and errors only on a truly empty row", async () => {
    const s = await ingestRows(tA, "upload", rows([{ personal_zip: "30265" }, { personal_zip: "" }]));
    expect(s.inserted).toBe(1);
    expect(s.errors).toBe(1);
  });

  it("re-importing the same row does not duplicate (skips when not newer)", async () => {
    const row = { sha256_lc_hem: "h1", personal_zip: "1", last_updated: "2026-05-01 00:00:00" };
    await ingestRows(tA, "upload", rows([row]));
    const s = await ingestRows(tA, "upload", rows([row]));
    expect(s).toEqual({ inserted: 0, updated: 0, skipped: 1, errors: 0 });
    expect((await db.select().from(leads).where(eq(leads.tenantId, tA))).length).toBe(1);
  });

  it("updates in place when last_updated is newer", async () => {
    await ingestRows(tA, "upload", rows([{ sha256_lc_hem: "h1", personal_zip: "1", last_updated: "2026-05-01 00:00:00" }]));
    const s = await ingestRows(tA, "upload", rows([{ sha256_lc_hem: "h1", personal_zip: "2", last_updated: "2026-05-10 00:00:00" }]));
    expect(s).toEqual({ inserted: 0, updated: 1, skipped: 0, errors: 0 });
    const row = (await db.select().from(leads).where(eq(leads.tenantId, tA)))[0];
    expect(row.zip).toBe("2");
  });

  it("shares one person across two tenants (one person, two leads)", async () => {
    await ingestRows(tA, "upload", rows([{ sha256_lc_hem: "shared", last_updated: "2026-05-01 00:00:00" }]));
    await ingestRows(tB, "webhook", rows([{ sha256_lc_hem: "shared", last_updated: "2026-05-01 00:00:00" }]));
    expect((await db.select().from(persons)).length).toBe(1);
    expect((await db.select().from(leads)).length).toBe(2);
  });
});
