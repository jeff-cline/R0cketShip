"use server";

/**
 * Phase 2 Task 16: god-only server actions for advertiser + campaign management.
 *
 * All actions:
 *   - Re-auth via `requireAuth(['god'])` (defense in depth — never trust the form).
 *   - Re-validate the affected admin paths so the UI refreshes after the mutation.
 *   - Take their inputs from FormData (Next.js 15 server-action pattern).
 *
 * Approval semantics:
 *   - Approving an advertiser flips `status` from `pending` → `approved`.
 *     If the platform's `god_auto_approve_campaigns` toggle is ON, we also
 *     cascade-approve any of that advertiser's `pending` campaigns so god
 *     doesn't have to click through a second queue.
 *   - Approving a campaign sets `status=active`, `approvedAt=now()`,
 *     `approvedByUserId=god.user.id`.
 *   - Rejecting either is a terminal state — the user must contact support
 *     to unstick. We do not delete rows; rejection preserves audit trail.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import {
  advertiserCampaigns,
  advertisers,
  tenantIntegrations,
  tenants,
} from "@/src/db/schema";
import {
  adminGrant,
  adminRefund,
  depositManual,
  grantCoupon,
  MIN_DEPOSIT_CENTS,
} from "@/src/advertiser/wallet";

function parseDollarsToCents(raw: FormDataEntryValue | null): number {
  const n = Number(String(raw ?? "").trim());
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

async function rootTenantId(): Promise<string | null> {
  const row = (
    await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.domain, "r0cketship.com"))
      .limit(1)
  )[0];
  return row?.id ?? null;
}

async function godAutoApproveCampaigns(): Promise<boolean> {
  const tId = await rootTenantId();
  if (!tId) return true; // default on
  const row = (
    await db
      .select({ v: tenantIntegrations.godAutoApproveCampaigns })
      .from(tenantIntegrations)
      .where(eq(tenantIntegrations.tenantId, tId))
      .limit(1)
  )[0];
  return row?.v ?? true;
}

// ---------------------------------------------------------------------------
// Advertiser status mutations
// ---------------------------------------------------------------------------

export async function approveAdvertiserAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const id = String(formData.get("advertiserId") ?? "");
  if (!id) return;

  await db
    .update(advertisers)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(advertisers.id, id));

  // Cascade-approve their pending campaigns if the platform toggle says so.
  if (await godAutoApproveCampaigns()) {
    const ctx = await requireAuth(["god"]);
    await db
      .update(advertiserCampaigns)
      .set({
        status: "active",
        approvedAt: new Date(),
        approvedByUserId: ctx.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(advertiserCampaigns.advertiserId, id),
          eq(advertiserCampaigns.status, "pending"),
        ),
      );
  }

  revalidatePath("/admin/advertisers");
  revalidatePath("/admin/advertisers/pending");
  revalidatePath(`/admin/advertisers/${id}`);
  revalidatePath("/admin/campaigns/pending");
}

export async function rejectAdvertiserAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const id = String(formData.get("advertiserId") ?? "");
  if (!id) return;

  // Reject = suspended in our schema (advertiser_status has no explicit "rejected").
  await db
    .update(advertisers)
    .set({ status: "suspended", updatedAt: new Date() })
    .where(eq(advertisers.id, id));

  revalidatePath("/admin/advertisers");
  revalidatePath("/admin/advertisers/pending");
  revalidatePath(`/admin/advertisers/${id}`);
}

export async function freezeAdvertiserAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const id = String(formData.get("advertiserId") ?? "");
  if (!id) return;
  await db
    .update(advertisers)
    .set({ status: "frozen", updatedAt: new Date() })
    .where(eq(advertisers.id, id));
  revalidatePath("/admin/advertisers");
  revalidatePath(`/admin/advertisers/${id}`);
}

export async function unfreezeAdvertiserAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const id = String(formData.get("advertiserId") ?? "");
  if (!id) return;
  await db
    .update(advertisers)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(advertisers.id, id));
  revalidatePath("/admin/advertisers");
  revalidatePath(`/admin/advertisers/${id}`);
}

export async function suspendAdvertiserAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const id = String(formData.get("advertiserId") ?? "");
  if (!id) return;
  await db
    .update(advertisers)
    .set({ status: "suspended", updatedAt: new Date() })
    .where(eq(advertisers.id, id));
  revalidatePath("/admin/advertisers");
  revalidatePath(`/admin/advertisers/${id}`);
}

// ---------------------------------------------------------------------------
// Wallet mutations (per-advertiser detail page)
// ---------------------------------------------------------------------------

export async function depositManualAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const id = String(formData.get("advertiserId") ?? "");
  if (!id) return;
  const amountCents = parseDollarsToCents(formData.get("amount"));
  const providerRef = String(formData.get("providerRef") ?? "").trim() || undefined;

  if (amountCents < MIN_DEPOSIT_CENTS) {
    redirect(
      `/admin/advertisers/${id}?err=` +
        encodeURIComponent(`Deposit must be at least $${(MIN_DEPOSIT_CENTS / 100).toFixed(0)}.`),
    );
  }

  await depositManual({ advertiserId: id, amountCents, providerRef });
  revalidatePath(`/admin/advertisers/${id}`);
  redirect(`/admin/advertisers/${id}?ok=deposit`);
}

export async function adminGrantAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const id = String(formData.get("advertiserId") ?? "");
  if (!id) return;
  const amountCents = parseDollarsToCents(formData.get("amount"));
  const reason = String(formData.get("reason") ?? "").trim() || "admin grant";
  if (amountCents <= 0) {
    redirect(`/admin/advertisers/${id}?err=` + encodeURIComponent("Enter a positive amount."));
  }
  await adminGrant({ advertiserId: id, amountCents, reason });
  revalidatePath(`/admin/advertisers/${id}`);
  redirect(`/admin/advertisers/${id}?ok=grant`);
}

export async function applyCouponAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const id = String(formData.get("advertiserId") ?? "");
  if (!id) return;
  const couponCode = String(formData.get("couponCode") ?? "").trim();
  if (!couponCode) {
    redirect(`/admin/advertisers/${id}?err=` + encodeURIComponent("Enter a coupon code."));
  }
  const res = await grantCoupon({ advertiserId: id, couponCode });
  if (!res.ok) {
    redirect(
      `/admin/advertisers/${id}?err=` + encodeURIComponent("Coupon: " + res.reason),
    );
  }
  revalidatePath(`/admin/advertisers/${id}`);
  redirect(`/admin/advertisers/${id}?ok=coupon`);
}

export async function adminRefundAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const id = String(formData.get("advertiserId") ?? "");
  if (!id) return;
  const amountCents = parseDollarsToCents(formData.get("amount"));
  const reason = String(formData.get("reason") ?? "").trim() || "admin refund";
  if (amountCents <= 0) {
    redirect(`/admin/advertisers/${id}?err=` + encodeURIComponent("Enter a positive amount."));
  }
  await adminRefund({ advertiserId: id, amountCents, reason });
  revalidatePath(`/admin/advertisers/${id}`);
  redirect(`/admin/advertisers/${id}?ok=refund`);
}

// ---------------------------------------------------------------------------
// Campaign approval mutations (used by both per-advertiser and pending queue)
// ---------------------------------------------------------------------------

export async function approveCampaignAction(formData: FormData): Promise<void> {
  const ctx = await requireAuth(["god"]);
  const campaignId = String(formData.get("campaignId") ?? "");
  const advertiserId = String(formData.get("advertiserId") ?? "");
  if (!campaignId) return;

  await db
    .update(advertiserCampaigns)
    .set({
      status: "active",
      approvedAt: new Date(),
      approvedByUserId: ctx.user.id,
      updatedAt: new Date(),
    })
    .where(eq(advertiserCampaigns.id, campaignId));

  revalidatePath("/admin/campaigns/pending");
  if (advertiserId) revalidatePath(`/admin/advertisers/${advertiserId}`);
}

export async function rejectCampaignAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const campaignId = String(formData.get("campaignId") ?? "");
  const advertiserId = String(formData.get("advertiserId") ?? "");
  if (!campaignId) return;

  await db
    .update(advertiserCampaigns)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(advertiserCampaigns.id, campaignId));

  revalidatePath("/admin/campaigns/pending");
  if (advertiserId) revalidatePath(`/admin/advertisers/${advertiserId}`);
}
