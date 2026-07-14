"use server";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/src/db/client";
import { crewAds } from "@/src/db/schema";
import { requireAuth } from "@/src/auth/guard";

const cents = (v: FormDataEntryValue | null) => Math.max(0, Math.round(Number(String(v ?? "")) * 100) || 0);

export async function createAdAction(fd: FormData) {
  await requireAuth(["god"]);
  const advertiser = String(fd.get("advertiser") ?? "").trim();
  const headline = String(fd.get("headline") ?? "").trim();
  const linkUrl = String(fd.get("linkUrl") ?? "").trim();
  if (!advertiser || !headline || !linkUrl) { revalidatePath("/admin/crewperk/ads"); return; }
  await db.insert(crewAds).values({
    advertiser, headline, linkUrl,
    port: String(fd.get("port") ?? "all").trim() || "all",
    body: String(fd.get("body") ?? "").trim() || null,
    imageUrl: String(fd.get("imageUrl") ?? "").trim() || null,
    bidCents: cents(fd.get("bid")) || 50,
    balanceCents: cents(fd.get("balance")),
    status: String(fd.get("status") ?? "active"),
  });
  revalidatePath("/admin/crewperk/ads");
}

export async function updateAdAction(fd: FormData) {
  await requireAuth(["god"]);
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await db.update(crewAds).set({ bidCents: cents(fd.get("bid")) || 50, status: String(fd.get("status") ?? "active"), updatedAt: new Date() }).where(eq(crewAds.id, id));
  revalidatePath("/admin/crewperk/ads");
}

export async function topUpAdAction(fd: FormData) {
  await requireAuth(["god"]);
  const id = String(fd.get("id") ?? "");
  const add = cents(fd.get("amount"));
  if (id && add > 0) await db.update(crewAds).set({ balanceCents: sql`${crewAds.balanceCents} + ${add}`, updatedAt: new Date() }).where(eq(crewAds.id, id));
  revalidatePath("/admin/crewperk/ads");
}

export async function deleteAdAction(fd: FormData) {
  await requireAuth(["god"]);
  const id = String(fd.get("id") ?? "");
  if (id) await db.delete(crewAds).where(eq(crewAds.id, id));
  revalidatePath("/admin/crewperk/ads");
}
