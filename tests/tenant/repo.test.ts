import { describe, it, expect } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { getTenantByHost } from "@/src/tenant/repo";
import type { TenantTheme, Offer } from "@/src/tenant/types";

const theme: TenantTheme = {
  primary: "#0a3d62",
  secondary: "#3c6382",
  accent: "#e58e26",
  background: "#ffffff",
  foreground: "#0b132b",
  fontFamily: "system-ui, sans-serif",
};
const offers: Offer[] = [
  { id: 1, title: "Data / Leads", description: "New leads in your ZIP", price: "$1,500/mo per ZIP" },
];

async function insertRoofers() {
  await db.insert(tenants).values({
    domain: "roofers.co",
    niche: "roofing",
    moneyWord: "roofing leads",
    theme,
    offers,
    monthlyPriceDefault: "1500",
  });
}

describe("getTenantByHost", () => {
  it("returns the tenant for an exact domain match", async () => {
    await insertRoofers();
    const t = await getTenantByHost("roofers.co");
    expect(t?.domain).toBe("roofers.co");
    expect(t?.moneyWord).toBe("roofing leads");
    expect(t?.offers[0].price).toBe("$1,500/mo per ZIP");
  });

  it("normalizes host: strips port, www, and casing", async () => {
    await insertRoofers();
    expect((await getTenantByHost("WWW.Roofers.co:3000"))?.domain).toBe("roofers.co");
  });

  it("returns null for an unknown host", async () => {
    expect(await getTenantByHost("unknown.example")).toBeNull();
  });
});
