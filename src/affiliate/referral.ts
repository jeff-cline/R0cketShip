import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { referrals, wallets, creditLedger } from "../db/schema";
import { codeOwner } from "./code";

export async function recordReferral(referredCustomerId: string, code: string): Promise<boolean> {
  const owner = await codeOwner(code);
  if (!owner || owner === referredCustomerId) return false;
  const existing = (await db.select().from(referrals).where(eq(referrals.referredCustomerId, referredCustomerId)).limit(1))[0];
  if (existing) return false;
  try {
    await db.insert(referrals).values({ referredCustomerId, affiliateCustomerId: owner, code });
    return true;
  } catch {
    return false;
  }
}

export async function affiliateStats(customerId: string): Promise<{ referrals: number; earnedCredits: number }> {
  const refs = await db.select().from(referrals).where(eq(referrals.affiliateCustomerId, customerId));
  const wallet = (await db.select().from(wallets).where(eq(wallets.userId, customerId)).limit(1))[0];
  let earned = 0;
  if (wallet) {
    const rows = await db.select().from(creditLedger).where(and(eq(creditLedger.walletId, wallet.id), eq(creditLedger.type, "affiliate")));
    earned = Math.round(rows.reduce((s, r) => s + parseFloat(r.amount), 0) * 100) / 100;
  }
  return { referrals: refs.length, earnedCredits: earned };
}
