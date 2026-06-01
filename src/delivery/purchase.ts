import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/client";
import { leads, leadDeliveries, creditLedger, wallets } from "../db/schema";
import { ageTier } from "../leads/age-tier";
import { leadPrice } from "../billing/pricing";
import { subscribedZips } from "../billing/subscriptions";
import type { PurchaseResult } from "./types";

export async function purchaseLeads(
  customerId: string,
  leadIds: string[],
  now: Date = new Date(),
): Promise<PurchaseResult> {
  const wallet = (await db.select().from(wallets).where(eq(wallets.userId, customerId)).limit(1))[0];
  if (!wallet) throw new Error("wallet not found");
  if (leadIds.length === 0) return { delivered: [], totalCharged: 0, skipped: 0 };

  const candidates = await db
    .select()
    .from(leads)
    .where(and(eq(leads.tenantId, wallet.tenantId), inArray(leads.id, leadIds)));

  const ownedRows = await db
    .select({ leadId: leadDeliveries.leadId })
    .from(leadDeliveries)
    .where(eq(leadDeliveries.customerId, customerId));
  const owned = new Set(ownedRows.map((r) => r.leadId));

  const toBuy = candidates.filter((l) => !owned.has(l.id));
  const skipped = leadIds.length - toBuy.length;
  if (toBuy.length === 0) return { delivered: [], totalCharged: 0, skipped };

  const subZips = await subscribedZips(customerId);
  const priced = toBuy.map((l) => {
    const tier = l.lastUpdated ? ageTier(l.lastUpdated, now) : "older";
    const covered = l.zip != null && subZips.has(l.zip);
    return { lead: l, tier, price: covered ? 0 : leadPrice(tier) };
  });
  const total = Math.round(priced.reduce((s, p) => s + p.price, 0) * 100) / 100;

  return db.transaction(async (tx) => {
    await tx.select().from(wallets).where(eq(wallets.id, wallet.id)).for("update");
    const [bal] = await tx
      .select({ total: sql<string>`coalesce(sum(${creditLedger.amount}), 0)` })
      .from(creditLedger)
      .where(eq(creditLedger.walletId, wallet.id));
    const balance = parseFloat(bal.total);
    if (balance < total) throw new Error("insufficient balance");

    const delivered: PurchaseResult["delivered"] = [];
    for (const p of priced) {
      const [d] = await tx.insert(leadDeliveries).values({
        tenantId: wallet.tenantId, customerId, walletId: wallet.id, leadId: p.lead.id,
        priceCredits: String(p.price), tierAtDelivery: p.tier, status: "new",
      }).returning({ id: leadDeliveries.id });
      if (p.price > 0) {
        await tx.insert(creditLedger).values({
          walletId: wallet.id, tenantId: wallet.tenantId, amount: String(-p.price),
          type: "lead_charge", description: `Lead ${p.lead.id}`, refId: p.lead.id,
        });
      }
      delivered.push({ deliveryId: d.id, leadId: p.lead.id, price: p.price });
    }
    return { delivered, totalCharged: total, skipped };
  });
}
