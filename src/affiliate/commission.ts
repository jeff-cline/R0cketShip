import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { referrals, wallets, creditLedger } from "../db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Inside confirmPayment's tx (topup only): credit the referrer 10% of the purchased credits. */
export async function creditAffiliateCommission(tx: Tx, payment: { id: string; walletId: string; credits: string }): Promise<void> {
  const wallet = (await tx.select().from(wallets).where(eq(wallets.id, payment.walletId)).limit(1))[0];
  if (!wallet) return;
  const ref = (await tx.select().from(referrals).where(eq(referrals.referredCustomerId, wallet.userId)).limit(1))[0];
  if (!ref) return;
  const affWallet = (await tx.select().from(wallets).where(eq(wallets.userId, ref.affiliateCustomerId)).limit(1))[0];
  if (!affWallet) return;
  const commission = Math.round(parseFloat(payment.credits) * 0.1 * 100) / 100;
  if (commission <= 0) return;
  await tx.insert(creditLedger).values({
    walletId: affWallet.id, tenantId: affWallet.tenantId, amount: String(commission),
    type: "affiliate", description: "Referral commission", refId: payment.id,
  });
}
