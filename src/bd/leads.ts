import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { investorLeads, bdReferralFees, platformSettings } from "../db/schema";
import { getPlatformSettings } from "../referral/core";
import { getBdPartnerBySlug } from "./partners";

export type InvestorLead = typeof investorLeads.$inferSelect;
export type BdReferralFee = typeof bdReferralFees.$inferSelect;

/** Store an investor-opportunity lead and, if it came through a partner slug, accrue the flat fee. */
export async function recordInvestorLead(input: {
  slug?: string | null;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  investorType?: string;
  meta?: unknown;
}): Promise<{ lead: InvestorLead; feeAccrued: boolean; referredByName: string | null }> {
  let referredByUserId: string | null = null;
  let slug: string | null = null;
  let referredByName: string | null = null;
  if (input.slug) {
    const p = await getBdPartnerBySlug(input.slug);
    if (p) {
      referredByUserId = p.userId;
      slug = p.slug;
      referredByName = `${p.firstName} ${p.lastName}`;
    }
  }
  const [lead] = await db
    .insert(investorLeads)
    .values({
      referredByUserId,
      slug,
      firstName: input.firstName,
      lastName: input.lastName || null,
      email: input.email,
      phone: input.phone || null,
      investorType: input.investorType || null,
      meta: (input.meta ?? null) as Record<string, unknown> | null,
    })
    .returning();

  let feeAccrued = false;
  if (referredByUserId) {
    const ps = await getPlatformSettings();
    await db.insert(bdReferralFees).values({ partnerUserId: referredByUserId, investorLeadId: lead.id, amount: ps.investorReferralFee, status: "accrued" });
    feeAccrued = true;
  }
  return { lead, feeAccrued, referredByName };
}

export async function listInvestorLeads(): Promise<InvestorLead[]> {
  return db.select().from(investorLeads).orderBy(desc(investorLeads.createdAt));
}

export async function listInvestorLeadsForPartner(userId: string): Promise<InvestorLead[]> {
  return db.select().from(investorLeads).where(eq(investorLeads.referredByUserId, userId)).orderBy(desc(investorLeads.createdAt));
}

export async function partnerLeadCount(userId: string): Promise<number> {
  const rows = await db.select({ id: investorLeads.id }).from(investorLeads).where(eq(investorLeads.referredByUserId, userId));
  return rows.length;
}

export async function listFeesForPartner(userId: string): Promise<BdReferralFee[]> {
  return db.select().from(bdReferralFees).where(eq(bdReferralFees.partnerUserId, userId)).orderBy(desc(bdReferralFees.createdAt));
}

export async function voidFee(feeId: string): Promise<void> {
  await db.update(bdReferralFees).set({ status: "void" }).where(eq(bdReferralFees.id, feeId));
}

export async function setInvestorReferralFee(amount: string): Promise<void> {
  const ps = await getPlatformSettings();
  await db.update(platformSettings).set({ investorReferralFee: amount, updatedAt: new Date() }).where(eq(platformSettings.id, ps.id));
}
