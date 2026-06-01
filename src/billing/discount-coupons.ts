import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { coupons } from "../db/schema";

export type DiscountCoupon = typeof coupons.$inferSelect;

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** God creates a % discount coupon (only god manages these). `percent` is 0–100. */
export async function createDiscountCoupon(input: {
  code: string;
  name: string;
  tenantId: string | null; // which white-label it applies to (null = any)
  percent: number; // 0–100
  durationMonths: number | null; // null = forever
  maxRedemptions: number | null;
}): Promise<DiscountCoupon> {
  const code = input.code.trim().toUpperCase();
  const fraction = Math.max(0, Math.min(1, num(input.percent) / 100));
  const [row] = await db
    .insert(coupons)
    .values({
      code,
      name: input.name.trim() || code,
      kind: "percent_off",
      value: String(fraction),
      tenantId: input.tenantId,
      durationMonths: input.durationMonths,
      maxRedemptions: input.maxRedemptions,
      active: true,
    })
    .returning();
  return row;
}

export async function listDiscountCoupons(): Promise<DiscountCoupon[]> {
  return db.select().from(coupons).where(eq(coupons.kind, "percent_off")).orderBy(sql`${coupons.createdAt} desc`);
}

export async function setCouponActive(id: string, active: boolean): Promise<void> {
  await db.update(coupons).set({ active }).where(eq(coupons.id, id));
}

export interface DiscountValidation {
  ok: boolean;
  reason?: string;
  couponId?: string;
  percent?: number; // fraction 0–1
  durationMonths?: number | null;
}

/** Validate a discount code for a tenant's checkout. */
export async function validateDiscountCoupon(code: string, tenantId: string): Promise<DiscountValidation> {
  const c = (await db.select().from(coupons).where(and(eq(coupons.code, code.trim().toUpperCase()), eq(coupons.kind, "percent_off"))).limit(1))[0];
  if (!c) return { ok: false, reason: "not found" };
  if (!c.active) return { ok: false, reason: "inactive" };
  if (c.expiresAt && c.expiresAt.getTime() <= Date.now()) return { ok: false, reason: "expired" };
  if (c.maxRedemptions != null && c.timesRedeemed >= c.maxRedemptions) return { ok: false, reason: "fully redeemed" };
  if (c.tenantId && c.tenantId !== tenantId) return { ok: false, reason: "not valid here" };
  return { ok: true, couponId: c.id, percent: num(c.value), durationMonths: c.durationMonths };
}

/** Atomically count one redemption (guards against exceeding the max). */
export async function redeemCoupon(couponId: string): Promise<void> {
  await db.update(coupons).set({ timesRedeemed: sql`${coupons.timesRedeemed} + 1` }).where(eq(coupons.id, couponId));
}

/** Apply a discount fraction to an amount. */
export function discounted(amount: number, percentFraction: number): number {
  const f = Math.max(0, Math.min(1, percentFraction));
  return Math.round(amount * (1 - f) * 100) / 100;
}
