"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/src/auth/guard";
import { setPayoutSettings, type PayoutMethod } from "@/src/referral/payouts";

/** Partner dashboard: save the partner's payout settings. */
export async function savePayoutAction(formData: FormData): Promise<void> {
  const ctx = await requireAuth(["partner"]);
  const raw = String(formData.get("method") ?? "manual");
  const method: PayoutMethod = raw === "paypal" || raw === "stripe_connect" ? raw : "manual";
  const paypalEmail = String(formData.get("paypalEmail") ?? "").trim() || null;
  await setPayoutSettings(ctx.user.id, { method, paypalEmail, stripeConnectId: undefined });
  revalidatePath("/partner");
}
