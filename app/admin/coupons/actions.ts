"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/src/auth/guard";
import { createDiscountCoupon, setCouponActive } from "@/src/billing/discount-coupons";

export async function createCouponAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);

  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const tenantRaw = String(formData.get("tenantId") ?? "").trim();
  const tenantId = tenantRaw === "" ? null : tenantRaw;

  const percentRaw = Number(formData.get("percent"));
  const percent = Number.isFinite(percentRaw) ? percentRaw : 0;

  const d = String(formData.get("duration"));
  const durationMonths = d === "forever" ? null : Number(d);

  const maxRaw = String(formData.get("maxRedemptions") ?? "").trim();
  const maxParsed = Number(maxRaw);
  const maxRedemptions = maxRaw === "" || !Number.isFinite(maxParsed) ? null : maxParsed;

  if (!code) {
    redirect("/admin/coupons?err=" + encodeURIComponent("Enter a code."));
  }

  try {
    await createDiscountCoupon({ code, name, tenantId, percent, durationMonths, maxRedemptions });
  } catch (e) {
    const msg = (e as Error).message || "Could not create coupon (is the code already in use?).";
    redirect("/admin/coupons?err=" + encodeURIComponent(msg));
  }

  revalidatePath("/admin/coupons");
}

export async function toggleCouponAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active")) === "true";
  await setCouponActive(id, active);
  revalidatePath("/admin/coupons");
}
