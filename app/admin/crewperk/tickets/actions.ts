"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { crewTickets, crewMerchants } from "@/src/db/schema";
import { requireAuth } from "@/src/auth/guard";

const cents = (v: FormDataEntryValue | null) => Math.max(0, Math.round(Number(String(v ?? "")) * 100) || 0);
const intOrNull = (v: FormDataEntryValue | null) => { const n = Math.round(Number(String(v ?? ""))); return Number.isFinite(n) && n > 0 ? n : null; };

export async function createTicketAction(fd: FormData) {
  await requireAuth(["god"]);
  const name = String(fd.get("name") ?? "").trim();
  if (!name) { revalidatePath("/admin/crewperk/tickets"); return; }
  const merchantSlug = String(fd.get("merchantSlug") ?? "").trim();
  const merchantId = merchantSlug
    ? (await db.select({ id: crewMerchants.id }).from(crewMerchants).where(eq(crewMerchants.slug, merchantSlug)).limit(1))[0]?.id ?? null
    : null;
  await db.insert(crewTickets).values({
    name, merchantId,
    description: String(fd.get("description") ?? "").trim() || null,
    port: String(fd.get("port") ?? "San Juan, Puerto Rico").trim(),
    priceCents: cents(fd.get("price")),
    revSharePct: Math.max(0, Math.min(100, Math.round(Number(fd.get("revShare"))) || 20)),
    capacity: intOrNull(fd.get("capacity")),
    imageUrl: String(fd.get("imageUrl") ?? "").trim() || null,
    status: String(fd.get("status") ?? "active"),
  });
  revalidatePath("/admin/crewperk/tickets");
}

export async function updateTicketAction(fd: FormData) {
  await requireAuth(["god"]);
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await db.update(crewTickets).set({
    priceCents: cents(fd.get("price")),
    revSharePct: Math.max(0, Math.min(100, Math.round(Number(fd.get("revShare"))) || 20)),
    status: String(fd.get("status") ?? "active"),
    updatedAt: new Date(),
  }).where(eq(crewTickets.id, id));
  revalidatePath("/admin/crewperk/tickets");
}

export async function deleteTicketAction(fd: FormData) {
  await requireAuth(["god"]);
  const id = String(fd.get("id") ?? "");
  if (id) await db.delete(crewTickets).where(eq(crewTickets.id, id));
  revalidatePath("/admin/crewperk/tickets");
}
