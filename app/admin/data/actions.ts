"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { requireAuth } from "@/src/auth/guard";
import { generateIngestKey } from "@/src/leads/ingest-key";

export async function regenerateIngestKeyAction(formData: FormData) {
  await requireAuth(["god"]);
  const tenantId = String(formData.get("tenantId") ?? "");
  if (tenantId) {
    await db.update(tenants).set({ ingestKey: generateIngestKey() }).where(eq(tenants.id, tenantId));
  }
  revalidatePath("/admin/data");
}
