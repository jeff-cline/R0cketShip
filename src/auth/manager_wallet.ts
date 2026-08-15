/**
 * Phase 2: personal wallet for tenant managers.
 *
 * Receives advertiser-referral payouts (per spec: tenant managers are paid
 * personally, NOT into the tenant revenue line). Backed by a SUM-of-ledger
 * model with a denormalized cache column, identical to the advertiser wallet.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import {
  managerWallets,
  managerWalletLedger,
} from "../db/schema";

/** Get or create the manager's personal wallet. Returns the wallet id. */
export async function getOrCreateManagerWallet(userId: string): Promise<string> {
  const existing = await db
    .select({ id: managerWallets.id })
    .from(managerWallets)
    .where(eq(managerWallets.userId, userId))
    .limit(1);
  if (existing[0]) return existing[0].id;
  const inserted = await db
    .insert(managerWallets)
    .values({ userId })
    .returning({ id: managerWallets.id });
  if (!inserted[0]) throw new Error("getOrCreateManagerWallet: insert returned no row");
  return inserted[0].id;
}

export async function managerWalletBalance(userId: string): Promise<number> {
  const rows = await db
    .select({ balance: managerWallets.balanceCents })
    .from(managerWallets)
    .where(eq(managerWallets.userId, userId))
    .limit(1);
  return rows[0]?.balance ?? 0;
}

export async function creditManagerWallet(input: {
  userId: string;
  deltaCents: number;
  type: "advertiser_referral" | "admin_adjustment" | "withdrawal";
  refId?: string;
}): Promise<{ walletId: string; balance: number }> {
  const walletId = await getOrCreateManagerWallet(input.userId);
  await db.insert(managerWalletLedger).values({
    walletId,
    deltaCents: input.deltaCents,
    type: input.type,
    refId: input.refId ?? null,
  });
  // Recompute cache from ledger sum and update.
  const rows = await db
    .select({ sum: sql<string>`COALESCE(SUM(${managerWalletLedger.deltaCents}), 0)` })
    .from(managerWalletLedger)
    .where(eq(managerWalletLedger.walletId, walletId));
  const balance = Number(rows[0]?.sum ?? 0);
  await db
    .update(managerWallets)
    .set({ balanceCents: balance, updatedAt: new Date() })
    .where(eq(managerWallets.id, walletId));
  return { walletId, balance };
}
