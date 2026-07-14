"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { operatingDecks } from "@/src/db/schema";
import { requireAuth } from "@/src/auth/guard";

export async function deleteDeckAction(formData: FormData) {
  await requireAuth(["god"]);
  const id = String(formData.get("id") ?? "");
  if (id) await db.delete(operatingDecks).where(eq(operatingDecks.id, id));
  revalidatePath("/admin/upload-decks");
}

export async function toggleDeckAction(formData: FormData) {
  await requireAuth(["god"]);
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (id) await db.update(operatingDecks).set({ active: !active }).where(eq(operatingDecks.id, id));
  revalidatePath("/admin/upload-decks");
}
