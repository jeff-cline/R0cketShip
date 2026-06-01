import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { tenants } from "../db/schema";
import { generateIngestKey } from "../leads/ingest-key";
import type { TenantTheme, Offer } from "./types";

export type TenantRow = typeof tenants.$inferSelect;
type Provider = "manual" | "stripe" | "paypal";

export const THEME_PRESETS: TenantTheme[] = [
  { primary: "#0a3d62", secondary: "#3c6382", accent: "#e58e26", background: "#ffffff", foreground: "#0b132b", fontFamily: "system-ui, sans-serif" },
  { primary: "#14532d", secondary: "#166534", accent: "#16a34a", background: "#ffffff", foreground: "#052e16", fontFamily: "system-ui, sans-serif" },
  { primary: "#3b0764", secondary: "#6b21a8", accent: "#a855f7", background: "#ffffff", foreground: "#1e1b4b", fontFamily: "system-ui, sans-serif" },
  { primary: "#7c2d12", secondary: "#9a3412", accent: "#ea580c", background: "#fffbeb", foreground: "#431407", fontFamily: "system-ui, sans-serif" },
  { primary: "#0c4a6e", secondary: "#075985", accent: "#0ea5e9", background: "#ffffff", foreground: "#082f49", fontFamily: "system-ui, sans-serif" },
  { primary: "#111827", secondary: "#1f2937", accent: "#ef4444", background: "#ffffff", foreground: "#111827", fontFamily: "system-ui, sans-serif" },
];

export const ROCKETSHIP_THEME: TenantTheme = {
  primary: "#0e7490",
  secondary: "#155e75",
  accent: "#f97316",
  background: "#ffffff",
  foreground: "#0f2a33",
  fontFamily: "system-ui, sans-serif",
};

export const NAMED_PRESETS: { name: string; theme: TenantTheme }[] = [
  { name: "R0cketShip", theme: ROCKETSHIP_THEME },
  { name: "Roofing", theme: THEME_PRESETS[0] },
  { name: "Solar", theme: THEME_PRESETS[1] },
  { name: "Violet", theme: THEME_PRESETS[2] },
  { name: "Sky", theme: THEME_PRESETS[4] },
  { name: "Slate", theme: THEME_PRESETS[5] },
];

export async function createTenant(input: {
  domain: string;
  niche: string;
  moneyWord: string;
  offers: Offer[];
  theme?: TenantTheme;
  monthlyPriceDefault?: string;
  footerHtml?: string;
  logoUrl?: string | null;
  style?: "trust" | "bold" | "dark";
  platformFeeRate?: string;
  dataCostRate?: string;
  heroImage?: string | null;
  heroVideo?: string | null;
  heroHeadline?: string | null;
  heroSubhead?: string | null;
}): Promise<TenantRow> {
  const domain = input.domain.toLowerCase().trim();
  if (!domain) throw new Error("domain required");
  const dup = await db.select().from(tenants).where(eq(tenants.domain, domain)).limit(1);
  if (dup.length) throw new Error("a white-label with that domain already exists");
  const [row] = await db
    .insert(tenants)
    .values({
      domain,
      ip: "137.220.56.129",
      niche: input.niche,
      moneyWord: input.moneyWord,
      logoUrl: input.logoUrl ?? null,
      theme: input.theme ?? THEME_PRESETS[0],
      offers: input.offers,
      monthlyPriceDefault: input.monthlyPriceDefault ?? "1500",
      footerHtml: input.footerHtml ?? `<p>${domain}</p>`,
      activePaymentProvider: "stripe",
      status: "active",
      ingestKey: generateIngestKey(),
      signupBonusCredits: "50",
      style: input.style ?? "bold",
      platformFeeRate: input.platformFeeRate ?? "0.60",
      dataCostRate: input.dataCostRate ?? "0.00",
      heroImage: input.heroImage ?? null,
      heroVideo: input.heroVideo ?? null,
      heroHeadline: input.heroHeadline ?? null,
      heroSubhead: input.heroSubhead ?? null,
    })
    .returning();
  return row;
}

export async function updateTenantConfig(
  id: string,
  patch: Partial<{
    moneyWord: string;
    niche: string;
    logoUrl: string | null;
    theme: TenantTheme;
    offers: Offer[];
    monthlyPriceDefault: string;
    signupBonusCredits: string;
    footerHtml: string;
    activePaymentProvider: Provider;
    status: "active" | "inactive";
    style: "trust" | "bold" | "dark";
    platformFeeRate: string;
    dataCostRate: string;
    heroImage: string | null;
    heroVideo: string | null;
    heroHeadline: string | null;
    heroSubhead: string | null;
  }>,
): Promise<void> {
  const set: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) if (v !== undefined) set[k] = v;
  if (Object.keys(set).length === 0) return;
  await db.update(tenants).set(set).where(eq(tenants.id, id));
}
