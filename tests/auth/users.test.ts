import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { findUserByEmail, createUser, resetUserPassword, listUsers, canCreateUser } from "@/src/auth/users";
import { verifyPassword } from "@/src/auth/password";

let tA: string, tB: string;
beforeEach(async () => {
  const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
  const [a] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  const [b] = await db.insert(tenants).values({ domain: "solar.co", niche: "solar", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = a.id; tB = b.id;
});

describe("createUser + authority", () => {
  it("god can create a manager in any tenant", async () => {
    const god = { role: "god" as const, tenantId: tB };
    const u = await createUser(god, { tenantId: tA, email: "Mgr@Roofers.co", role: "manager", tempPassword: "TEMP!234" });
    expect(u.email).toBe("mgr@roofers.co");
    expect(u.mustResetPassword).toBe(true);
    expect(await verifyPassword("TEMP!234", u.passwordHash)).toBe(true);
  });

  it("manager authority matrix via canCreateUser", () => {
    const mgr = { role: "manager" as const, tenantId: tA };
    expect(canCreateUser(mgr, { tenantId: tA, role: "customer" })).toBe(true);
    expect(canCreateUser(mgr, { tenantId: tB, role: "customer" })).toBe(false);
    expect(canCreateUser(mgr, { tenantId: tA, role: "manager" })).toBe(false);
    expect(canCreateUser(mgr, { tenantId: tA, role: "god" })).toBe(false);
  });

  it("createUser throws when the actor lacks authority", async () => {
    const mgr = { role: "manager" as const, tenantId: tA };
    await expect(
      createUser(mgr, { tenantId: tB, email: "x@x.co", role: "customer", tempPassword: "TEMP!234" }),
    ).rejects.toThrow();
  });

  it("findUserByEmail is tenant- and case-insensitive scoped", async () => {
    const god = { role: "god" as const, tenantId: tB };
    await createUser(god, { tenantId: tA, email: "owner@roofers.co", role: "customer", tempPassword: "TEMP!234" });
    expect((await findUserByEmail(tA, "OWNER@roofers.co"))?.email).toBe("owner@roofers.co");
    expect(await findUserByEmail(tB, "owner@roofers.co")).toBeNull();
  });

  it("resetUserPassword sets a new temp password and the reset flag", async () => {
    const god = { role: "god" as const, tenantId: tB };
    const u = await createUser(god, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "OLD!2345" });
    const updated = await resetUserPassword(god, u.id, "NEW!2345");
    expect(updated.mustResetPassword).toBe(true);
    expect(await verifyPassword("NEW!2345", updated.passwordHash)).toBe(true);
  });

  it("manager cannot reset a user in another tenant", async () => {
    const god = { role: "god" as const, tenantId: tB };
    const u = await createUser(god, { tenantId: tB, email: "z@solar.co", role: "customer", tempPassword: "OLD!2345" });
    const mgrA = { role: "manager" as const, tenantId: tA };
    await expect(resetUserPassword(mgrA, u.id, "NEW!2345")).rejects.toThrow();
  });

  it("manager can reset an own-tenant customer but NOT a co-manager", async () => {
    const god = { role: "god" as const, tenantId: tB };
    const cust = await createUser(god, { tenantId: tA, email: "cc@roofers.co", role: "customer", tempPassword: "OLD!2345" });
    const coMgr = await createUser(god, { tenantId: tA, email: "mm@roofers.co", role: "manager", tempPassword: "OLD!2345" });
    const mgrA = { role: "manager" as const, tenantId: tA };
    // allowed: own-tenant customer
    const updated = await resetUserPassword(mgrA, cust.id, "NEW!2345");
    expect(updated.mustResetPassword).toBe(true);
    // denied: co-manager in same tenant
    await expect(resetUserPassword(mgrA, coMgr.id, "NEW!2345")).rejects.toThrow();
  });

  it("listUsers scopes to the actor's tenant unless god", async () => {
    const god = { role: "god" as const, tenantId: tB };
    await createUser(god, { tenantId: tA, email: "a@roofers.co", role: "customer", tempPassword: "TEMP!234" });
    await createUser(god, { tenantId: tB, email: "b@solar.co", role: "customer", tempPassword: "TEMP!234" });
    const mgrA = { role: "manager" as const, tenantId: tA };
    expect((await listUsers(mgrA)).length).toBe(1);
    expect((await listUsers(god)).length).toBe(2);
  });
});
