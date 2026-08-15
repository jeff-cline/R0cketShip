"use server";
/**
 * Campaign server actions: create, update, pause, resume.
 *
 * - Every action re-resolves the advertiser context inside the action so we
 *   never trust a client-supplied advertiserId. The page passes the campaign id
 *   for update/pause/resume; the underlying module enforces ownership.
 * - `createCampaignAction` looks up the god `god_auto_approve_campaigns` toggle
 *   on the r0cketship.com tenant and passes it through. Default = true.
 * - We coerce dollar inputs → cents inside the action so the UI can use friendly
 *   number inputs without leaking cents math into the form code.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getAdvertiserContext } from "@/src/auth/advertiser";
import {
  createCampaign,
  updateCampaign,
  pauseCampaign,
  resumeCampaign,
  type CreateCampaignInput,
} from "@/src/advertiser/campaigns";
import { parseTargeting, type TargetingFilters } from "@/src/advertiser/targeting";
import { MIN_CPA_CENTS } from "@/src/advertiser/wallet";
import { db } from "@/src/db/client";
import { tenantIntegrations, tenants } from "@/src/db/schema";

/** Read the `god_auto_approve_campaigns` toggle from the r0cketship.com tenant. */
async function readAutoApproveCampaigns(): Promise<boolean> {
  const row = (
    await db
      .select({ value: tenantIntegrations.godAutoApproveCampaigns })
      .from(tenantIntegrations)
      .innerJoin(tenants, eq(tenants.id, tenantIntegrations.tenantId))
      .where(eq(tenants.domain, "r0cketship.com"))
      .limit(1)
  )[0];
  // Default true matches the schema default — if the platform tenant integration
  // row is absent for whatever reason, we don't want to wedge campaign creation.
  return row?.value ?? true;
}

/**
 * Pull targeting filters out of FormData. Lists arrive as comma-separated text
 * or as repeated form fields for checkboxes. We normalize everything into the
 * shape `parseTargeting` expects, then let that function defensively re-parse.
 */
function readTargetingFromForm(formData: FormData): TargetingFilters {
  // New form semantics:
  //  - zipMode ∈ {nationwide, by_state, by_zip} drives which geo field counts.
  //  - states are repeated checkbox values when zipMode === "by_state".
  //  - zip is a comma-separated text input when zipMode === "by_zip".
  //  - nicheMode ∈ {ron, specific} drives whether niches checkbox-list counts.
  //  - niches are repeated checkbox values (canonical lowercase keys) when
  //    nicheMode === "specific".
  const zipMode = String(formData.get("zipMode") ?? "nationwide");
  const nicheMode = String(formData.get("nicheMode") ?? "ron");
  const zipText = String(formData.get("zip") ?? "").trim();
  const states = formData.getAll("states").map((v) => String(v));
  const nichesList = formData.getAll("niches").map((v) => String(v));
  const segments = formData.getAll("segments").map((v) => String(v));
  const ageTiers = formData.getAll("age_tiers").map((v) => String(v));
  const incomeMinText = String(formData.get("income_min") ?? "").trim();
  const incomeMaxText = String(formData.get("income_max") ?? "").trim();

  const raw: Record<string, unknown> = {};
  if (zipMode === "by_zip" && zipText) {
    raw.zip = zipText.split(",").map((s) => s.trim()).filter(Boolean);
  } else if (zipMode === "by_state" && states.length) {
    raw.states = states;
  }
  // zipMode === "nationwide" → don't set any geo filter
  if (segments.length) raw.segments = segments;
  if (ageTiers.length) raw.age_tiers = ageTiers;
  if (nicheMode === "specific" && nichesList.length) {
    raw.niches = nichesList;
  }
  // nicheMode === "ron" → don't set niches (= run of network)
  if (incomeMinText) raw.income_min = Number(incomeMinText);
  if (incomeMaxText) raw.income_max = Number(incomeMaxText);
  return parseTargeting(raw);
}

