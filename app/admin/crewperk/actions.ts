"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { crewMerchants } from "@/src/db/schema";
import { requireAuth } from "@/src/auth/guard";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "merchant";
}
function imgList(s: string): string[] {
  return String(s).split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(0, 12);
}
function fields(fd: FormData) {
  const num = (k: string) => { const v = String(fd.get(k) ?? "").trim(); return v ? v : null; };
  return {
    name: String(fd.get("name") ?? "").trim(),
    category: String(fd.get("category") ?? "Food & Drink"),
    port: String(fd.get("port") ?? "San Juan, Puerto Rico"),
    tier: String(fd.get("tier") ?? "community_builder"),
    description: String(fd.get("description") ?? "").trim() || null,
    phone: String(fd.get("phone") ?? "").trim() || null,
    address: String(fd.get("address") ?? "").trim() || null,
    website: String(fd.get("website") ?? "").trim() || null,
    images: imgList(String(fd.get("images") ?? "")),
    perk: String(fd.get("perk") ?? "").trim() || null,
    priceLevel: String(fd.get("priceLevel") ?? "$$"),
    lat: num("lat"),
    lon: num("lon"),
    featured: fd.get("featured") === "on",
    status: String(fd.get("status") ?? "active"),
    couponCode: String(fd.get("couponCode") ?? "").trim() || null,
    couponType: String(fd.get("couponType") ?? "").trim() || null,
    couponNote: String(fd.get("couponNote") ?? "").trim() || null,
  };
}

export async function createMerchantAction(fd: FormData) {
  await requireAuth(["god"]);
  const f = fields(fd);
  if (!f.name) { revalidatePath("/admin/crewperk"); return; }
  let slug = slugify(f.name);
  const exists = (await db.select({ id: crewMerchants.id }).from(crewMerchants).where(eq(crewMerchants.slug, slug)).limit(1))[0];
  if (exists) slug = `${slug}-${Date.now().toString(36).slice(-3)}`;
  await db.insert(crewMerchants).values({ slug, ...f });
  revalidatePath("/admin/crewperk");
}

export async function saveMerchantAction(fd: FormData) {
  await requireAuth(["god"]);
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await db.update(crewMerchants).set({ ...fields(fd), updatedAt: new Date() }).where(eq(crewMerchants.id, id));
  revalidatePath("/admin/crewperk");
  revalidatePath(`/admin/crewperk/${id}`);
}

export async function deleteMerchantAction(fd: FormData) {
  await requireAuth(["god"]);
  const id = String(fd.get("id") ?? "");
  if (id) await db.delete(crewMerchants).where(eq(crewMerchants.id, id));
  revalidatePath("/admin/crewperk");
}
