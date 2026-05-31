import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, users, wallets } from "@/src/db/schema";
import { addLedgerEntry, walletBalance, ledgerEntries } from "@/src/billing/ledger";
import { hashPassword } from "@/src/auth/password";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let walletId: string, tenantId: string;
beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  const [u] = await db.insert(users).values({ tenantId: t.id, email: "c@roofers.co", passwordHash: await hashPassword("x"), role: "customer" }).returning();
  const [w] = await db.insert(wallets).values({ tenantId: t.id, userId: u.id }).returning();
  walletId = w.id; tenantId = t.id;
});

describe("ledger", () => {
  it("balance of an empty wallet is 0", async () => {
    expect(await walletBalance(walletId)).toBe(0);
  });

  it("sums positive and negative entries", async () => {
    await addLedgerEntry({ walletId, tenantId, amount: 50, type: "signup_bonus" });
    await addLedgerEntry({ walletId, tenantId, amount: 11, type: "topup" });
    await addLedgerEntry({ walletId, tenantId, amount: -1.44, type: "lead_charge" });
    expect(await walletBalance(walletId)).toBe(59.56);
  });

  it("lists entries newest first", async () => {
    await addLedgerEntry({ walletId, tenantId, amount: 50, type: "signup_bonus", description: "first" });
    await addLedgerEntry({ walletId, tenantId, amount: 5, type: "admin_grant", description: "second" });
    const rows = await ledgerEntries(walletId);
    expect(rows.length).toBe(2);
    expect(rows[0].description).toBe("second");
  });
});
