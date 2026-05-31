import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { tenants } from "../db/schema";
import type { Tenant } from "./types";

/** Lowercase, strip port and a leading "www.". */
export function normalizeHost(host: string): string {
  return host
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/^www\./, "")
    .trim();
}

export async function getTenantByHost(host: string): Promise<Tenant | null> {
  const domain = normalizeHost(host);
  const rows = await db
    .select()
    .from(tenants)
    .where(eq(tenants.domain, domain))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    domain: row.domain,
    ip: row.ip,
    niche: row.niche,
    moneyWord: row.moneyWord,
    logoUrl: row.logoUrl,
    theme: row.theme,
    offers: row.offers,
    monthlyPriceDefault: row.monthlyPriceDefault,
    footerHtml: row.footerHtml,
    activePaymentProvider: row.activePaymentProvider,
    status: row.status,
  };
}
