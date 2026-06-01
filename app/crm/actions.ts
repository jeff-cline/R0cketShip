"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/src/auth/guard";
import { updateDelivery } from "@/src/delivery/crm";
import { addLeadNote, type DeliveryStatus } from "@/src/delivery/notes";

export async function addNoteAction(formData: FormData) {
  const ctx = await requireAuth(["customer"]);
  const deliveryId = String(formData.get("deliveryId") ?? "");
  const body = String(formData.get("body") ?? "");
  const disposition = String(formData.get("disposition") ?? "") as DeliveryStatus | "";
  const saleRaw = String(formData.get("saleValue") ?? "").trim();
  const saleValue = saleRaw === "" ? undefined : Number.isNaN(Number(saleRaw)) ? null : Number(saleRaw);
  try {
    await addLeadNote(ctx.user.id, deliveryId, { body, disposition, saleValue });
  } catch {
    // not authorized / not found — ignore
  }
  revalidatePath(`/crm/${deliveryId}`);
  revalidatePath("/crm");
}

export async function sendOfferEmailsAction() {
  const ctx = await requireAuth(["customer"]);
  const { myDeliveries } = await import("@/src/delivery/crm");
  const { sendOfferEmails } = await import("@/src/email/campaign");
  const { getCurrentTenant } = await import("@/src/tenant/context");
  const tenant = await getCurrentTenant();
  const base = tenant ? `https://${tenant.domain}` : "";
  const rows = await myDeliveries(ctx.user.id);
  await sendOfferEmails(ctx.user.id, rows.map((r) => r.deliveryId), base);
  revalidatePath("/crm");
}

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
