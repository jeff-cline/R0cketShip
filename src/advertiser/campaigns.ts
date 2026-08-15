/**
 * Phase 2 Task 8: Campaign CRUD for `/advertise` portal.
 *
 * - $5 CPA floor (500 cents) enforced at create + update time.
 * - Owner check on update/pause/resume so one advertiser cannot mutate another's
 *   campaigns. Cross-advertiser access returns a generic "not found" instead
 *   of leaking existence.
 * - Auto-approve toggle (god setting `god_auto_approve_campaigns`) is the
 *   caller's responsibility — pass `opts.autoApprove`. When true we mint the
 *   campaign in `active` state with a sentinel `approvedByUserId = 'auto'`-ish
 *   (UUID zero) and `approvedAt = now`; otherwise it starts `pending`.
 * - Email HTML is sanitized at write time. We don't yet have isomorphic-dompurify
 *   on the dependency list, so this module ships a defensive regex stub that
 *   strips <script>, <iframe>, on*=, and javascript:. The real DOMPurify pass
 *   is deferred to the Phase 17 hardening pass (see `sanitizeEmailHtml` below).
 */
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { advertiserCampaigns } from "../db/schema";
import { MIN_CPA_CENTS } from "./wallet";
import type { TargetingFilters } from "./targeting";
import { parseTargeting } from "./targeting";

export type AdvCampaignStatus =
  | "pending"
  | "active"
  | "paused"
  | "out_of_budget"
  | "rejected"
  | "frozen";

export interface CreateCampaignInput {
  advertiserId: string;
  name: string;
  emailSubject: string;
  emailBodyHtml: string;
  ctaUrl: string;
  ctaLabel?: string;
  maxCpaCents: number;
  dailyBudgetCents?: number;
  targetingFilters?: TargetingFilters;
}

export type CampaignRow = typeof advertiserCampaigns.$inferSelect;

/**
 * Sentinel "user id" used in `approvedByUserId` when the campaign is auto-approved
 * by the platform (no human reviewer). The column is UUID, so we use the canonical
 * "nil" UUID rather than the string "auto" — readable in audit queries, and
 * trivially filterable. Documented constant keeps intent obvious.
 */
export const AUTO_APPROVE_USER_ID = "00000000-0000-0000-0000-000000000000";

/**
 * Defensive HTML sanitizer placeholder.
 *
 * DOMPurify integration deferred to hardening pass; sanitize at render time
 * via Phase 17. For now, strip:
 *   - <script>...</script>
 *   - <iframe>...</iframe>
 *   - on*="..." / on*='...' event handler attributes
 *   - javascript: URLs (in href, src, etc.)
 */
export function sanitizeEmailHtml(html: string): string {
  if (typeof html !== "string") return "";
  let out = html;
  // Strip whole <script> blocks (case-insensitive, multiline).
  out = out.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi, "");
  // Strip whole <iframe> blocks.
  out = out.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe\s*>/gi, "");
  // Strip stray self-closing/opening tags too in case the closer is missing.
  out = out.replace(/<\/?(?:script|iframe)\b[^>]*>/gi, "");
  // Strip on*= event handler attributes (both quoted and unquoted forms).
  out = out.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "");
  out = out.replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "");
  // Strip javascript: URLs in any attribute.
  out = out.replace(/(href|src|action|formaction|xlink:href)\s*=\s*"\s*javascript:[^"]*"/gi, '$1="#"');
  out = out.replace(/(href|src|action|formaction|xlink:href)\s*=\s*'\s*javascript:[^']*'/gi, "$1='#'");
  return out;
}

function assertCpaFloor(maxCpaCents: number): void {
  if (!Number.isFinite(maxCpaCents) || maxCpaCents < MIN_CPA_CENTS) {
    throw new Error(
      `maxCpaCents must be at least ${MIN_CPA_CENTS} cents ($${(MIN_CPA_CENTS / 100).toFixed(2)})`,
    );
  }
}

/** Create a new campaign. Pending by default; active immediately when god has auto-approve on. */
export async function createCampaign(
  input: CreateCampaignInput,
  opts: { autoApprove: boolean },
): Promise<{ id: string; status: AdvCampaignStatus }> {
  assertCpaFloor(input.maxCpaCents);
  if (!input.advertiserId) throw new Error("advertiserId required");
  if (!input.name || !input.name.trim()) throw new Error("name required");
  if (!input.emailSubject || !input.emailSubject.trim()) throw new Error("emailSubject required");
  if (!input.ctaUrl || !input.ctaUrl.trim()) throw new Error("ctaUrl required");

  const sanitized = sanitizeEmailHtml(input.emailBodyHtml);
  const filters = parseTargeting(input.targetingFilters ?? {});
  const status: AdvCampaignStatus = opts.autoApprove ? "active" : "pending";
  const now = new Date();

  const [row] = await db
    .insert(advertiserCampaigns)
    .values({
      advertiserId: input.advertiserId,
      name: input.name,
      status,
      emailSubject: input.emailSubject,
      emailBodyHtml: sanitized,
      ctaUrl: input.ctaUrl,
      ctaLabel: input.ctaLabel ?? "Learn more",
      maxCpaCents: input.maxCpaCents,
      dailyBudgetCents: input.dailyBudgetCents ?? null,
      targetingFilters: filters,
      approvedAt: opts.autoApprove ? now : null,
      approvedByUserId: opts.autoApprove ? AUTO_APPROVE_USER_ID : null,
    })
    .returning({ id: advertiserCampaigns.id, status: advertiserCampaigns.status });
  return { id: row.id, status: row.status as AdvCampaignStatus };
}

