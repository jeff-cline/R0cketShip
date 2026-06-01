import { and, eq, inArray, sql, isNotNull } from "drizzle-orm";
import { db } from "../db/client";
import { referralCodes, partnerReferrals, commissionLedger, users } from "../db/schema";

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export interface Funnel {
  referred: number;
  activated: number;
  upgraded: number;
}
export interface Earnings {
  earned: number; // all-time accrued
  owed: number; // accrued + owed, not yet paid
  paid: number;
}

async function codeIdsFor(ownerUserId: string): Promise<string[]> {
  const rows = await db.select({ id: referralCodes.id }).from(referralCodes).where(eq(referralCodes.ownerUserId, ownerUserId));
  return rows.map((r) => r.id);
}

export async function partnerFunnel(ownerUserId: string): Promise<Funnel> {
  const ids = await codeIdsFor(ownerUserId);
  if (ids.length === 0) return { referred: 0, activated: 0, upgraded: 0 };
  const [r] = await db
    .select({
      referred: sql<number>`count(*)`,
      activated: sql<number>`count(${partnerReferrals.activatedAt})`,
      upgraded: sql<number>`count(${partnerReferrals.upgradedAt})`,
    })
    .from(partnerReferrals)
    .where(inArray(partnerReferrals.referralCodeId, ids));
  return { referred: num(r?.referred), activated: num(r?.activated), upgraded: num(r?.upgraded) };
}

export async function partnerEarnings(ownerUserId: string): Promise<Earnings> {
  const [r] = await db
    .select({
      earned: sql<string>`coalesce(sum(${commissionLedger.amount}),0)`,
      owed: sql<string>`coalesce(sum(case when ${commissionLedger.status} in ('accrued','owed') then ${commissionLedger.amount} else 0 end),0)`,
      paid: sql<string>`coalesce(sum(case when ${commissionLedger.status} = 'paid' then ${commissionLedger.amount} else 0 end),0)`,
    })
    .from(commissionLedger)
    .where(eq(commissionLedger.ownerUserId, ownerUserId));
  return { earned: num(r?.earned), owed: num(r?.owed), paid: num(r?.paid) };
}

export interface PartnerRow {
  userId: string;
  email: string;
  code: string;
  scope: "platform" | "tenant";
  funnel: Funnel;
  earnings: Earnings;
}

async function partnersForCodes(codes: { id: string; code: string; ownerUserId: string; scope: "platform" | "tenant" }[]): Promise<PartnerRow[]> {
  const out: PartnerRow[] = [];
  for (const c of codes) {
    const u = (await db.select({ email: users.email }).from(users).where(eq(users.id, c.ownerUserId)).limit(1))[0];
    out.push({
      userId: c.ownerUserId,
      email: u?.email ?? "(unknown)",
      code: c.code,
      scope: c.scope,
      funnel: await partnerFunnel(c.ownerUserId),
      earnings: await partnerEarnings(c.ownerUserId),
    });
  }
  return out.sort((a, b) => b.earnings.earned - a.earnings.earned);
}

/** White-label owner's partner list (tenant-scope codes for their tenant). */
export async function tenantPartners(tenantId: string): Promise<PartnerRow[]> {
  const codes = await db.select({ id: referralCodes.id, code: referralCodes.code, ownerUserId: referralCodes.ownerUserId, scope: referralCodes.scope }).from(referralCodes).where(and(eq(referralCodes.scope, "tenant"), eq(referralCodes.tenantId, tenantId)));
  return partnersForCodes(codes);
}

/** All platform-scope sales reps (for the Sales Manager / god). */
export async function allReps(): Promise<PartnerRow[]> {
  const codes = await db.select({ id: referralCodes.id, code: referralCodes.code, ownerUserId: referralCodes.ownerUserId, scope: referralCodes.scope }).from(referralCodes).where(eq(referralCodes.scope, "platform"));
  return partnersForCodes(codes);
}

/** Platform-wide commission expense (for economics rollup). */
export async function commissionExpense(tenantId?: string): Promise<{ accrued: number; owed: number; paid: number }> {
  const where = tenantId ? eq(commissionLedger.tenantId, tenantId) : undefined;
  const [r] = await db
    .select({
      accrued: sql<string>`coalesce(sum(${commissionLedger.amount}),0)`,
      owed: sql<string>`coalesce(sum(case when ${commissionLedger.status} in ('accrued','owed') then ${commissionLedger.amount} else 0 end),0)`,
      paid: sql<string>`coalesce(sum(case when ${commissionLedger.status} = 'paid' then ${commissionLedger.amount} else 0 end),0)`,
    })
    .from(commissionLedger)
    .where(where);
  return { accrued: num(r?.accrued), owed: num(r?.owed), paid: num(r?.paid) };
}

export { isNotNull };
