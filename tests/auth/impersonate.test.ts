import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { createSession } from "@/src/auth/session";
import { resolveAuthContext } from "@/src/auth/context";
import { startImpersonation, exitImpersonation, canImpersonate } from "@/src/auth/impersonate";

let tA: string, tB: string;
beforeEach(async () => {
  const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
  const [a] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  const [b] = await db.insert(tenants).values({ domain: "solar.co", niche: "solar", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = a.id; tB = b.id;
});

describe("impersonation authority", () => {
  it("god → any non-god (incl managers, to open-as a white-label); manager → own-tenant customers only; never god; customer never", async () => {
    const custA = await createUser({ role: "god", tenantId: tB }, { tenantId: tA, email: "ca@roofers.co", role: "customer", tempPassword: "x" });
    const custB = await createUser({ role: "god", tenantId: tB }, { tenantId: tB, email: "cb@solar.co", role: "customer", tempPassword: "x" });
    const mgrTarget = await createUser({ role: "god", tenantId: tB }, { tenantId: tA, email: "mt@roofers.co", role: "manager", tempPassword: "x" });

    const mgrA = { role: "manager" as const, tenantId: tA };
    expect(canImpersonate(mgrA, custA)).toBe(true);
    expect(canImpersonate(mgrA, custB)).toBe(false);
    expect(canImpersonate(mgrA, mgrTarget)).toBe(false);
    expect(canImpersonate({ role: "god", tenantId: tB }, custA)).toBe(true);
    // God can now open-as a white-label manager.
    expect(canImpersonate({ role: "god", tenantId: tB }, mgrTarget)).toBe(true);
    expect(canImpersonate({ role: "customer", tenantId: tA }, custA)).toBe(false);
  });

  it("start then exit: impersonation session has the right effective user + impersonator; exit returns to admin", async () => {
    const admin = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "m@roofers.co", role: "manager", tempPassword: "x" });
    const cust = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "x" });
    const adminToken = await createSession(admin.id);

    const impToken = await startImpersonation({ role: "manager", tenantId: tA }, cust, adminToken);
    const impCtx = await resolveAuthContext(impToken);
    expect(impCtx?.user.id).toBe(cust.id);
    expect(impCtx?.impersonator?.id).toBe(admin.id);

    const back = await exitImpersonation(impToken);
    expect(back).not.toBeNull();
    const restored = await resolveAuthContext(back!);
    expect(restored?.user.id).toBe(admin.id);
    expect(restored?.impersonator).toBeNull();
    // impersonation session is gone
    expect(await resolveAuthContext(impToken)).toBeNull();
  });

  it("startImpersonation throws when the actor lacks authority", async () => {
    const cust = await createUser({ role: "god", tenantId: tB }, { tenantId: tB, email: "cb@solar.co", role: "customer", tempPassword: "x" });
    const adminToken = await createSession(cust.id);
    await expect(
      startImpersonation({ role: "manager", tenantId: tA }, cust, adminToken),
    ).rejects.toThrow();
  });
});
