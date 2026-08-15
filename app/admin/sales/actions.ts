"use server";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/src/db/client";
import { users } from "@/src/db/schema";
import { requireAuth } from "@/src/auth/guard";
import { createUser } from "@/src/auth/users";
import { hashPassword } from "@/src/auth/password";
import { getOrCreateRepCode, setPlatformSettings } from "@/src/referral/core";
import { runPayoutBatch, markBatchPaid } from "@/src/referral/payouts";
import { disburseBatch } from "@/src/referral/disburse";

type Role = "partner" | "sales_manager" | "bd_partner";

/** Parse a percent string into a rate string (×/100). Returns undefined on NaN/blank. */
function pctToRate(v: FormDataEntryValue | null): string | undefined {
  const raw = String(v ?? "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  return String(n / 100);
}

/**
 * Create a user with the given role in the actor's tenant. canCreateUser only lets
 * god/manager create a narrow set of roles, so for the new partner/sales_manager
 * roles we fall back to a direct insert (god is the actor in practice).
 */
async function createUserWithFallback(
  actor: { role: string; tenantId: string },
  email: string,
  role: Role,
  tempPassword: string,
): Promise<{ id: string }> {
  const lower = email.toLowerCase();
  try {
    const u = await createUser(
      { role: actor.role as never, tenantId: actor.tenantId },
      { tenantId: actor.tenantId, email: lower, role, tempPassword },
    );
    return u;
  } catch {
    // Direct insert fallback (canCreateUser rejected the new role).
    const existing = (
      await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.tenantId, actor.tenantId), eq(users.email, lower)))
        .limit(1)
    )[0];
    if (existing) return existing;
    const passwordHash = await hashPassword(tempPassword);
    const [row] = await db
      .insert(users)
      .values({
        tenantId: actor.tenantId,
        email: lower,
        passwordHash,
        role,
        mustResetPassword: false,
      })
      .returning({ id: users.id });
    return row;
  }
}

/** GOD only: save platform commission rates (entered as percents). */
export async function saveRatesAction(formData: FormData) {
  const ctx = await requireAuth(["god", "sales_manager"]);
  if (ctx.user.role !== "god") return;
  await setPlatformSettings({
    salesRepRate: pctToRate(formData.get("salesRepRate")),
    defaultPartnerRate: pctToRate(formData.get("defaultPartnerRate")),
    partnerRateCap: pctToRate(formData.get("partnerRateCap")),
    whitelabelLandedRate: pctToRate(formData.get("whitelabelLandedRate")),
  });
  revalidatePath("/admin/sales");
}

/** Create a sales rep: role "partner" + a platform-scope rep code. */
export async function addRepAction(formData: FormData) {
  const ctx = await requireAuth(["god", "sales_manager"]);
  const email = String(formData.get("email") ?? "").trim();
  const tempPassword = String(formData.get("tempPassword") ?? "").trim();
  if (!email || !tempPassword) return;
  const u = await createUserWithFallback(
    { role: ctx.user.role, tenantId: ctx.user.tenantId },
    email,
    "partner",
    tempPassword,
  );
  await getOrCreateRepCode(u.id);
  revalidatePath("/admin/sales");
}

/** GOD only: create a sales manager in god's tenant. */
export async function addSalesManagerAction(formData: FormData) {
  const ctx = await requireAuth(["god", "sales_manager"]);
  if (ctx.user.role !== "god") return;
  const email = String(formData.get("email") ?? "").trim();
  const tempPassword = String(formData.get("tempPassword") ?? "").trim();
  if (!email || !tempPassword) return;
  await createUserWithFallback(
    { role: ctx.user.role, tenantId: ctx.user.tenantId },
    email,
    "sales_manager",
    tempPassword,
  );
  revalidatePath("/admin/sales");
}

/** Queue a payout run for a month + scope. */
export async function runPayoutAction(formData: FormData) {
  const ctx = await requireAuth(["god", "sales_manager"]);
  const month = String(formData.get("month") ?? "").trim();
  if (!month) return;
  const rawScope = String(formData.get("scope") ?? "all");
  const scope = rawScope === "platform" || rawScope === "tenant" ? rawScope : null;
  await runPayoutBatch(month, scope, ctx.user.id);
  revalidatePath("/admin/sales");
}

/** Mark a queued payout batch as paid/sent. */
export async function markPaidAction(formData: FormData) {
  await requireAuth(["god", "sales_manager"]);
  const batchId = String(formData.get("batchId") ?? "").trim();
  if (!batchId) return;
  await markBatchPaid(batchId);
  revalidatePath("/admin/sales");
}

/** Disburse a queued payout batch via each partner's chosen rail (PayPal/Stripe). */
export async function disburseAction(formData: FormData) {
  await requireAuth(["god", "sales_manager"]);
  const batchId = String(formData.get("batchId") ?? "").trim();
  if (!batchId) return;
  await disburseBatch(batchId);
  revalidatePath("/admin/sales");
}
