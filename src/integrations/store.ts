import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { tenantIntegrations } from "../db/schema";
import { encryptSecret, decryptSecret } from "../crypto/secrets";

type Provider = "manual" | "stripe" | "paypal";

export interface IntegrationsView {
  stripeSecret: string | null;
  stripePublishable: string | null;
  stripeWebhookSecret: string | null;
  paypalClientId: string | null;
  paypalSecret: string | null;
  twilioAccountSid: string | null;
  twilioAuthToken: string | null;
  twilioFromNumber: string | null;
  hotTransferNumber: string | null;
  smtpHost: string | null;
  smtpPort: string | null;
  smtpUser: string | null;
  smtpPass: string | null;
  smtpFrom: string | null;
  activePaymentProvider: Provider;
}

export interface IntegrationsPatch {
  stripeSecret?: string | null;
  stripePublishable?: string | null;
  stripeWebhookSecret?: string | null;
  paypalClientId?: string | null;
  paypalSecret?: string | null;
  twilioAccountSid?: string | null;
  twilioAuthToken?: string | null;
  twilioFromNumber?: string | null;
  hotTransferNumber?: string | null;
  smtpHost?: string | null;
  smtpPort?: string | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
  smtpFrom?: string | null;
  activePaymentProvider?: Provider;
}

export async function getIntegrations(tenantId: string): Promise<IntegrationsView> {
  const row = (await db.select().from(tenantIntegrations).where(eq(tenantIntegrations.tenantId, tenantId)).limit(1))[0];
  if (!row) {
    return { stripeSecret: null, stripePublishable: null, stripeWebhookSecret: null, paypalClientId: null, paypalSecret: null, twilioAccountSid: null, twilioAuthToken: null, twilioFromNumber: null, hotTransferNumber: null, smtpHost: null, smtpPort: null, smtpUser: null, smtpPass: null, smtpFrom: null, activePaymentProvider: "manual" };
  }
  return {
    stripeSecret: decryptSecret(row.stripeSecretEnc),
    stripePublishable: row.stripePublishable,
    stripeWebhookSecret: decryptSecret(row.stripeWebhookSecretEnc),
    paypalClientId: row.paypalClientId,
    paypalSecret: decryptSecret(row.paypalSecretEnc),
    twilioAccountSid: row.twilioAccountSid,
    twilioAuthToken: decryptSecret(row.twilioAuthTokenEnc),
    twilioFromNumber: row.twilioFromNumber,
    hotTransferNumber: row.hotTransferNumber,
    smtpHost: row.smtpHost,
    smtpPort: row.smtpPort,
    smtpUser: row.smtpUser,
    smtpPass: decryptSecret(row.smtpPassEnc),
    smtpFrom: row.smtpFrom,
    activePaymentProvider: row.activePaymentProvider,
  };
}

/** Upsert. Secret fields: undefined = keep existing; string/null = set/clear (encrypted). */
export async function setIntegrations(tenantId: string, patch: IntegrationsPatch): Promise<void> {
  const existing = (await db.select().from(tenantIntegrations).where(eq(tenantIntegrations.tenantId, tenantId)).limit(1))[0];
  const values = {
    tenantId,
    stripeSecretEnc: patch.stripeSecret !== undefined ? encryptSecret(patch.stripeSecret) : existing?.stripeSecretEnc ?? null,
    stripePublishable: patch.stripePublishable !== undefined ? (patch.stripePublishable || null) : existing?.stripePublishable ?? null,
    stripeWebhookSecretEnc: patch.stripeWebhookSecret !== undefined ? encryptSecret(patch.stripeWebhookSecret) : existing?.stripeWebhookSecretEnc ?? null,
    paypalClientId: patch.paypalClientId !== undefined ? (patch.paypalClientId || null) : existing?.paypalClientId ?? null,
    paypalSecretEnc: patch.paypalSecret !== undefined ? encryptSecret(patch.paypalSecret) : existing?.paypalSecretEnc ?? null,
    twilioAccountSid: patch.twilioAccountSid !== undefined ? (patch.twilioAccountSid || null) : existing?.twilioAccountSid ?? null,
    twilioAuthTokenEnc: patch.twilioAuthToken !== undefined ? encryptSecret(patch.twilioAuthToken) : existing?.twilioAuthTokenEnc ?? null,
    twilioFromNumber: patch.twilioFromNumber !== undefined ? (patch.twilioFromNumber || null) : existing?.twilioFromNumber ?? null,
    hotTransferNumber: patch.hotTransferNumber !== undefined ? (patch.hotTransferNumber || null) : existing?.hotTransferNumber ?? null,
    smtpHost: patch.smtpHost !== undefined ? (patch.smtpHost || null) : existing?.smtpHost ?? null,
    smtpPort: patch.smtpPort !== undefined ? (patch.smtpPort || null) : existing?.smtpPort ?? null,
    smtpUser: patch.smtpUser !== undefined ? (patch.smtpUser || null) : existing?.smtpUser ?? null,
    smtpPassEnc: patch.smtpPass !== undefined ? encryptSecret(patch.smtpPass) : existing?.smtpPassEnc ?? null,
    smtpFrom: patch.smtpFrom !== undefined ? (patch.smtpFrom || null) : existing?.smtpFrom ?? null,
    activePaymentProvider: patch.activePaymentProvider ?? existing?.activePaymentProvider ?? "manual",
    updatedAt: new Date(),
  };
  await db.insert(tenantIntegrations).values(values).onConflictDoUpdate({ target: tenantIntegrations.tenantId, set: values });
}
