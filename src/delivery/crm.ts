import { eq, desc } from "drizzle-orm";
import { db } from "../db/client";
import { leadDeliveries, leads } from "../db/schema";
import type { DeliveryStats } from "./types";

export async function myDeliveries(customerId: string) {
  return db
    .select({
      deliveryId: leadDeliveries.id,
      status: leadDeliveries.status,
      notes: leadDeliveries.notes,
      saleValue: leadDeliveries.saleValue,
      priceCredits: leadDeliveries.priceCredits,
      tier: leadDeliveries.tierAtDelivery,
      deliveredAt: leadDeliveries.deliveredAt,
      leadId: leads.id,
      firstName: leads.firstName,
      lastName: leads.lastName,
      zip: leads.zip,
      city: leads.city,
      state: leads.state,
      address: leads.address,
      phones: leads.personalPhones,
      mobilePhones: leads.mobilePhones,
      emails: leads.emails,
      segment: leads.segment,
      scoreCategory: leads.scoreCategory,
    })
    .from(leadDeliveries)
    .innerJoin(leads, eq(leadDeliveries.leadId, leads.id))
    .where(eq(leadDeliveries.customerId, customerId))
    .orderBy(desc(leadDeliveries.deliveredAt));
}

export async function updateDelivery(
  customerId: string,
  deliveryId: string,
  patch: { status?: "new" | "contacted" | "booked" | "sold" | "dead"; notes?: string; saleValue?: number | null },
) {
  const existing = (await db.select().from(leadDeliveries).where(eq(leadDeliveries.id, deliveryId)).limit(1))[0];
  if (!existing || existing.customerId !== customerId) throw new Error("Not authorized");
  const [row] = await db
    .update(leadDeliveries)
    .set({
      status: patch.status ?? existing.status,
      notes: patch.notes ?? existing.notes,
      saleValue:
        patch.saleValue === undefined
          ? existing.saleValue
          : patch.saleValue === null || Number.isNaN(patch.saleValue)
            ? null
            : String(patch.saleValue),
      updatedAt: new Date(),
    })
    .where(eq(leadDeliveries.id, deliveryId))
    .returning();
  return row;
}

export async function deliveryStats(customerId: string): Promise<DeliveryStats> {
  const rows = await db
    .select({ status: leadDeliveries.status, saleValue: leadDeliveries.saleValue, priceCredits: leadDeliveries.priceCredits })
    .from(leadDeliveries)
    .where(eq(leadDeliveries.customerId, customerId));
  let conversions = 0, revenue = 0, creditsSpent = 0;
  for (const r of rows) {
    if (r.status === "booked" || r.status === "sold") conversions++;
    if (r.saleValue) revenue += parseFloat(r.saleValue);
    creditsSpent += parseFloat(r.priceCredits);
  }
  return {
    delivered: rows.length,
    conversions,
    revenue: Math.round(revenue * 100) / 100,
    creditsSpent: Math.round(creditsSpent * 100) / 100,
  };
}

export function deliveriesCsv(rows: Record<string, unknown>[]): string {
  const cols = ["first_name", "last_name", "address", "city", "state", "zip", "phones", "emails", "status", "sale_value", "price_credits"];
  const map: Record<string, string> = {
    first_name: "firstName", last_name: "lastName", address: "address", city: "city",
    state: "state", zip: "zip", phones: "phones", emails: "emails", status: "status",
    sale_value: "saleValue", price_credits: "priceCredits",
  };
  const esc = (v: unknown) => {
    const s = Array.isArray(v) ? v.join("; ") : v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.join(",");
  const lines = rows.map((r) => cols.map((c) => esc(r[map[c]])).join(","));
  return [header, ...lines].join("\n");
}
