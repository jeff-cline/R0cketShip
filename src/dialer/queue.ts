import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { leads, calls, leadDeliveries } from "../db/schema";

type Disposition = "no_answer" | "left_message" | "callback" | "hot_transfer" | "booked" | "sold" | "dead";
const TERMINAL: Disposition[] = ["booked", "sold", "dead", "hot_transfer"];

export async function nextLeadToCall(tenantId: string, now: Date = new Date()) {
  const tenantLeads = await db.select().from(leads).where(eq(leads.tenantId, tenantId)).orderBy(desc(leads.lastUpdated));
  for (const lead of tenantLeads) {
    const last = (await db.select().from(calls).where(eq(calls.leadId, lead.id)).orderBy(desc(calls.createdAt)).limit(1))[0];
    if (!last) return lead;
    if (TERMINAL.includes(last.disposition as Disposition)) continue;
    if (last.disposition === "callback" && last.callbackAt && last.callbackAt.getTime() > now.getTime()) continue;
    return lead;
  }
  return null;
}

export async function recordCall(
  tenantId: string,
  leadId: string,
  agentId: string,
  input: { disposition: Disposition; notes?: string; callbackAt?: Date | null; saleValue?: number | null },
) {
  const [row] = await db.insert(calls).values({
    tenantId, leadId, agentId, disposition: input.disposition,
    notes: input.notes ?? null, callbackAt: input.callbackAt ?? null,
    saleValue: input.saleValue != null ? String(input.saleValue) : null,
  }).returning();
  if (input.disposition === "booked" || input.disposition === "sold") {
    const d = (await db.select().from(leadDeliveries).where(eq(leadDeliveries.leadId, leadId)).limit(1))[0];
    if (d) {
      await db.update(leadDeliveries).set({
        status: input.disposition,
        saleValue: input.saleValue != null ? String(input.saleValue) : d.saleValue,
        updatedAt: new Date(),
      }).where(eq(leadDeliveries.id, d.id));
    }
  }
  return row;
}

export async function agentKpis(agentId: string) {
  const rows = await db.select().from(calls).where(eq(calls.agentId, agentId));
  const isContact = (d: string) => d !== "no_answer" && d !== "left_message";
  const isBooking = (d: string) => d === "booked" || d === "sold";
  const revenue = Math.round(rows.reduce((s, r) => s + (r.saleValue ? parseFloat(r.saleValue) : 0), 0) * 100) / 100;
  return {
    calls: rows.length,
    contacts: rows.filter((r) => isContact(r.disposition)).length,
    bookings: rows.filter((r) => isBooking(r.disposition)).length,
    sales: rows.filter((r) => r.disposition === "sold").length,
    revenue,
  };
}
