import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { referralCodes, partnerReferrals, platformSettings, tenants } from "../db/schema";

export type ReferralCode = typeof referralCodes.$inferSelect;

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Single-row platform settings (god-controlled rates + cap). Created on first read. */
export async function getPlatformSettings() {
  let row = (await db.select().from(platformSettings).limit(1))[0];
  if (!row) [row] = await db.insert(platformSettings).values({}).returning();
  return row;
}

export async function setPlatformSettings(patch: { salesRepRate?: string; defaultPartnerRate?: string; partnerRateCap?: string; whitelabelLandedRate?: string }) {
  const cur = await getPlatformSettings();
  const set: Record<string, unknown> = { updatedAt: new Date() };
  for (const [k, v] of Object.entries(patch)) if (v !== undefined) set[k] = v;
  await db.update(platformSettings).set(set).where(eq(platformSettings.id, cur.id));
}

/** A short, human-friendly, unique referral code (no Math.random/Date). */
export function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export async function resolveCode(code: string): Promise<ReferralCode | null> {
  const c = code.trim().toUpperCase();
  if (!c) return null;
  return (await db.select().from(referralCodes).where(and(eq(referralCodes.code, c), eq(referralCodes.status, "active"))).limit(1))[0] ?? null;
}

export async function getCodeById(id: string): Promise<ReferralCode | null> {
  return (await db.select().from(referralCodes).where(eq(referralCodes.id, id)).limit(1))[0] ?? null;
}

/** Get (or create) the tenant-scoped partner code for a partner user. */
export async function getOrCreatePartnerCode(ownerUserId: string, tenantId: string): Promise<ReferralCode> {
  const existing = (await db.select().from(referralCodes).where(and(eq(referralCodes.ownerUserId, ownerUserId), eq(referralCodes.scope, "tenant"))).limit(1))[0];
  if (existing) return existing;
  const t = (await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1))[0];
  const rate = t ? t.partnerRate : "0.20";
  let code = generateCode();
  for (let i = 0; i < 5 && (await resolveCode(code)); i++) code = generateCode();
  const [row] = await db.insert(referralCodes).values({ code, ownerUserId, scope: "tenant", tenantId, customerRate: rate, payoutFormChoice: "cash" }).returning();
  return row;
}

/** Get (or create) the platform-scoped rep code (works on every white-label). */
export async function getOrCreateRepCode(ownerUserId: string): Promise<ReferralCode> {
  const existing = (await db.select().from(referralCodes).where(and(eq(referralCodes.ownerUserId, ownerUserId), eq(referralCodes.scope, "platform"))).limit(1))[0];
  if (existing) return existing;
  const ps = await getPlatformSettings();
  let code = generateCode();
  for (let i = 0; i < 5 && (await resolveCode(code)); i++) code = generateCode();
  const [row] = await db.insert(referralCodes).values({ code, ownerUserId, scope: "platform", tenantId: null, customerRate: ps.salesRepRate, whitelabelRate: ps.whitelabelLandedRate, payoutFormChoice: "cash" }).returning();
  return row;
}

/** First-touch attribution: tie a new signup to a referral code. No-op if already attributed. */
export async function attributeSignup(referredUserId: string, code: string): Promise<boolean> {
  const rc = await resolveCode(code);
  if (!rc) return false;
  const already = (await db.select({ id: partnerReferrals.id }).from(partnerReferrals).where(eq(partnerReferrals.referredUserId, referredUserId)).limit(1))[0];
  if (already) return false;
  await db.insert(partnerReferrals).values({ referredUserId, referralCodeId: rc.id, scope: rc.scope, tenantId: rc.tenantId });
  return true;
}

/** Mark that a referred user activated (spent free credit). Sets activatedAt once. */
export async function markActivated(referredUserId: string): Promise<void> {
  const r = (await db.select().from(partnerReferrals).where(eq(partnerReferrals.referredUserId, referredUserId)).limit(1))[0];
  if (r && !r.activatedAt) {
    await db.update(partnerReferrals).set({ activatedAt: new Date() }).where(eq(partnerReferrals.id, r.id));
  }
}

export { num as _num };
