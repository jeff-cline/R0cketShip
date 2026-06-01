"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/src/auth/guard";
import { setIntegrations } from "@/src/integrations/store";

type Provider = "manual" | "stripe" | "paypal";

export async function saveIntegrationsAction(formData: FormData) {
  const ctx = await requireAuth(["god", "manager"]);
  const tenantId = ctx.user.role === "god" ? String(formData.get("tenantId") ?? "") : ctx.user.tenantId;
  if (!tenantId) return;
  if (ctx.user.role === "manager" && tenantId !== ctx.user.tenantId) return;
  // secret fields: blank => keep existing (undefined). non-secret: blank => clear (null).
  const secret = (k: string) => { const v = String(formData.get(k) ?? "").trim(); return v === "" ? undefined : v; };
  const plain = (k: string) => String(formData.get(k) ?? "").trim() || null;
  const provider = String(formData.get("activePaymentProvider") ?? "manual") as Provider;
  await setIntegrations(tenantId, {
    stripeSecret: secret("stripeSecret"),
    stripeWebhookSecret: secret("stripeWebhookSecret"),
    stripePublishable: plain("stripePublishable"),
    paypalClientId: plain("paypalClientId"),
    paypalSecret: secret("paypalSecret"),
    twilioAccountSid: plain("twilioAccountSid"),
    twilioAuthToken: secret("twilioAuthToken"),
    twilioFromNumber: plain("twilioFromNumber"),
    hotTransferNumber: plain("hotTransferNumber"),
    smtpHost: plain("smtpHost"),
    smtpPort: plain("smtpPort"),
    smtpUser: plain("smtpUser"),
    smtpPass: secret("smtpPass"),
    smtpFrom: plain("smtpFrom"),
    activePaymentProvider: provider,
  });
  revalidatePath("/admin/integrations");
}

export async function regenerateIngestKeyAction(formData: FormData) {
  const ctx = await requireAuth(["god", "manager"]);
  const tenantId = String(formData.get("tenantId") ?? "");
  const { eq } = await import("drizzle-orm");
  const { db } = await import("@/src/db/client");
  const { tenants } = await import("@/src/db/schema");
  const { generateIngestKey } = await import("@/src/leads/ingest-key");
  const t = (await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1))[0];
  if (t && (ctx.user.role === "god" || t.id === ctx.user.tenantId)) {
    await db.update(tenants).set({ ingestKey: generateIngestKey() }).where(eq(tenants.id, tenantId));
  }
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/integrations");
}
