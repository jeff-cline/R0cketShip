import { describe, it, expect } from "vitest";
import { createTenant, updateTenantConfig, THEME_PRESETS } from "@/src/tenant/manage";
import { getTenantByHost } from "@/src/tenant/repo";

const offers = [{ id: 1, title: "Data", description: "d", price: "$1,500/mo" }];

describe("tenant management", () => {
  it("THEME_PRESETS has >=6 distinct accents", () => {
    expect(THEME_PRESETS.length).toBeGreaterThanOrEqual(6);
    expect(new Set(THEME_PRESETS.map((t) => t.accent)).size).toBe(THEME_PRESETS.length);
  });

  it("createTenant inserts with ip, ingest key, bonus default; resolvable by host", async () => {
    const row = await createTenant({ domain: "StemCells.co", niche: "stem cells", moneyWord: "stem cell leads", offers });
    expect(row.domain).toBe("stemcells.co");
    expect(row.ip).toBe("137.220.56.129");
    expect(row.ingestKey).not.toBeNull();
    expect(row.signupBonusCredits).toBe("50");
    const resolved = await getTenantByHost("stemcells.co");
    expect(resolved?.moneyWord).toBe("stem cell leads");
  });

  it("rejects a duplicate domain", async () => {
    await createTenant({ domain: "dup.co", niche: "x", moneyWord: "m", offers });
    await expect(createTenant({ domain: "dup.co", niche: "x", moneyWord: "m", offers })).rejects.toThrow();
  });

  it("updateTenantConfig updates only provided fields", async () => {
    const row = await createTenant({ domain: "edit.co", niche: "x", moneyWord: "old", offers });
    await updateTenantConfig(row.id, { moneyWord: "new word", monthlyPriceDefault: "2000" });
    const resolved = await getTenantByHost("edit.co");
    expect(resolved?.moneyWord).toBe("new word");
    expect(resolved?.monthlyPriceDefault).toBe("2000");
    expect(resolved?.niche).toBe("x"); // untouched
  });
});