function dollarsToCents(input: FormDataEntryValue | null): number | null {
  const s = String(input ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

/**
 * Create a new campaign. Bounces to /advertise/login if unauthenticated,
 * back to /advertise/campaigns/new?error=... on validation failure, and
 * forward to /advertise/campaigns/[id] on success.
 */
export async function createCampaignAction(formData: FormData): Promise<void> {
  const ctx = await getAdvertiserContext();
  if (!ctx) redirect("/advertise/login");

  const name = String(formData.get("name") ?? "").trim();
  const emailSubject = String(formData.get("emailSubject") ?? "").trim();
  const emailBodyHtml = String(formData.get("emailBodyHtml") ?? "");
  const ctaUrl = String(formData.get("ctaUrl") ?? "").trim();
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim() || "Learn more";
  const maxCpaCents = dollarsToCents(formData.get("maxCpaDollars"));
  const dailyBudgetCents = dollarsToCents(formData.get("dailyBudgetDollars"));

  if (!name) redirect("/advertise/campaigns/new?error=name_required");
  if (!emailSubject) redirect("/advertise/campaigns/new?error=subject_required");
  if (!ctaUrl) redirect("/advertise/campaigns/new?error=cta_url_required");
  try {
    new URL(ctaUrl);
  } catch {
    redirect("/advertise/campaigns/new?error=cta_url_invalid");
  }
  if (maxCpaCents == null || maxCpaCents < MIN_CPA_CENTS) {
    redirect("/advertise/campaigns/new?error=cpa_below_minimum");
  }

  const targetingFilters = readTargetingFromForm(formData);

  const input: CreateCampaignInput = {
    advertiserId: ctx.advertiser.id,
    name,
    emailSubject,
    emailBodyHtml,
    ctaUrl,
    ctaLabel,
    maxCpaCents,
    ...(dailyBudgetCents != null ? { dailyBudgetCents } : {}),
    targetingFilters,
  };

  const autoApprove = await readAutoApproveCampaigns();
  const { id } = await createCampaign(input, { autoApprove });
  revalidatePath("/advertise/campaigns");
  revalidatePath("/advertise/dashboard");
  redirect(`/advertise/campaigns/${id}`);
}

/**
 * Update an existing campaign. Owner-enforced inside the wallet module —
 * a mismatched advertiserId throws "campaign not found" and we surface that
 * as a 500 (intentional; cross-advertiser tampering should never happen via UI).
 */
export async function updateCampaignAction(
  campaignId: string,
  formData: FormData,
): Promise<void> {
  const ctx = await getAdvertiserContext();
  if (!ctx) redirect("/advertise/login");

  const name = String(formData.get("name") ?? "").trim();
  const emailSubject = String(formData.get("emailSubject") ?? "").trim();
  const emailBodyHtml = String(formData.get("emailBodyHtml") ?? "");
  const ctaUrl = String(formData.get("ctaUrl") ?? "").trim();
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim() || "Learn more";
  const maxCpaCents = dollarsToCents(formData.get("maxCpaDollars"));
  const dailyBudgetCents = dollarsToCents(formData.get("dailyBudgetDollars"));

  if (!name) redirect(`/advertise/campaigns/${campaignId}?error=name_required`);
  if (!emailSubject)
    redirect(`/advertise/campaigns/${campaignId}?error=subject_required`);
  if (!ctaUrl)
    redirect(`/advertise/campaigns/${campaignId}?error=cta_url_required`);
  try {
    new URL(ctaUrl);
  } catch {
    redirect(`/advertise/campaigns/${campaignId}?error=cta_url_invalid`);
  }
  if (maxCpaCents == null || maxCpaCents < MIN_CPA_CENTS) {
    redirect(`/advertise/campaigns/${campaignId}?error=cpa_below_minimum`);
  }

  const targetingFilters = readTargetingFromForm(formData);

  await updateCampaign(ctx.advertiser.id, campaignId, {
    name,
    emailSubject,
    emailBodyHtml,
    ctaUrl,
    ctaLabel,
    maxCpaCents,
    dailyBudgetCents: dailyBudgetCents ?? undefined,
    targetingFilters,
  });
  revalidatePath(`/advertise/campaigns/${campaignId}`);
  revalidatePath("/advertise/campaigns");
  redirect(`/advertise/campaigns/${campaignId}?saved=1`);
}

export async function pauseCampaignAction(campaignId: string): Promise<void> {
  const ctx = await getAdvertiserContext();
  if (!ctx) redirect("/advertise/login");
  await pauseCampaign(ctx.advertiser.id, campaignId);
  revalidatePath(`/advertise/campaigns/${campaignId}`);
  revalidatePath("/advertise/campaigns");
}

export async function resumeCampaignAction(campaignId: string): Promise<void> {
  const ctx = await getAdvertiserContext();
  if (!ctx) redirect("/advertise/login");
  await resumeCampaign(ctx.advertiser.id, campaignId);
  revalidatePath(`/advertise/campaigns/${campaignId}`);
  revalidatePath("/advertise/campaigns");
}

/**
 * Send a test preview of the campaign creative to the advertiser's signup
 * email, optionally CCing the founder for QA visibility (god toggle).
 * Tracking is disabled on the test send so clicks don't charge the wallet.
 */
export async function sendCampaignTestEmailAction(campaignId: string): Promise<void> {
  const ctx = await getAdvertiserContext();
  if (!ctx) redirect("/advertise/login");
  const { sendCampaignTestEmail } = await import("@/src/advertiser/test_send");
  const result = await sendCampaignTestEmail({
    campaignId,
    advertiserId: ctx.advertiser.id,
  });
  if (result.status === "sent") {
    redirect(`/advertise/campaigns/${campaignId}?test=sent`);
  } else if (result.status === "skipped") {
    redirect(`/advertise/campaigns/${campaignId}?test=skipped&reason=${encodeURIComponent(result.reason ?? "")}`);
  } else {
    redirect(`/advertise/campaigns/${campaignId}?test=failed&reason=${encodeURIComponent(result.reason ?? "")}`);
  }
}
