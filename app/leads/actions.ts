"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/src/auth/guard";
import { pickAvailableLeads } from "@/src/delivery/search";
import { purchaseLeads } from "@/src/delivery/purchase";
import { getIntegration, deliverLeadToWebhook } from "@/src/delivery/webhook";
import { myDeliveries } from "@/src/delivery/crm";
import type { LeadFilters } from "@/src/delivery/types";

function filtersFrom(formData: FormData): LeadFilters {
  const zip = String(formData.get("zip") ?? "").trim();
  const segment = String(formData.get("segment") ?? "");
  const tier = String(formData.get("tier") ?? "");
  const score = String(formData.get("score") ?? "");
  return {
    zips: zip ? zip.split(",").map((z) => z.trim()).filter(Boolean) : undefined,
    segment: segment === "residential" || segment === "commercial" ? segment : undefined,
    tier: (tier || undefined) as LeadFilters["tier"],
    score: score || undefined,
  };
}

export async function buyAction(_prev: unknown, formData: FormData): Promise<{ error?: string; ok?: string }> {
  const ctx = await requireAuth(["customer"]);
  const qty = Math.max(1, Math.min(100, Number(formData.get("qty") ?? 1)));
  const filters = filtersFrom(formData);
  const ids = await pickAvailableLeads(ctx.user.id, ctx.user.tenantId, filters, qty);
  if (ids.length === 0) return { error: "No matching leads available." };
  try {
    const res = await purchaseLeads(ctx.user.id, ids);
    const integ = await getIntegration(ctx.user.id);
    if (integ) {
      const delivered = await myDeliveries(ctx.user.id);
      const boughtIds = new Set(res.delivered.map((d) => d.leadId));
      for (const row of delivered.filter((r) => boughtIds.has(r.leadId))) {
        await deliverLeadToWebhook(integ, row);
      }
    }
    revalidatePath("/leads");
    revalidatePath("/crm");
    return { ok: `Bought ${res.delivered.length} lead(s) for ${res.totalCharged} credits.` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
