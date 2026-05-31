import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { getWalletForUser, ensureWalletWithBonus, grantCredits } from "@/src/billing/wallet";
import { walletBalance } from "@/src/billing/ledger";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string;
beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
});

describe("wallet + bonus", () => {
  it("creating a customer yields a wallet with the per-tenant bonus", async () => {
    const u = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "x" });
    const wallet = await getWalletForUser(u.id);
    expect(wallet).not.toBeNull();
    expect(await walletBalance(wallet!.id)).toBe(50);
  });

  it("does NOT create a wallet for a manager", async () => {
    const m = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "m@roofers.co", role: "manager", tempPassword: "x" });
    expect(await getWalletForUser(m.id)).toBeNull();
  });

  it("ensureWalletWithBonus is idempotent", async () => {
    const u = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c2@roofers.co", role: "customer", tempPassword: "x" });
    const again = await ensureWalletWithBonus(u.id);
    const wallet = await getWalletForUser(u.id);
    expect(again.id).toBe(wallet!.id);
    expect(await walletBalance(wallet!.id)).toBe(50);
  });

  it("grantCredits adds and subtracts", async () => {
    const u = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c3@roofers.co", role: "customer", tempPassword: "x" });
    const w = await getWalletForUser(u.id);
    await grantCredits(w!.id, 25, "promo");
    await grantCredits(w!.id, -5, "correction");
    expect(await walletBalance(w!.id)).toBe(70);
  });

  it("grantCreditsAs blocks a manager from another tenant's wallet but allows god", async () => {
    const { grantCreditsAs } = await import("@/src/billing/wallet");
    const { walletBalance } = await import("@/src/billing/ledger");
    const u = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "cc@roofers.co", role: "customer", tempPassword: "x" });
    const w = (await getWalletForUser(u.id))!;
    // a manager in a DIFFERENT tenant
    const otherTenant = (await db.insert(tenants).values({ domain: "solar.co", niche: "solar", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning())[0];
    await expect(grantCreditsAs({ role: "manager", tenantId: otherTenant.id }, w.id, 10, "x")).rejects.toThrow();
    expect(await walletBalance(w.id)).toBe(50); // unchanged
    // god can
    await grantCreditsAs({ role: "god", tenantId: otherTenant.id }, w.id, 10, "ok");
    expect(await walletBalance(w.id)).toBe(60);
    // manager in the SAME tenant can
    await grantCreditsAs({ role: "manager", tenantId: tA }, w.id, 5, "ok2");
    expect(await walletBalance(w.id)).toBe(65);
  });
});
