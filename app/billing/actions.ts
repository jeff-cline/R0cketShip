"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/src/auth/guard";
import { getWalletForUser, ensureWalletWithBonus } from "@/src/billing/wallet";
import { createTopup } from "@/src/billing/topup";

export async function topUpAction(_prev: unknown, formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const ctx = await requireAuth(["customer"]);
  const amount = Number(formData.get("amount") ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a positive amount." };
  const couponCode = String(formData.get("coupon") ?? "").trim() || undefined;
  const wallet = (await getWalletForUser(ctx.user.id)) ?? (await ensureWalletWithBonus(ctx.user.id));
  const { getCurrentTenant } = await import("@/src/tenant/context");
  const tenant = await getCurrentTenant();
  const base = tenant ? `https://${tenant.domain}` : "";
  let start;
  try {
    const res = await createTopup(wallet.id, amount, couponCode, { success: `${base}/billing?paid=1`, cancel: `${base}/billing` });
    start = res.start;
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (start.kind === "redirect" && start.url) {
    const { redirect } = await import("next/navigation");
    redirect(start.url);
  }
  revalidatePath("/billing");
  return { ok: true };
}
