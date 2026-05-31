import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { createSession } from "@/src/auth/session";
import { resolveAuthContext, canAccess } from "@/src/auth/context";

let tA: string;
beforeEach(async () => {
  const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
  const [a] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = a.id;
});

describe("resolveAuthContext", () => {
  it("returns the user + tenant for a valid token", async () => {
    const u = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "TEMP!234" });
    const token = await createSession(u.id);
    const ctx = await resolveAuthContext(token);
    expect(ctx?.user.id).toBe(u.id);
    expect(ctx?.tenant.domain).toBe("roofers.co");
    expect(ctx?.impersonator).toBeNull();
  });

  it("returns null for a missing/invalid token", async () => {
    expect(await resolveAuthContext(undefined)).toBeNull();
    expect(await resolveAuthContext("bogus")).toBeNull();
  });
});

describe("canAccess", () => {
  it("allows listed roles and denies others", () => {
    expect(canAccess("god", ["god"])).toBe(true);
    expect(canAccess("customer", ["god", "manager"])).toBe(false);
    expect(canAccess("manager", ["manager"])).toBe(true);
  });
});
