"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";

/** God: toggle whether a white-label appears on the r0cketship.com /niches directory. */
export async function toggleNicheAction(formData: FormData) {
  await requireAuth(["god"]);
  const id = String(formData.get("id") ?? "");
  const show = String(formData.get("show") ?? "") === "true";
  if (id) {
    await db.update(tenants).set({ showOnNiches: show }).where(eq(tenants.id, id));
  }
  revalidatePath("/admin/niches");
  revalidatePath("/niches");
}
