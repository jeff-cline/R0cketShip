"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/src/auth/guard";
import { getCurrentTenant } from "@/src/tenant/context";
import { db } from "@/src/db/client";
import { tenantIntegrations } from "@/src/db/schema";
import { platformTenantId } from "@/src/email/mailbox";
import { setOutreachOffer } from "@/src/outreach/offers";

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function saveOfferAction(formData: FormData): Promise<void> {
  await requireAuth(["god", "manager"]);
  const tenant = await getCurrentTenant();
  if (!tenant) return;

  const ctaUrl = ((formData.get("ctaUrl") as string) ?? "").trim();
  // Hard reject CTA values that aren't valid absolute http(s) URLs — otherwise
  // the click handler crashes with a 500 when recipients click through. (See
  // the "JOIN THE MOVEMENT" incident: that was a label, not a URL.)
  if (ctaUrl && !isValidHttpUrl(ctaUrl)) {
    const { redirect } = await import("next/navigation");
    redirect(
      "/admin/outreach?err=" +
        encodeURIComponent(
          `CTA URL must be a full URL starting with https:// (you entered "${ctaUrl.slice(0, 80)}"). Tip: button text goes in the offer description, not the CTA URL field.`,
        ),
    );
  }

  await setOutreachOffer(tenant.id, {
    logoUrl: (formData.get("logoUrl") as string)?.trim() || null,
    title: (formData.get("title") as string) ?? "",
    description: (formData.get("description") as string) ?? "",
    ctaUrl,
    active: formData.get("active") === "on",
  });
  revalidatePath("/admin/outreach");
}

export async function saveAutoscaleAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const platform = await platformTenantId();
  if (!platform) return;
  const autoBuy = formData.get("autoBuy") === "on";
  const max = Math.max(0, Math.floor(Number(formData.get("maxMailboxes") ?? 0)) || 0);
  const existing = (await db.select({ id: tenantIntegrations.id }).from(tenantIntegrations).where(eq(tenantIntegrations.tenantId, platform)).limit(1))[0];
  const set = { outreachAutoBuy: autoBuy, outreachMaxMailboxes: max, updatedAt: new Date() };
  if (existing) await db.update(tenantIntegrations).set(set).where(eq(tenantIntegrations.tenantId, platform));
  else await db.insert(tenantIntegrations).values({ tenantId: platform, ...set });
  revalidatePath("/admin/outreach");
}
