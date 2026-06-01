"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { updateTenantConfig } from "@/src/tenant/manage";
import type { Offer } from "@/src/tenant/types";

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function emptyToNull(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

export async function updateAction(formData: FormData) {
  await requireAuth(["god"]);
  const id = String(formData.get("id") ?? "");

  const offers: Offer[] = [1, 2, 3]
    .map((i) => ({
      id: i,
      title: String(formData.get(`o${i}t`) ?? "").trim(),
      description: String(formData.get(`o${i}d`) ?? "").trim(),
      price: String(formData.get(`o${i}p`) ?? "").trim(),
      features: String(formData.get(`o${i}f`) ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    }))
    .filter((o) => o.title);

  const theme = {
    primary: String(formData.get("primary") ?? "#0a3d62"),
    secondary: String(formData.get("secondary") ?? "#3c6382"),
    accent: String(formData.get("accent") ?? "#e58e26"),
    background: String(formData.get("background") ?? "#ffffff"),
    foreground: String(formData.get("foreground") ?? "#0b132b"),
    fontFamily: "system-ui, sans-serif",
  };
  const style = String(formData.get("style") ?? "bold") as "trust" | "bold" | "dark";
  const status = String(formData.get("status") ?? "active") as "active" | "inactive";

  const platformFeeRate = clamp01(Number(formData.get("platformFeePct") || 60) / 100).toString();
  const dataCostRate = clamp01(Number(formData.get("dataCostPct") || 0) / 100).toString();

  await updateTenantConfig(id, {
    moneyWord: String(formData.get("moneyWord") ?? ""),
    niche: String(formData.get("niche") ?? ""),
    theme,
    offers,
    style,
    monthlyPriceDefault: String(formData.get("monthlyPriceDefault") ?? "").trim() || "1500",
    signupBonusCredits: String(formData.get("signupBonusCredits") ?? "").trim() || "50",
    status,
    heroImage: emptyToNull(formData.get("heroImage")),
    heroHeadline: emptyToNull(formData.get("heroHeadline")),
    heroSubhead: emptyToNull(formData.get("heroSubhead")),
    platformFeeRate,
    dataCostRate,
  });

  revalidatePath(`/admin/tenants/${id}`);
  redirect(`/admin/tenants/${id}`);
}

/** GOD only: assign the sales rep who landed this white-label. */
export async function setLandedByAction(formData: FormData) {
  await requireAuth(["god"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const landedByUserId = String(formData.get("landedByUserId") ?? "") || null;

  await db
    .update(tenants)
    .set({
      landedByUserId,
      landedAt: landedByUserId ? new Date() : null,
    })
    .where(eq(tenants.id, id));

  revalidatePath(`/admin/tenants/${id}`);
  redirect(`/admin/tenants/${id}`);
}
