import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { customerIntegrations } from "../db/schema";

export type IntegrationRow = typeof customerIntegrations.$inferSelect;

export async function getIntegration(customerId: string): Promise<IntegrationRow | null> {
  return (await db.select().from(customerIntegrations).where(eq(customerIntegrations.customerId, customerId)).limit(1))[0] ?? null;
}

export async function setIntegration(
  customerId: string,
  tenantId: string,
  input: { webhookUrl: string | null; webhookSecret: string | null; active: boolean },
): Promise<IntegrationRow> {
  const [row] = await db
    .insert(customerIntegrations)
    .values({ customerId, tenantId, webhookUrl: input.webhookUrl, webhookSecret: input.webhookSecret, active: input.active })
    .onConflictDoUpdate({
      target: customerIntegrations.customerId,
      set: { webhookUrl: input.webhookUrl, webhookSecret: input.webhookSecret, active: input.active },
    })
    .returning();
  return row;
}

/** Best-effort POST of a lead payload. Never throws; records last_status. */
export async function deliverLeadToWebhook(integration: IntegrationRow, payload: unknown): Promise<string> {
  if (!integration.active || !integration.webhookUrl) return "skipped";
  let status: string;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (integration.webhookSecret) headers["x-webhook-secret"] = integration.webhookSecret;
    const res = await fetch(integration.webhookUrl, { method: "POST", headers, body: JSON.stringify(payload), signal: controller.signal });
    clearTimeout(timer);
    status = res.ok ? "ok" : `failed: ${res.status}`;
  } catch (e) {
    status = `failed: ${(e as Error).message}`;
  }
  await db.update(customerIntegrations).set({ lastStatus: status }).where(eq(customerIntegrations.id, integration.id));
  return status;
}

export async function testIntegration(customerId: string): Promise<string> {
  const integ = await getIntegration(customerId);
  if (!integ) return "no integration configured";
  return deliverLeadToWebhook(integ, { test: true, at: new Date().toISOString() });
}
