"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/src/auth/guard";
import { setEmailSettings } from "@/src/email/campaign";

export async function saveEmailAction(formData: FormData) {
  const ctx = await requireAuth(["customer"]);
  await setEmailSettings(ctx.user.id, ctx.user.tenantId, {
    bookingUrl: String(formData.get("bookingUrl") ?? "").trim() || null,
    emailSubject: String(formData.get("emailSubject") ?? "").trim() || null,
    emailBodyHtml: String(formData.get("emailBodyHtml") ?? "").trim() || null,
  });
  revalidatePath("/settings/email");
}
