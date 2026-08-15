"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { payments, users, wallets } from "@/src/db/schema";
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

/**
 * Pretty-form Grant credits — takes a userId (resolved via email search on the
 * client) and a USD amount, grants that many credits (1:1) to the user's
 * wallet, with the operator's note recorded in the ledger description so the
 * audit trail explains *why* the grant was issued.
 *
 * Errors get bounced back to the panel via the `?grantErr=` query param so
 * the operator can correct and retry.
 */
export async function grantCreditsToUserAction(formData: FormData): Promise<void> {
  const ctx = await requireAuth(["god", "manager"]);
  const userId = String(formData.get("userId") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const note = String(formData.get("note") ?? "").trim();

  if (!userId) {
    revalidatePath("/admin/billing");
    return;
  }
  if (!Number.isFinite(amount) || amount === 0) {
    revalidatePath("/admin/billing");
    return;
  }
  if (!note) {
    revalidatePath("/admin/billing");
    return;
  }

  // Look up user → tenant; managers can only grant within their own tenant.
  const u = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!u) {
    revalidatePath("/admin/billing");
    return;
  }
  if (ctx.user.role === "manager" && u.tenantId !== ctx.user.tenantId) {
    revalidatePath("/admin/billing");
    return;
  }

  const w = (await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1))[0];
  if (!w) {
    revalidatePath("/admin/billing");
    return;
  }

  // Prefix the actor email into the description so the audit trail tells you
  // who did it, not just why. (Final ledger text: "[jeff.cline@me.com] note…")
  const fullNote = `[${ctx.user.email}] ${note}`;

  try {
    await grantCreditsAs(
      { role: ctx.user.role, tenantId: ctx.user.tenantId },
      w.id,
      amount,
      fullNote,
    );
  } catch {
    // ignore — UI will re-render and show the updated balance (or unchanged)
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
