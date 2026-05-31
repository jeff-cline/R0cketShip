import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tenants, users } from "@/src/db/schema";
import { hashPassword } from "@/src/auth/password";
import { loginUser } from "@/src/auth/login";
import { createUser } from "@/src/auth/users";
import { createSession } from "@/src/auth/session";
import { resolveAuthContext } from "@/src/auth/context";
import { startImpersonation, exitImpersonation } from "@/src/auth/impersonate";

let platformTenant: string, roofersTenant: string;
beforeEach(async () => {
  const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
  const [p] = await db.insert(tenants).values({ domain: "r0cketship.com", niche: "platform", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "0" }).returning();
  const [r] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  platformTenant = p.id; roofersTenant = r.id;
  await db.insert(users).values({ tenantId: p.id, email: "jeff.cline@me.com", passwordHash: await hashPassword("TEMP!234"), role: "god", mustResetPassword: true });
});

describe("identity flow", () => {
  it("god logs in (forced reset), creates a manager, manager creates + impersonates a customer", async () => {
    const godLogin = await loginUser(platformTenant, "jeff.cline@me.com", "TEMP!234");
    expect(godLogin.ok && godLogin.mustReset).toBe(true);

    const god = (await db.select().from(users).where(eq(users.email, "jeff.cline@me.com")).limit(1))[0];
    const mgr = await createUser({ role: "god", tenantId: god.tenantId }, { tenantId: roofersTenant, email: "mgr@roofers.co", role: "manager", tempPassword: "TEMP!234" });
    const cust = await createUser({ role: "manager", tenantId: roofersTenant }, { tenantId: roofersTenant, email: "cust@roofers.co", role: "customer", tempPassword: "TEMP!234" });

    const custLogin = await loginUser(roofersTenant, "cust@roofers.co", "TEMP!234");
    expect(custLogin.ok).toBe(true);

    const mgrToken = await createSession(mgr.id);
    const impToken = await startImpersonation({ role: "manager", tenantId: roofersTenant }, cust, mgrToken);
    expect((await resolveAuthContext(impToken))?.impersonator?.id).toBe(mgr.id);
    const back = await exitImpersonation(impToken);
    expect((await resolveAuthContext(back!))?.user.id).toBe(mgr.id);
  });

  it("a manager cannot create a user in another tenant", async () => {
    await expect(
      createUser({ role: "manager", tenantId: roofersTenant }, { tenantId: platformTenant, email: "x@x.co", role: "customer", tempPassword: "TEMP!234" }),
    ).rejects.toThrow();
  });
});
