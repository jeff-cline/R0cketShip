"use server";
import { redirect } from "next/navigation";
import { requireAuth } from "@/src/auth/guard";
import { createTenant } from "@/src/tenant/manage";

export async function launchAction(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  await requireAuth(["god"]);
  const offers = [1, 2, 3].map((i) => ({
    id: i,
    title: String(formData.get(`o${i}t`) ?? "").trim(),
    description: String(formData.get(`o${i}d`) ?? "").trim(),
    price: String(formData.get(`o${i}p`) ?? "").trim(),
  })).filter((o) => o.title);
  const theme = {
    primary: String(formData.get("primary") ?? "#0a3d62"),
    secondary: String(formData.get("secondary") ?? "#3c6382"),
    accent: String(formData.get("accent") ?? "#e58e26"),
    background: String(formData.get("background") ?? "#ffffff"),
    foreground: String(formData.get("foreground") ?? "#0b132b"),
    fontFamily: "system-ui, sans-serif",
  };
  const style = String(formData.get("style") ?? "bold") as "trust" | "bold" | "dark";
  try {
    await createTenant({
      domain: String(formData.get("domain") ?? ""),
      niche: String(formData.get("niche") ?? ""),
      moneyWord: String(formData.get("moneyWord") ?? ""),
      offers,
      theme,
      style,
      monthlyPriceDefault: String(formData.get("monthlyPriceDefault") ?? "").trim() || "1500",
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  redirect("/admin/tenants");
}
