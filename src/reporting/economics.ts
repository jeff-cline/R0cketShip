import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../db/client";
import { tenants, leadDeliveries, payments } from "../db/schema";

/**
 * The r0cketship revenue model.
 *
 * A white-label sells leads/subscriptions to its own customers for `sales`
 * dollars. r0cketship takes `feeRate` (default 0.60) of that as its platform
 * revenue — this is what shows up as a "platform / data cost" line on the
 * white-label's P&L. The white-label keeps the rest (`1 - feeRate`).
 *
 * r0cketship's gross profit is its platform revenue minus the real cost of the
 * data, modeled as `dataCostRate` of sales.
 */
export interface Economics {
  sales: number;
  feeRate: number;
  dataCostRate: number;
  platformRevenue: number; // r0cketship revenue (the 60% cut)
  whitelabelNet: number; // what the white-label keeps (the 40%)
  dataCost: number; // r0cketship's cost of data
  grossProfit: number; // platformRevenue - dataCost
  grossMargin: number; // grossProfit / platformRevenue (0 when no revenue)
}

export function computeEconomics(sales: number, feeRate: number, dataCostRate: number): Economics {
  const s = Number.isFinite(sales) && sales > 0 ? sales : 0;
  const fr = clamp01(feeRate);
  const dr = clamp01(dataCostRate);
  const platformRevenue = s * fr;
  const whitelabelNet = s * (1 - fr);
  const dataCost = s * dr;
  const grossProfit = platformRevenue - dataCost;
  return {
    sales: s,
    feeRate: fr,
    dataCostRate: dr,
    platformRevenue,
    whitelabelNet,
    dataCost,
    grossProfit,
    grossMargin: platformRevenue > 0 ? grossProfit / platformRevenue : 0,
  };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Gross dollar sales for one tenant: delivered-lead value + paid subscription invoices. */
export async function tenantSales(tenantId: string): Promise<number> {
  const [leadRow] = await db
    .select({ total: sql<string>`coalesce(sum(${leadDeliveries.priceCredits}), 0)` })
    .from(leadDeliveries)
    .where(eq(leadDeliveries.tenantId, tenantId));
  const [subRow] = await db
    .select({ total: sql<string>`coalesce(sum(${payments.amountUsd}), 0)` })
    .from(payments)
    .where(and(eq(payments.tenantId, tenantId), eq(payments.purpose, "subscription"), eq(payments.status, "paid")));
  return num(leadRow?.total) + num(subRow?.total);
}

export interface TenantEconomicsRow extends Economics {
  tenantId: string;
  domain: string;
  niche: string;
}

/** Per-white-label economics for the God dashboard, plus platform totals. */
export async function platformEconomics(): Promise<{
  totals: Economics;
  byTenant: TenantEconomicsRow[];
}> {
  const rows = await db
    .select({ id: tenants.id, domain: tenants.domain, niche: tenants.niche, feeRate: tenants.platformFeeRate, dataCostRate: tenants.dataCostRate })
    .from(tenants);

  const byTenant: TenantEconomicsRow[] = [];
  for (const t of rows) {
    const sales = await tenantSales(t.id);
    const e = computeEconomics(sales, num(t.feeRate), num(t.dataCostRate));
    byTenant.push({ ...e, tenantId: t.id, domain: t.domain, niche: t.niche });
  }
  byTenant.sort((a, b) => b.platformRevenue - a.platformRevenue);

  const totals = byTenant.reduce<Economics>(
    (acc, r) => ({
      sales: acc.sales + r.sales,
      feeRate: 0,
      dataCostRate: 0,
      platformRevenue: acc.platformRevenue + r.platformRevenue,
      whitelabelNet: acc.whitelabelNet + r.whitelabelNet,
      dataCost: acc.dataCost + r.dataCost,
      grossProfit: acc.grossProfit + r.grossProfit,
      grossMargin: 0,
    }),
    { sales: 0, feeRate: 0, dataCostRate: 0, platformRevenue: 0, whitelabelNet: 0, dataCost: 0, grossProfit: 0, grossMargin: 0 },
  );
  totals.grossMargin = totals.platformRevenue > 0 ? totals.grossProfit / totals.platformRevenue : 0;
  return { totals, byTenant };
}

/** Economics for a single white-label (manager view) given its tenant row fields. */
export async function tenantEconomics(t: { id: string; platformFeeRate: string; dataCostRate: string }): Promise<Economics> {
  const sales = await tenantSales(t.id);
  return computeEconomics(sales, num(t.platformFeeRate), num(t.dataCostRate));
}

/** Monthly sales series (last `months` months) for charting. tenantId omitted = platform-wide. */
export async function salesTimeSeries(months = 6, tenantId?: string): Promise<{ labels: string[]; values: number[] }> {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const leadWhere = tenantId ? and(gte(leadDeliveries.deliveredAt, since), eq(leadDeliveries.tenantId, tenantId)) : gte(leadDeliveries.deliveredAt, since);
  const leadRows = await db
    .select({ m: sql<string>`to_char(${leadDeliveries.deliveredAt}, 'YYYY-MM')`, total: sql<string>`coalesce(sum(${leadDeliveries.priceCredits}),0)` })
    .from(leadDeliveries)
    .where(leadWhere)
    .groupBy(sql`to_char(${leadDeliveries.deliveredAt}, 'YYYY-MM')`);

  const subWhere = tenantId
    ? and(gte(payments.paidAt, since), eq(payments.tenantId, tenantId), eq(payments.purpose, "subscription"), eq(payments.status, "paid"))
    : and(gte(payments.paidAt, since), eq(payments.purpose, "subscription"), eq(payments.status, "paid"));
  const subRows = await db
    .select({ m: sql<string>`to_char(${payments.paidAt}, 'YYYY-MM')`, total: sql<string>`coalesce(sum(${payments.amountUsd}),0)` })
    .from(payments)
    .where(subWhere)
    .groupBy(sql`to_char(${payments.paidAt}, 'YYYY-MM')`);

  const byMonth = new Map<string, number>();
  for (const r of leadRows) byMonth.set(r.m, (byMonth.get(r.m) ?? 0) + num(r.total));
  for (const r of subRows) byMonth.set(r.m, (byMonth.get(r.m) ?? 0) + num(r.total));

  const labels: string[] = [];
  const values: number[] = [];
  const cursor = new Date(since);
  for (let i = 0; i < months; i++) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    labels.push(cursor.toLocaleString("en-US", { month: "short" }));
    values.push(byMonth.get(key) ?? 0);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return { labels, values };
}
