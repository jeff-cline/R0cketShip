import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { tenantIntegrations, mailboxPurchases } from "../db/schema";
import { platformTenantId } from "../email/mailbox";
import { importZapmailMailboxes } from "../email/zapmail";
import { planCapacity, type CapacityPlan } from "./capacity";

export interface AutoscaleResult {
  plan: CapacityPlan;
  action: "none" | "imported" | "recommend" | "disabled" | "capped";
  imported?: number;
  detail?: string;
}

/**
 * Keep enough mailbox capacity to clear the drip backlog by its deadline.
 * When a deficit exists and auto-buy is enabled (under the god-set cap), pull in any
 * unassigned Zapmail mailboxes already in the workspace (added capacity we've paid for).
 * Provisioning brand-new mailboxes via the purchase API is gated and logged as a recommendation.
 */
export async function ensureCapacity(): Promise<AutoscaleResult> {
  const plan = await planCapacity();
  if (plan.deficitMailboxes <= 0) return { plan, action: "none" };

  const platform = await platformTenantId();
  if (!platform) return { plan, action: "recommend", detail: "no platform tenant" };

  const settings = (await db.select().from(tenantIntegrations).where(eq(tenantIntegrations.tenantId, platform)).limit(1))[0];
  if (!settings?.outreachAutoBuy) return { plan, action: "disabled", detail: "auto-buy off; showing recommendation" };
  if (plan.mailboxes >= settings.outreachMaxMailboxes) return { plan, action: "capped", detail: `at max-mailbox cap (${settings.outreachMaxMailboxes})` };

  // Step 1 (free): import any unassigned mailboxes already provisioned in the Zapmail workspace.
  const imp = await importZapmailMailboxes(platform).catch(() => ({ imported: 0, found: 0, error: "import failed" }));
  if (imp.imported > 0) {
    await db.insert(mailboxPurchases).values({ provider: "zapmail-import", count: imp.imported, monthlyCost: "0", reason: `deficit ${plan.deficitMailboxes}; imported workspace mailboxes`, createdBy: "system" });
    return { plan, action: "imported", imported: imp.imported, detail: `imported ${imp.imported} mailbox(es)` };
  }

  // Step 2 (paid): purchasing new mailboxes via the Zapmail order API is gated — record the recommendation.
  return { plan, action: "recommend", detail: `need ${plan.deficitMailboxes} more mailbox(es); no unassigned mailboxes to import` };
}