/**
 * Update a campaign. Owner-enforced: if the campaign exists but belongs to a
 * different advertiser, we throw "not found" (do NOT leak existence).
 *
 * Patch fields are individually optional; only provided fields are written.
 * If `maxCpaCents` is in the patch, the $5 floor is re-enforced.
 * If `emailBodyHtml` is in the patch, it's re-sanitized.
 */
export async function updateCampaign(
  advertiserId: string,
  campaignId: string,
  patch: Partial<CreateCampaignInput>,
): Promise<void> {
  const existing = await db
    .select({ id: advertiserCampaigns.id, advertiserId: advertiserCampaigns.advertiserId })
    .from(advertiserCampaigns)
    .where(eq(advertiserCampaigns.id, campaignId))
    .limit(1);
  const c = existing[0];
  if (!c || c.advertiserId !== advertiserId) {
    throw new Error("campaign not found");
  }

  const set: Partial<typeof advertiserCampaigns.$inferInsert> = {};
  if (patch.name !== undefined) set.name = patch.name;
  if (patch.emailSubject !== undefined) set.emailSubject = patch.emailSubject;
  if (patch.emailBodyHtml !== undefined) set.emailBodyHtml = sanitizeEmailHtml(patch.emailBodyHtml);
  if (patch.ctaUrl !== undefined) set.ctaUrl = patch.ctaUrl;
  if (patch.ctaLabel !== undefined) set.ctaLabel = patch.ctaLabel;
  if (patch.maxCpaCents !== undefined) {
    assertCpaFloor(patch.maxCpaCents);
    set.maxCpaCents = patch.maxCpaCents;
  }
  if (patch.dailyBudgetCents !== undefined) set.dailyBudgetCents = patch.dailyBudgetCents;
  if (patch.targetingFilters !== undefined) set.targetingFilters = parseTargeting(patch.targetingFilters);

  if (Object.keys(set).length === 0) return;
  set.updatedAt = new Date();

  await db
    .update(advertiserCampaigns)
    .set(set)
    .where(eq(advertiserCampaigns.id, campaignId));
}

/** Pause an active/pending campaign. No-op if already paused. Owner-enforced. */
export async function pauseCampaign(advertiserId: string, campaignId: string): Promise<void> {
  await mutateStatus(advertiserId, campaignId, "paused");
}

/**
 * Resume a paused campaign back to active. Owner-enforced. We do NOT downgrade
 * other terminal states (rejected/frozen) — those require god intervention.
 */
export async function resumeCampaign(advertiserId: string, campaignId: string): Promise<void> {
  const rows = await db
    .select({
      id: advertiserCampaigns.id,
      advertiserId: advertiserCampaigns.advertiserId,
      status: advertiserCampaigns.status,
    })
    .from(advertiserCampaigns)
    .where(eq(advertiserCampaigns.id, campaignId))
    .limit(1);
  const c = rows[0];
  if (!c || c.advertiserId !== advertiserId) throw new Error("campaign not found");
  if (c.status === "rejected" || c.status === "frozen") {
    throw new Error(`cannot resume a ${c.status} campaign`);
  }
  if (c.status === "active") return;
  await db
    .update(advertiserCampaigns)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(advertiserCampaigns.id, campaignId));
}

async function mutateStatus(
  advertiserId: string,
  campaignId: string,
  status: AdvCampaignStatus,
): Promise<void> {
  const existing = await db
    .select({ id: advertiserCampaigns.id, advertiserId: advertiserCampaigns.advertiserId })
    .from(advertiserCampaigns)
    .where(eq(advertiserCampaigns.id, campaignId))
    .limit(1);
  const c = existing[0];
  if (!c || c.advertiserId !== advertiserId) throw new Error("campaign not found");
  await db
    .update(advertiserCampaigns)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(advertiserCampaigns.id, campaignId), eq(advertiserCampaigns.advertiserId, advertiserId)));
}

/** List all campaigns for an advertiser, newest first. */
export async function listCampaigns(advertiserId: string): Promise<CampaignRow[]> {
  return db
    .select()
    .from(advertiserCampaigns)
    .where(eq(advertiserCampaigns.advertiserId, advertiserId))
    .orderBy(desc(advertiserCampaigns.createdAt));
}

/** Fetch a single campaign by id, or null if none. No owner check — caller enforces if needed. */
export async function getCampaign(campaignId: string): Promise<CampaignRow | null> {
  const rows = await db
    .select()
    .from(advertiserCampaigns)
    .where(eq(advertiserCampaigns.id, campaignId))
    .limit(1);
  return rows[0] ?? null;
}
