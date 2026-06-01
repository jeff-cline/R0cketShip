"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/src/auth/guard";
import { getPlatformSettings } from "@/src/referral/core";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";

/**
 * Save the white-label owner's partner-program settings. updateTenantConfig() does not
 * accept partnerProgramEnabled / showBecomeAPartner / partnerRate, so we write those
 * columns directly. The rate is clamped to [0, platform cap].
 */
export async function savePartnerSettingsAction(formData: FormData): Promise<void> {
  const ctx = await requireAuth(["god", "manager"]);
  const ps = await getPlatformSettings();
  const cap = Number(ps.partnerRateCap);
  const percent = Number(formData.get("partnerRate"));
  const rate = Math.min(cap, Math.max(0, (Number.isFinite(percent) ? percent : 0) / 100));

  await db
    .update(tenants)
    .set({
      partnerProgramEnabled: formData.get("partnerProgramEnabled") === "on",
      showBecomeAPartner: formData.get("showBecomeAPartner") === "on",
      partnerRate: String(rate),
    })
    .where(eq(tenants.id, ctx.user.tenantId));

  revalidatePath("/admin/partner-program");
}
