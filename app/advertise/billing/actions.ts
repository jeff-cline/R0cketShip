"use server";
/**
 * Billing server actions: apply coupon.
 *
 * Deposit is handled via the existing `/api/advertiser/deposit` POST endpoint
 * (which returns either a Stripe Checkout URL or a manual-mode message). We
 * keep deposit in the API route because Stripe Checkout needs a JSON response
 * the client can navigate to; server actions don't have that ergonomic edge.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdvertiserContext } from "@/src/auth/advertiser";
import { grantCoupon } from "@/src/advertiser/wallet";

export async function applyCouponAction(formData: FormData): Promise<void> {
  const ctx = await getAdvertiserContext();
  if (!ctx) redirect("/advertise/login");
  const code = String(formData.get("couponCode") ?? "").trim();
  if (!code) redirect("/advertise/billing?coupon_error=missing");

  const result = await grantCoupon({
    advertiserId: ctx.advertiser.id,
    couponCode: code,
  });
  revalidatePath("/advertise/billing");
  revalidatePath("/advertise/dashboard");
  if (!result.ok) {
    redirect(`/advertise/billing?coupon_error=${encodeURIComponent(result.reason)}`);
  }
  redirect(
    `/advertise/billing?coupon_success=${encodeURIComponent(String(result.amountCents))}`,
  );
}
