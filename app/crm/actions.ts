"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/src/auth/guard";
import { updateDelivery } from "@/src/delivery/crm";

export async function updateDeliveryAction(formData: FormData) {
  const ctx = await requireAuth(["customer"]);
  const deliveryId = String(formData.get("deliveryId") ?? "");
  const status = String(formData.get("status") ?? "new") as "new" | "contacted" | "booked" | "sold" | "dead";
  const notes = String(formData.get("notes") ?? "");
  const saleRaw = String(formData.get("saleValue") ?? "").trim();
  const parsed = Number(saleRaw);
  const saleValue = saleRaw === "" || Number.isNaN(parsed) ? null : parsed;
  try {
    await updateDelivery(ctx.user.id, deliveryId, { status, notes, saleValue });
  } catch {
    // not authorized / not found — ignore
  }
  revalidatePath("/crm");
}
