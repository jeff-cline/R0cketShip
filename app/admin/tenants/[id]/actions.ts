"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/src/auth/guard";
import { updateTenantConfig, THEME_PRESETS } from "@/src/tenant/manage";

export async function saveConfigAction(formData: FormData) {
  await requireAuth(["god"]);
  const id = String(formData.get("id") ?? "");
  const offers = [1, 2, 3].map((i) => ({
    id: i,
    title: String(formData.get(`o${i}t`) ?? "").trim(),
    description: String(formData.get(`o${i}d`) ?? "").trim(),
    price: String(formData.get(`o${i}p`) ?? "").trim(),
  })).filter((o) => o.title);
  await updateTenantConfig(id, {
    moneyWord: String(formData.get("moneyWord") ?? ""),
    niche: String(formData.get("niche") ?? ""),
    monthlyPriceDefault: String(formData.get("monthlyPriceDefault") ?? "").trim() || "1500",
    signupBonusCredits: String(formData.get("signupBonusCredits") ?? "").trim() || "50",
    logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
    footerHtml: String(formData.get("footerHtml") ?? ""),
    offers,
    style: String(formData.get("style") ?? "bold") as "trust" | "bold" | "dark",
    theme: {
      primary: String(formData.get("primary") ?? "#0a3d62"),
      secondary: String(formData.get("secondary") ?? "#3c6382"),
      accent: String(formData.get("accent") ?? "#e58e26"),
      background: String(formData.get("background") ?? "#ffffff"),
      foreground: String(formData.get("foreground") ?? "#0b132b"),
      fontFamily: "system-ui, sans-serif",
    },
  });
  revalidatePath(`/admin/tenants/${id}`);
}

export async function regenerateThemeAction(formData: FormData) {
  await requireAuth(["god"]);
  const id = String(formData.get("id") ?? "");
  const cur = Number(formData.get("themeIdx") ?? 0);
  const next = (cur + 1) % THEME_PRESETS.length;
  await updateTenantConfig(id, { theme: THEME_PRESETS[next] });
  revalidatePath(`/admin/tenants/${id}`);
}
