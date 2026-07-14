"use server";
/**
 * God-only server actions for the Offer Box admin.
 *
 *   - createOfferBoxAction: insert a fresh box, generate a unique key, route
 *     the user to the new box's edit page.
 *   - updateOfferBoxAction: rewrite the mode/niches/maxOffers/format/active
 *     fields. Name + key are immutable here (key has its own action).
 *   - regenerateKeyAction: rotate the embed key — useful when an embed leaks
 *     or we want to retire an old snippet without deleting the box.
 *   - toggleActiveAction: pause/resume.
 *   - deleteOfferBoxAction: hard delete (FK cascade removes click rows).
 *
 * All actions re-authenticate as `god` before touching the DB. The new-box
 * action collision-retries the key generator a handful of times before
 * giving up, which is more than enough for a 10-char alphanumeric namespace.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { offerBoxes } from "@/src/db/schema";
import { generateBoxKey } from "@/src/offer_box/snippets";

type Mode = "main_only" | "by_niche" | "niche_plus_n" | "top_n_all";
type Format = "html" | "iframe" | "js" | "popup";

const MODES: Mode[] = ["main_only", "by_niche", "niche_plus_n", "top_n_all"];
const FORMATS: Format[] = ["html", "iframe", "js", "popup"];

function parseMode(raw: FormDataEntryValue | null): Mode {
  const s = String(raw ?? "");
  return MODES.includes(s as Mode) ? (s as Mode) : "main_only";
}
function parseFormat(raw: FormDataEntryValue | null): Format {
  const s = String(raw ?? "");
  return FORMATS.includes(s as Format) ? (s as Format) : "iframe";
}
function parseMaxOffers(raw: FormDataEntryValue | null): number {
  const n = Number(String(raw ?? "1"));
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(9, Math.floor(n)));
}
function parseNiches(formData: FormData): string[] {
  // Collect every `niches` checkbox/select value.
  const raw = formData.getAll("niches").map((v) => String(v).trim()).filter(Boolean);
  // De-dup while preserving order — `[...new Set()]` is the cleanest way.
  return [...new Set(raw)];
}

async function freshKey(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const k = generateBoxKey();
    const collision = (
      await db.select({ id: offerBoxes.id }).from(offerBoxes).where(eq(offerBoxes.key, k)).limit(1)
    )[0];
    if (!collision) return k;
  }
  // Astronomically unlikely fallback — include a timestamp suffix so the
  // unique constraint still wins.
  return `obx_${Date.now().toString(36)}`;
}

export async function createOfferBoxAction(formData: FormData): Promise<void> {
  const ctx = await requireAuth(["god"]);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect("/admin/offer-box/new?err=" + encodeURIComponent("Name is required."));
  }
  const mode = parseMode(formData.get("mode"));
  const niches = parseNiches(formData);
  const maxOffers = parseMaxOffers(formData.get("maxOffers"));
  const format = parseFormat(formData.get("format"));

  const key = await freshKey();
  const inserted = await db
    .insert(offerBoxes)
    .values({
      key,
      name,
      mode,
      niches,
      maxOffers,
      format,
      active: true,
      createdBy: ctx.user.id,
    })
    .returning({ id: offerBoxes.id });

  const id = inserted[0]?.id;
  revalidatePath("/admin/offer-box");
  if (id) {
    redirect(`/admin/offer-box/${id}?created=1`);
  }
  redirect("/admin/offer-box");
}

export async function updateOfferBoxAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const name = String(formData.get("name") ?? "").trim();
  const mode = parseMode(formData.get("mode"));
  const niches = parseNiches(formData);
  const maxOffers = parseMaxOffers(formData.get("maxOffers"));
  const format = parseFormat(formData.get("format"));
  const active = formData.get("active") === "on";

  await db
    .update(offerBoxes)
    .set({
      ...(name ? { name } : {}),
      mode,
      niches,
      maxOffers,
      format,
      active,
      updatedAt: new Date(),
    })
    .where(eq(offerBoxes.id, id));

  revalidatePath("/admin/offer-box");
  revalidatePath(`/admin/offer-box/${id}`);
  redirect(`/admin/offer-box/${id}?ok=saved`);
}

export async function regenerateKeyAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const key = await freshKey();
  await db
    .update(offerBoxes)
    .set({ key, updatedAt: new Date() })
    .where(eq(offerBoxes.id, id));
  revalidatePath("/admin/offer-box");
  revalidatePath(`/admin/offer-box/${id}`);
  redirect(`/admin/offer-box/${id}?ok=key`);
}

export async function toggleActiveAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const id = String(formData.get("id") ?? "");
  const target = formData.get("active") === "1";
  if (!id) return;
  await db
    .update(offerBoxes)
    .set({ active: target, updatedAt: new Date() })
    .where(eq(offerBoxes.id, id));
  revalidatePath("/admin/offer-box");
  revalidatePath(`/admin/offer-box/${id}`);
}

export async function deleteOfferBoxAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.delete(offerBoxes).where(eq(offerBoxes.id, id));
  revalidatePath("/admin/offer-box");
  redirect("/admin/offer-box");
}
