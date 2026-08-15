"use server";

/**
 * Phase 2 Task 16: marketplace settings (god auto-approve toggles).
 *
 * Both toggles live on the r0cketship.com tenant row in `tenant_integrations`
 * (a tenant_integrations row may not exist yet on a fresh DB — we upsert).
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenantIntegrations, tenants } from "@/src/db/schema";
import { invalidateLanderCache } from "@/src/outreach/missed_ops";

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function saveMarketplaceSettingsAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);

  // Checkbox semantics: present → true, absent → false.
  const autoApproveAdvertisers = String(formData.get("autoApproveAdvertisers") ?? "") === "on";
  const autoApproveCampaigns = String(formData.get("autoApproveCampaigns") ?? "") === "on";
  // "CC the founder on every advertiser test send." Empty string = OFF.
  const ccFounderEmail = String(formData.get("ccFounderEmail") ?? "").trim();
  // Missed-clicks default lander — where unrouteable clicks land. Must be an
  // absolute http(s) URL.
  const defaultLanderRaw = String(formData.get("defaultLander") ?? "").trim();
  const defaultLander = defaultLanderRaw || "https://r0cketship.com/trending";
  if (!isValidHttpUrl(defaultLander)) {
    redirect(
      "/admin/settings/marketplace?err=" +
        encodeURIComponent(
          `Default lander must be a full URL starting with https:// (you entered "${defaultLanderRaw.slice(0, 80)}").`,
        ),
    );
  }

  const root = (
    await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.domain, "r0cketship.com"))
      .limit(1)
  )[0];

  if (!root) {
    redirect(
      "/admin/settings/marketplace?err=" +
        encodeURIComponent("Root tenant r0cketship.com not found — cannot save settings."),
    );
  }

  const existing = (
    await db
      .select({ id: tenantIntegrations.id })
      .from(tenantIntegrations)
      .where(eq(tenantIntegrations.tenantId, root.id))
      .limit(1)
  )[0];

  if (existing) {
    await db
      .update(tenantIntegrations)
      .set({
        godAutoApproveAdvertisers: autoApproveAdvertisers,
        godAutoApproveCampaigns: autoApproveCampaigns,
        marketplaceCcFounderEmail: ccFounderEmail,
        marketplaceDefaultLander: defaultLander,
        updatedAt: new Date(),
      })
      .where(eq(tenantIntegrations.id, existing.id));
  } else {
    await db.insert(tenantIntegrations).values({
      tenantId: root.id,
      godAutoApproveAdvertisers: autoApproveAdvertisers,
      godAutoApproveCampaigns: autoApproveCampaigns,
      marketplaceCcFounderEmail: ccFounderEmail,
      marketplaceDefaultLander: defaultLander,
    });
  }
  invalidateLanderCache();
  revalidatePath("/admin/settings/marketplace");
  redirect("/admin/settings/marketplace?ok=1");
}
