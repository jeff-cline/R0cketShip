import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { wallets, users, tenants } from "../db/schema";
import { addLedgerEntry } from "./ledger";

export async function getWalletForUser(userId: string) {
  return (await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1))[0] ?? null;
}

export async function ensureWalletWithBonus(userId: string) {
  const existing = await getWalletForUser(userId);
  if (existing) return existing;

  const user = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!user) throw new Error("user not found");
  const tenant = (await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1))[0];

  const [wallet] = await db.insert(wallets).values({ tenantId: user.tenantId, userId }).returning();
  const bonus = parseFloat(tenant?.signupBonusCredits ?? "50");
  if (bonus > 0) {
    await addLedgerEntry({
      walletId: wallet.id,
      tenantId: user.tenantId,
      amount: bonus,
      type: "signup_bonus",
      description: "Signup bonus",
    });
  }
  return wallet;
}

export async function grantCredits(walletId: string, amount: number, description: string) {
  const wallet = (await db.select().from(wallets).where(eq(wallets.id, walletId)).limit(1))[0];
  if (!wallet) throw new Error("wallet not found");
  return addLedgerEntry({
    walletId,
    tenantId: wallet.tenantId,
    amount,
    type: amount >= 0 ? "admin_grant" : "adjustment",
    description,
  });
}
