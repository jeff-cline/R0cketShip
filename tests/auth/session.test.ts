import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tenants, users, sessions } from "@/src/db/schema";
import { createSession, resolveSession, destroySession, hashToken } from "@/src/auth/session";

async function seedUser() {
  const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "sans-serif" };
  const [t] = await db.insert(tenants).values({
    domain: "roofers.co", niche: "roofing", moneyWord: "roofing leads",
    theme, offers: [], monthlyPriceDefault: "1500",
  }).returning();
  const [u] = await db.insert(users).values({
    tenantId: t.id, email: "owner@roofers.co", passwordHash: "x", role: "customer",
  }).returning();
  return u;
}

describe("sessions", () => {
  it("creates a session and resolves it by token", async () => {
    const u = await seedUser();
    const token = await createSession(u.id);
    expect((await resolveSession(token))?.userId).toBe(u.id);
  });

  it("stores only the token hash, never the raw token", async () => {
    const u = await seedUser();
    const token = await createSession(u.id);
    const rows = await db.select().from(sessions);
    expect(rows[0].tokenHash).toBe(hashToken(token));
    expect(rows[0].tokenHash).not.toBe(token);
  });

  it("returns null for an expired session and deletes it", async () => {
    const u = await seedUser();
    const token = await createSession(u.id);
    await db.update(sessions).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(sessions.tokenHash, hashToken(token)));
    expect(await resolveSession(token)).toBeNull();
    expect((await db.select().from(sessions)).length).toBe(0);
  });

  it("destroySession removes the row", async () => {
    const u = await seedUser();
    const token = await createSession(u.id);
    await destroySession(token);
    expect(await resolveSession(token)).toBeNull();
  });
});
