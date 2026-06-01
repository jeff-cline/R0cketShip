import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { users, wallets, creditLedger, payments } from "../db/schema";

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export interface CreditMetrics {
  totalCustomers: number;
  paidUsers: number; // customers who have made at least one real payment
  freeUsers: number; // customers running only on free/bonus credits
  paidRevenue: number; // real $ received (paid top-ups + subscriptions)
  outstandingCredits: number; // unspent credit balance across all wallets (a liability)
  freeCreditsIssued: number; // total signup-bonus credit granted
  freeCreditsUsed: number; // free credits actually consumed on leads
  leadCreditsSpent: number; // total credits spent buying leads (free + paid)
}

/**
 * Platform-wide credit accounting. Separates REAL money from free promotional
 * credit so the $50 signup bonus is never mistaken for revenue. Scope to one
 * tenant by passing `tenantId`.
 */
export async function platformCreditMetrics(tenantId?: string): Promise<CreditMetrics> {
  const custWhere = tenantId ? and(eq(users.role, "customer"), eq(users.tenantId, tenantId)) : eq(users.role, "customer");
  const [{ c: totalCustomers } = { c: 0 }] = await db.select({ c: sql<number>`count(*)` }).from(users).where(custWhere);

  // Real money received (paid top-ups + subscriptions).
  const payWhere = tenantId ? and(eq(payments.status, "paid"), eq(payments.tenantId, tenantId)) : eq(payments.status, "paid");
  const [{ total: paidRevenue } = { total: "0" }] = await db
    .select({ total: sql<string>`coalesce(sum(${payments.amountUsd}),0)` })
    .from(payments)
    .where(payWhere);

  // Customers with ≥1 paid payment (join payments → wallet → user).
  const paidRows = await db
    .selectDistinct({ userId: wallets.userId })
    .from(payments)
    .innerJoin(wallets, eq(payments.walletId, wallets.id))
    .where(tenantId ? and(eq(payments.status, "paid"), eq(wallets.tenantId, tenantId)) : eq(payments.status, "paid"));
  const paidUsers = paidRows.length;

  // Per-wallet ledger aggregates → outstanding balance, bonus issued, lead spend.
  const walletWhere = tenantId ? eq(wallets.tenantId, tenantId) : undefined;
  const ledgerRows = await db
    .select({
      walletId: creditLedger.walletId,
      balance: sql<string>`coalesce(sum(${creditLedger.amount}),0)`,
      bonus: sql<string>`coalesce(sum(case when ${creditLedger.type} = 'signup_bonus' then ${creditLedger.amount} else 0 end),0)`,
      spent: sql<string>`coalesce(sum(case when ${creditLedger.type} = 'lead_charge' then -${creditLedger.amount} else 0 end),0)`,
    })
    .from(creditLedger)
    .innerJoin(wallets, eq(creditLedger.walletId, wallets.id))
    .where(walletWhere)
    .groupBy(creditLedger.walletId);

  let outstandingCredits = 0;
  let freeCreditsIssued = 0;
  let leadCreditsSpent = 0;
  let freeCreditsUsed = 0;
  for (const r of ledgerRows) {
    const bal = num(r.balance);
    const bonus = num(r.bonus);
    const spent = num(r.spent);
    outstandingCredits += bal;
    freeCreditsIssued += bonus;
    leadCreditsSpent += spent;
    // Attribute spend to free credits first: free used = min(bonus granted, spent).
    freeCreditsUsed += Math.min(bonus, spent);
  }

  return {
    totalCustomers: num(totalCustomers),
    paidUsers,
    freeUsers: Math.max(0, num(totalCustomers) - paidUsers),
    paidRevenue: num(paidRevenue),
    outstandingCredits,
    freeCreditsIssued,
    freeCreditsUsed,
    leadCreditsSpent,
  };
}
