"use server";
import { getCurrentTenant } from "@/src/tenant/context";
import { submitApplication } from "@/src/marketing/partner";

export async function applyAction(_prev: unknown, formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "Unknown site." };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };
  const s = (k: string) => String(formData.get(k) ?? "").trim() || null;
  await submitApplication(tenant.id, {
    name,
    phone: s("phone"), businessName: s("businessName"), location: s("location"),
    roofsLast12mo: s("roofsLast12mo"), seasonsInBusiness: s("seasonsInBusiness"),
    territories: s("territories"), teamW2: s("teamW2"), team1099: s("team1099"),
    canvassers: s("canvassers"), techUsed: s("techUsed"), annualRevenue: s("annualRevenue"),
    annualEbitda: s("annualEbitda"),
    approachedBefore: formData.get("approachedBefore") != null,
    agreeExit: formData.get("agreeExit") != null,
  });
  return { ok: true };
}
