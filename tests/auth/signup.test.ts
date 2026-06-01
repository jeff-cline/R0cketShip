import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { signupCustomer } from "@/src/auth/signup";
import { loginUser } from "@/src/auth/login";
import { getWalletForUser } from "@/src/billing/wallet";
import { walletBalance } from "@/src/billing/ledger";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string, tB: string;
beforeEach(async () => {
  const [a] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  const [b] = await db.insert(tenants).values({ domain: "solar.co", niche: "solar", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = a.id; tB = b.id;
});

describe("signupCustomer", () => {
  it("creates a loginable customer (no forced reset) with a $50 wallet", async () => {
    const u = await signupCustomer(tA, { email: "New@Roofers.co", password: "hunter2pw", name: "Pat", businessName: "Pat Roofing" });
    expect(u.email).toBe("new@roofers.co");
    expect(u.mustResetPassword).toBe(false);
    const login = await loginUser(tA, "new@roofers.co", "hunter2pw");
    expect(login.ok).toBe(true);
    if (login.ok) expect(login.mustReset).toBe(false);
    const w = (await getWalletForUser(u.id))!;
    expect(await walletBalance(w.id)).toBe(50);
  });
  it("rejects a duplicate email in the same tenant", async () => {
    await signupCustomer(tA, { email: "dup@roofers.co", password: "hunter2pw" });
    await expect(signupCustomer(tA, { email: "dup@roofers.co", password: "hunter2pw" })).rejects.toThrow();
  });
  it("rejects a short password", async () => {
    await expect(signupCustomer(tA, { email: "x@roofers.co", password: "short" })).rejects.toThrow();
  });
  it("same email is independent across tenants", async () => {
    await signupCustomer(tA, { email: "shared@x.co", password: "hunter2pw" });
    const u = await signupCustomer(tB, { email: "shared@x.co", password: "hunter2pw" });
    expect(u.tenantId).toBe(tB);
  });
});
