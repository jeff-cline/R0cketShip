import { eq, sql, desc } from "drizzle-orm";
import { db } from "../db/client";
import { creditLedger } from "../db/schema";

export type LedgerType =
  | "signup_bonus" | "topup" | "coupon" | "admin_grant" | "lead_charge" | "refund" | "adjustment";

export async function addLedgerEntry(e: {
  walletId: string;
  tenantId: string;
  amount: number;
  type: LedgerType;
  description?: string;
  refId?: string;
}) {
  const [row] = await db
    .insert(creditLedger)
    .values({
      walletId: e.walletId,
      tenantId: e.tenantId,
      amount: String(e.amount),
      type: e.type,
      description: e.description ?? null,
      refId: e.refId ?? null,
    })
    .returning();
  return row;
}

export async function walletBalance(walletId: string): Promise<number> {
  const [r] = await db
    .select({ total: sql<string>`coalesce(sum(${creditLedger.amount}), 0)` })
    .from(creditLedger)
    .where(eq(creditLedger.walletId, walletId));
  return Math.round(parseFloat(r.total) * 100) / 100;
}

export async function ledgerEntries(walletId: string) {
  return db
    .select()
    .from(creditLedger)
    .where(eq(creditLedger.walletId, walletId))
    .orderBy(desc(creditLedger.createdAt), desc(creditLedger.id));
}
