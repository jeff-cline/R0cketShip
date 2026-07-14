"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { leadCustomColumns } from "@/src/db/schema";
import { invalidateCustomColumnCache } from "@/src/leads/custom_columns";
import { KNOWN_COLUMNS } from "@/src/leads/normalize";

function normalizeKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
}

export async function addCustomColumnAction(formData: FormData): Promise<void> {
  const ctx = await requireAuth(["god"]);
  const rawKey = String(formData.get("key") ?? "");
  const key = normalizeKey(rawKey);
  const label = String(formData.get("label") ?? "").trim().slice(0, 200);
  const description = String(formData.get("description") ?? "").trim().slice(0, 500) || null;
  const kindRaw = String(formData.get("kind") ?? "string");
  const kind = (["string", "number", "date", "boolean"] as const).includes(kindRaw as never)
    ? (kindRaw as "string" | "number" | "date" | "boolean")
    : "string";

  if (!key || !label) {
    redirect(
      "/admin/data/columns?err=" + encodeURIComponent("Key and label are required."),
    );
  }
  if ((KNOWN_COLUMNS as readonly string[]).includes(key)) {
    redirect(
      "/admin/data/columns?err=" +
        encodeURIComponent(
          `'${key}' is already a built-in canonical column — nothing to add.`,
        ),
    );
  }

  try {
    await db
      .insert(leadCustomColumns)
      .values({ key, label, description, kind, createdBy: ctx.user.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "insert failed";
    redirect("/admin/data/columns?err=" + encodeURIComponent(msg));
  }
  invalidateCustomColumnCache();
  revalidatePath("/admin/data/columns");
  redirect("/admin/data/columns?ok=1");
}

export async function deleteCustomColumnAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.delete(leadCustomColumns).where(eq(leadCustomColumns.id, id));
  invalidateCustomColumnCache();
  revalidatePath("/admin/data/columns");
}
