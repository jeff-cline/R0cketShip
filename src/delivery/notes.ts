import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { leadDeliveries, leads, leadNotes } from "../db/schema";

export type DeliveryStatus = "new" | "contacted" | "booked" | "sold" | "dead";

/** Full lead record + delivery, ownership-checked. Returns null if not the owner's. */
export async function getDeliveryDetail(customerId: string, deliveryId: string) {
  const row = (
    await db
      .select()
      .from(leadDeliveries)
      .innerJoin(leads, eq(leadDeliveries.leadId, leads.id))
      .where(and(eq(leadDeliveries.id, deliveryId), eq(leadDeliveries.customerId, customerId)))
      .limit(1)
  )[0];
  if (!row) return null;
  return { delivery: row.lead_deliveries, lead: row.leads };
}

/** Timestamped activity log for a delivery (newest first). */
export async function getLeadNotes(deliveryId: string) {
  return db.select().from(leadNotes).where(eq(leadNotes.deliveryId, deliveryId)).orderBy(desc(leadNotes.createdAt));
}

/**
 * Append a timestamped note and/or disposition to a lead. When a disposition is
 * given it also updates the delivery's status (and sale value). Ownership-checked.
 */
export async function addLeadNote(
  customerId: string,
  deliveryId: string,
  input: { body?: string; disposition?: DeliveryStatus | ""; saleValue?: number | null },
): Promise<boolean> {
  const existing = (await db.select().from(leadDeliveries).where(eq(leadDeliveries.id, deliveryId)).limit(1))[0];
  if (!existing || existing.customerId !== customerId) return false;

  const body = (input.body ?? "").trim();
  const disposition = input.disposition ? input.disposition : undefined;
  if (!body && !disposition && input.saleValue === undefined) return false;

  await db.insert(leadNotes).values({
    deliveryId,
    tenantId: existing.tenantId,
    customerId,
    body: body || null,
    disposition: disposition ?? null,
  });

  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (disposition) set.status = disposition;
  if (input.saleValue !== undefined) set.saleValue = input.saleValue === null || Number.isNaN(input.saleValue) ? null : String(input.saleValue);
  if (Object.keys(set).length > 1) {
    await db.update(leadDeliveries).set(set).where(eq(leadDeliveries.id, deliveryId));
  }
  return true;
}
