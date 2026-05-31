"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/src/auth/guard";
import { setIntegration, testIntegration } from "@/src/delivery/webhook";

export async function saveIntegrationAction(formData: FormData) {
  const ctx = await requireAuth(["customer"]);
  const webhookUrl = String(formData.get("webhookUrl") ?? "").trim() || null;
  const webhookSecret = String(formData.get("webhookSecret") ?? "").trim() || null;
  const active = formData.get("active") != null;
  await setIntegration(ctx.user.id, ctx.user.tenantId, { webhookUrl, webhookSecret, active });
  revalidatePath("/settings/integrations");
}

export async function testIntegrationAction() {
  const ctx = await requireAuth(["customer"]);
  await testIntegration(ctx.user.id);
  revalidatePath("/settings/integrations");
}
