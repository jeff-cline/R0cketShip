import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/src/db/client";
import { crewTickets, crewTicketOrders, crewUsers } from "@/src/db/schema";

export const runtime = "nodejs";

// MVP: reserves the order and records the per-venue rev share. Payment is wired to
// Stripe in a later pass; for now an order is "reserved".
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { ticketId?: string; email?: string; qty?: number; passCode?: string } | null;
  const ticketId = String(b?.ticketId ?? "");
  const qty = Math.max(1, Math.min(10, Math.round(Number(b?.qty)) || 1));
  if (!ticketId) return NextResponse.json({ error: "ticketId required" }, { status: 400 });

  const t = (await db.select().from(crewTickets).where(eq(crewTickets.id, ticketId)).limit(1))[0];
  if (!t || t.status !== "active") return NextResponse.json({ error: "not available" }, { status: 404 });

  const amount = t.priceCents * qty;
  const revShare = Math.round((amount * t.revSharePct) / 100);

  let crewUserId: string | null = null;
  const passCode = String(b?.passCode ?? "").trim();
  if (passCode) {
    crewUserId = (await db.select({ id: crewUsers.id }).from(crewUsers).where(eq(crewUsers.passCode, passCode)).limit(1))[0]?.id ?? null;
  }

  await db.insert(crewTicketOrders).values({
    ticketId: t.id, crewUserId, email: String(b?.email ?? "").slice(0, 160) || null,
    qty, amountCents: amount, revShareCents: revShare, status: "reserved",
  });
  await db.update(crewTickets).set({ sold: sql`${crewTickets.sold} + ${qty}`, updatedAt: new Date() }).where(eq(crewTickets.id, t.id));

  return NextResponse.json({ ok: true, amountCents: amount });
}
