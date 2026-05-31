import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { coupons } from "../db/schema";

export type CouponValidation =
  | { ok: true; bonusCredits: number }
  | { ok: false; reason: string };

export async function createCoupon(input: {
  code: string;
  kind: "percent" | "fixed_credits";
  value: number;
  tenantId?: string | null;
  maxRedemptions?: number | null;
  expiresAt?: Date | null;
  active?: boolean;
}) {
  const [row] = await db
    .insert(coupons)
    .values({
      code: input.code,
      kind: input.kind,
      value: String(input.value),
      tenantId: input.tenantId ?? null,
      maxRedemptions: input.maxRedemptions ?? null,
      expiresAt: input.expiresAt ?? null,
      active: input.active ?? true,
    })
    .returning();
  return row;
}

export async function listCoupons(tenantId?: string) {
  const rows = await db.select().from(coupons);
  return tenantId ? rows.filter((c) => c.tenantId === tenantId || c.tenantId === null) : rows;
}

export async function validateCoupon(
  code: string,
  tenantId: string,
  amountUsd: number,
): Promise<CouponValidation> {
  const c = (await db.select().from(coupons).where(eq(coupons.code, code)).limit(1))[0];
  if (!c) return { ok: false, reason: "not found" };
  if (!c.active) return { ok: false, reason: "inactive" };
  if (c.expiresAt && c.expiresAt.getTime() <= Date.now()) return { ok: false, reason: "expired" };
  if (c.maxRedemptions != null && c.timesRedeemed >= c.maxRedemptions) {
    return { ok: false, reason: "max redemptions reached" };
  }
  if (c.tenantId && c.tenantId !== tenantId) return { ok: false, reason: "wrong tenant" };

  const value = parseFloat(c.value);
  const bonusCredits =
    c.kind === "fixed_credits" ? value : Math.round(((amountUsd * value) / 100) * 100) / 100;
  return { ok: true, bonusCredits };
}
