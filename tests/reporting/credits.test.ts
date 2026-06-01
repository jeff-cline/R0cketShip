import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, creditLedger, payments } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { getWalletForUser } from "@/src/billing/wallet";
import { platformCreditMetrics } from "@/src/reporting/credits";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };

async function ledger(walletId: string, tenantId: string, amount: string, type: "topup" | "lead_charge") {
  await db.insert(creditLedger).values({ walletId, tenantId, amount, type });
}

describe("platformCreditMetrics — free vs paid", () => {
  let tId: string;
  beforeEach(async () => {
    // signup_bonus default is 50 per customer (createUser → ensureWalletWithBonus).
    const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
    tId = t.id;

    // Free-mode customer: $50 bonus (auto), spent $7 on leads, no payment.
    const free = await createUser({ role: "god", tenantId: tId }, { tenantId: tId, email: "free@roofers.co", role: "customer", tempPassword: "x" });
    const wFree = (await getWalletForUser(free.id))!;
    await ledger(wFree.id, tId, "-7", "lead_charge");

    // Paid customer: $50 bonus (auto) + $100 real top-up, spent $120 on leads.
    const paid = await createUser({ role: "god", tenantId: tId }, { tenantId: tId, email: "paid@roofers.co", role: "customer", tempPassword: "x" });
    const wPaid = (await getWalletForUser(paid.id))!;
    await ledger(wPaid.id, tId, "100", "topup");
    await ledger(wPaid.id, tId, "-120", "lead_charge");
    await db.insert(payments).values({ tenantId: tId, walletId: wPaid.id, provider: "stripe", amountUsd: "100", credits: "100", status: "paid", purpose: "topup" });
  });

  it("separates free and paid users, revenue, and credits", async () => {
    const m = await platformCreditMetrics(tId);
    expect(m.totalCustomers).toBe(2);
    expect(m.paidUsers).toBe(1);
    expect(m.freeUsers).toBe(1);
    expect(m.paidRevenue).toBe(100); // only the real top-up
    expect(m.outstandingCredits).toBe(73); // free:43 + paid:30
    expect(m.freeCreditsIssued).toBe(100); // 50 + 50
    expect(m.leadCreditsSpent).toBe(127); // 7 + 120
    expect(m.freeCreditsUsed).toBe(57); // min(50,7) + min(50,120) = 7 + 50
  });
});
