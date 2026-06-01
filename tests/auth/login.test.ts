import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { loginUser, roleHome } from "@/src/auth/login";
import { resolveSession } from "@/src/auth/session";

let tA: string;
beforeEach(async () => {
  const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
  const [a] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = a.id;
  await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "owner@roofers.co", role: "customer", tempPassword: "TEMP!234" });
});

describe("loginUser", () => {
  it("logs in with correct credentials and creates a session", async () => {
    const r = await loginUser(tA, "owner@roofers.co", "TEMP!234");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.mustReset).toBe(true);
      expect(r.home).toBe("/dashboard");
      expect((await resolveSession(r.token))?.userId).toBeTruthy();
    }
  });

  it("fails on wrong password", async () => {
    expect((await loginUser(tA, "owner@roofers.co", "nope")).ok).toBe(false);
  });

  it("fails for a user in a different tenant", async () => {
    const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
    const [b] = await db.insert(tenants).values({ domain: "solar.co", niche: "solar", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
    expect((await loginUser(b.id, "owner@roofers.co", "TEMP!234")).ok).toBe(false);
  });

  it("roleHome maps roles to landing routes", () => {
    expect(roleHome("god")).toBe("/admin");
    expect(roleHome("manager")).toBe("/admin");
    expect(roleHome("customer")).toBe("/dashboard");
  });
});
