"use server";
import { redirect } from "next/navigation";
import { requireAuth } from "@/src/auth/guard";
import { createTenant, THEME_PRESETS } from "@/src/tenant/manage";

export async function launchAction(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  await requireAuth(["god"]);
  const offers = [1, 2, 3].map((i) => ({
    id: i,
    title: String(formData.get(`o${i}t`) ?? "").trim(),
    description: String(formData.get(`o${i}d`) ?? "").trim(),
    price: String(formData.get(`o${i}p`) ?? "").trim(),
  })).filter((o) => o.title);
  const themeIdx = Number(formData.get("theme") ?? 0);
  try {
    await createTenant({
      domain: String(formData.get("domain") ?? ""),
      niche: String(formData.get("niche") ?? ""),
      moneyWord: String(formData.get("moneyWord") ?? ""),
      offers,
      theme: THEME_PRESETS[themeIdx] ?? THEME_PRESETS[0],
      monthlyPriceDefault: String(formData.get("monthlyPriceDefault") ?? "").trim() || "1500",
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  redirect("/admin/tenants");
}
