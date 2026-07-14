import { and, desc, eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { crewTickets } from "@/src/db/schema";

export type TicketRow = typeof crewTickets.$inferSelect;

export async function ticketsByPort(port: string): Promise<TicketRow[]> {
  return db.select().from(crewTickets).where(and(eq(crewTickets.status, "active"), eq(crewTickets.port, port))).orderBy(desc(crewTickets.createdAt));
}
export async function ticketsByMerchant(merchantId: string): Promise<TicketRow[]> {
  return db.select().from(crewTickets).where(and(eq(crewTickets.status, "active"), eq(crewTickets.merchantId, merchantId))).orderBy(desc(crewTickets.createdAt));
}
