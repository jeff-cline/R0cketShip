import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { resolveTenant, clearTenantCache } from "@/src/tenant/cache";
import type { TenantTheme, Offer } from "@/src/tenant/types";

const offers: Offer[] = [{ id: 1, title: "Data", description: "d", price: "p" }];
function theme(accent: string): TenantTheme {
  return { primary: "#000", secondary: "#111", accent, background: "#fff", foreground: "#000", fontFamily: "sans-serif" };
}

beforeEach(async () => {
  clearTenantCache();
  await db.insert(tenants).values([
    { domain: "roofers.co", niche: "roofing", moneyWord: "roofing leads", theme: theme("#e58e26"), offers, monthlyPriceDefault: "1500" },
    { domain: "solarpros.co", niche: "solar", moneyWord: "solar leads", theme: theme("#16a34a"), offers, monthlyPriceDefault: "1200" },
  ]);
});

describe("multi-tenant resolution", () => {
  it("resolves each host to its own config and theme", async () => {
    const roofers = await resolveTenant("roofers.co");
    const solar = await resolveTenant("solarpros.co");
    expect(roofers?.moneyWord).toBe("roofing leads");
    expect(roofers?.theme.accent).toBe("#e58e26");
    expect(solar?.moneyWord).toBe("solar leads");
    expect(solar?.theme.accent).toBe("#16a34a");
    expect(solar?.monthlyPriceDefault).toBe("1200");
  });
});
