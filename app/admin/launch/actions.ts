"use server";
import { redirect } from "next/navigation";
import { requireAuth } from "@/src/auth/guard";
import { createTenant } from "@/src/tenant/manage";
import type { Offer } from "@/src/tenant/types";

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function emptyToNull(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

export async function launchAction(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  await requireAuth(["god"]);

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

  const platformFeeRate = clamp01(Number(formData.get("platformFeePct") || 60) / 100).toString();
  const dataCostRate = clamp01(Number(formData.get("dataCostPct") || 0) / 100).toString();

  let row;
  try {
    row = await createTenant({
      domain: String(formData.get("domain") ?? ""),
      niche: String(formData.get("niche") ?? ""),
      moneyWord: String(formData.get("moneyWord") ?? ""),
      offers,
      theme,
      style,
      monthlyPriceDefault: String(formData.get("monthlyPriceDefault") ?? "").trim() || "1500",
      heroImage: emptyToNull(formData.get("heroImage")),
      heroHeadline: emptyToNull(formData.get("heroHeadline")),
      heroSubhead: emptyToNull(formData.get("heroSubhead")),
      platformFeeRate,
      dataCostRate,
    });
  } catch (e) {
    return { error: String((e as Error).message || e) };
  }
  redirect(`/admin/tenants/${row.id}?created=1`);
}
