import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import * as repo from "@/src/tenant/repo";
import { resolveTenant, clearTenantCache } from "@/src/tenant/cache";
import type { TenantTheme, Offer } from "@/src/tenant/types";

const theme: TenantTheme = {
  primary: "#0a3d62", secondary: "#3c6382", accent: "#e58e26",
  background: "#ffffff", foreground: "#0b132b", fontFamily: "system-ui",
};
const offers: Offer[] = [{ id: 1, title: "Data", description: "d", price: "$1,500/mo" }];

beforeEach(() => clearTenantCache());

async function insertRoofers() {
  await db.insert(tenants).values({
    domain: "roofers.co", niche: "roofing", moneyWord: "roofing leads",
    theme, offers, monthlyPriceDefault: "1500",
  });
}

describe("resolveTenant", () => {
  it("returns the same tenant as the repo", async () => {
    await insertRoofers();
    const t = await resolveTenant("roofers.co");
    expect(t?.domain).toBe("roofers.co");
  });

  it("caches results so the repo is not queried twice within TTL", async () => {
    await insertRoofers();
    const spy = vi.spyOn(repo, "getTenantByHost");
    await resolveTenant("roofers.co");
    await resolveTenant("roofers.co");
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
