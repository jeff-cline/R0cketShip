"use server";
import { requireAuth } from "@/src/auth/guard";
import { updateTenantConfig } from "@/src/tenant/manage";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveBrandingAction(formData: FormData) {
  const ctx = await requireAuth(["god", "manager"]);
  const s = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? null : v;
  };
  const theme = {
    primary: String(formData.get("primary") || "#0e7490"),
    secondary: String(formData.get("secondary") || "#155e75"),
    accent: String(formData.get("accent") || "#f97316"),
    background: String(formData.get("background") || "#ffffff"),
    foreground: String(formData.get("foreground") || "#0f2a33"),
    fontFamily: "system-ui, sans-serif",
  };
  const style = String(formData.get("style") || "bold") as "trust" | "bold" | "dark";
  await updateTenantConfig(ctx.user.tenantId, {
    heroHeadline: s("heroHeadline"),
    heroSubhead: s("heroSubhead"),
    heroImage: s("heroImage"),
    heroVideo: s("heroVideo"),
    logoUrl: s("logoUrl"),
    theme,
    style,
  });
  revalidatePath("/admin/branding");
  redirect("/admin/branding?saved=1");
}
