"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { payments } from "@/src/db/schema";
import { requireAuth } from "@/src/auth/guard";
import { confirmPayment } from "@/src/billing/topup";
import { grantCreditsAs } from "@/src/billing/wallet";
import { createCoupon } from "@/src/billing/coupons";

export async function markPaidAction(formData: FormData) {
  const ctx = await requireAuth(["god", "manager"]);
  const paymentId = String(formData.get("paymentId") ?? "");
  const p = (await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1))[0];
  if (p && (ctx.user.role === "god" || p.tenantId === ctx.user.tenantId)) {
    await confirmPayment(paymentId);
  }
  revalidatePath("/admin/billing");
}

export async function grantCreditsAction(formData: FormData) {
  const ctx = await requireAuth(["god", "manager"]);
  const walletId = String(formData.get("walletId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  if (walletId && Number.isFinite(amount) && amount !== 0) {
    try {
      await grantCreditsAs({ role: ctx.user.role, tenantId: ctx.user.tenantId }, walletId, amount, String(formData.get("description") ?? "Admin grant"));
    } catch {
      // ignore unauthorized / not-found
    }
  }
  revalidatePath("/admin/billing");
}

export async function createCouponAction(formData: FormData) {
  await requireAuth(["god", "manager"]);
  const code = String(formData.get("code") ?? "").trim();
  const kind = String(formData.get("kind") ?? "fixed_credits") as "percent" | "fixed_credits";
  const value = Number(formData.get("value") ?? 0);
  if (code && value > 0) await createCoupon({ code, kind, value });
  revalidatePath("/admin/billing");
}
