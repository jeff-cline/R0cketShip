/**
 * Phase 2: advertiser auth scope. Separate from customers/tenants/agents.
 *
 * - Own session table (`advertiser_sessions`) so the cookie can't be confused
 *   with the platform `r0cket_session` cookie.
 * - Own cookie name `adv_session`.
 * - Email verification gate: $10 signup bonus only granted at verify-click,
 *   never at signup form submission.
 */
import { cookies } from "next/headers";
import { randomBytes, createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { advertisers, advertiserSessions, advertiserLedger, advertiserPayments } from "../db/schema";
import { hashPassword, verifyPassword } from "./password";

export const ADVERTISER_COOKIE = "adv_session";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const SIGNUP_BONUS_CENTS = 1_000; // $10

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAdvertiser(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<{ advertiserId: string; emailVerifyToken: string }> {
  const passwordHash = await hashPassword(input.password);
  const emailVerifyToken = generateToken();
  const verifyExpiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
  const rows = await db
    .insert(advertisers)
    .values({
      email: input.email.toLowerCase().trim(),
      passwordHash,
      displayName: input.displayName ?? null,
      status: "pending",
      emailVerifyToken,
      emailVerifyTokenExpiresAt: verifyExpiresAt,
    })
    .returning({ id: advertisers.id });
  const advertiserId = rows[0]?.id;
  if (!advertiserId) throw new Error("createAdvertiser: insert returned no id");
  return { advertiserId, emailVerifyToken };
}

/**
 * Validates the email verify token, marks the advertiser verified, and grants
 * the $10 signup bonus exactly once (idempotent by `purpose='signup_bonus'`).
 *
 * Also flips status from `pending` to `approved` when god `auto_approve_advertisers`
 * is on. The caller (server action) is responsible for honoring the toggle —
 * this function just marks verified + grants bonus. Status transition handled
 * by the caller based on the marketplace settings.
 */
export async function verifyAdvertiserEmail(token: string): Promise<
  | { ok: true; advertiserId: string }
  | { ok: false; reason: "invalid" | "expired" | "already_verified" }
> {
  const rows = await db.select().from(advertisers).where(eq(advertisers.emailVerifyToken, token)).limit(1);
  const adv = rows[0];
  if (!adv) return { ok: false, reason: "invalid" };
  if (adv.emailVerifiedAt) return { ok: false, reason: "already_verified" };
  if (adv.emailVerifyTokenExpiresAt && adv.emailVerifyTokenExpiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  // Mark verified and grant bonus inside a logical sequence. We use the
  // payment+ledger pair (provider='manual', purpose='signup_bonus') as the
  // idempotency anchor. If a row with purpose='signup_bonus' already exists,
  // we do NOT re-grant.
  const { and } = await import("drizzle-orm");
  const existingBonus = await db
    .select({ id: advertiserPayments.id })
    .from(advertiserPayments)
    .where(and(eq(advertiserPayments.advertiserId, adv.id), eq(advertiserPayments.purpose, "signup_bonus")))
    .limit(1);
  const hasBonus = existingBonus.length > 0;
  if (!hasBonus) {
    await db.insert(advertiserPayments).values({
      advertiserId: adv.id,
      amountCents: SIGNUP_BONUS_CENTS,
      provider: "manual",
      purpose: "signup_bonus",
      confirmedAt: new Date(),
    });
    await db.insert(advertiserLedger).values({
      advertiserId: adv.id,
      deltaCents: SIGNUP_BONUS_CENTS,
      type: "signup_bonus",
      refId: "signup",
    });
  }
  await db
    .update(advertisers)
    .set({
      emailVerifiedAt: new Date(),
      emailVerifyToken: null,
      emailVerifyTokenExpiresAt: null,
      walletBalanceCents: hasBonus ? adv.walletBalanceCents : adv.walletBalanceCents + SIGNUP_BONUS_CENTS,
      updatedAt: new Date(),
    })
    .where(eq(advertisers.id, adv.id));

  return { ok: true, advertiserId: adv.id };
}

export async function loginAdvertiser(input: {
  email: string;
  password: string;
}): Promise<{ ok: true; token: string; advertiserId: string } | { ok: false; reason: "invalid" | "unverified" | "suspended" }> {
  const rows = await db
    .select()
    .from(advertisers)
    .where(eq(advertisers.email, input.email.toLowerCase().trim()))
    .limit(1);
  const adv = rows[0];
  if (!adv) return { ok: false, reason: "invalid" };
  const ok = await verifyPassword(input.password, adv.passwordHash);
  if (!ok) return { ok: false, reason: "invalid" };
  if (!adv.emailVerifiedAt) return { ok: false, reason: "unverified" };
  if (adv.status === "suspended" || adv.status === "frozen") return { ok: false, reason: "suspended" };

  const token = generateToken();
  await db.insert(advertiserSessions).values({
    advertiserId: adv.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + TTL_MS),
  });
  return { ok: true, token, advertiserId: adv.id };
}

export async function resolveAdvertiserSession(token: string) {
  const rows = await db
    .select()
    .from(advertiserSessions)
    .where(eq(advertiserSessions.tokenHash, hashToken(token)))
    .limit(1);
  const s = rows[0];
  if (!s) return null;
  if (s.expiresAt.getTime() <= Date.now()) {
    await destroyAdvertiserSession(token);
    return null;
  }
  return s;
}

export async function destroyAdvertiserSession(token: string): Promise<void> {
  await db.delete(advertiserSessions).where(eq(advertiserSessions.tokenHash, hashToken(token)));
}

export async function getAdvertiserContext(): Promise<
  | { advertiser: typeof advertisers.$inferSelect; sessionId: string }
  | null
> {
  const token = (await cookies()).get(ADVERTISER_COOKIE)?.value;
  if (!token) return null;
  const session = await resolveAdvertiserSession(token);
  if (!session) return null;
  const rows = await db
    .select()
    .from(advertisers)
    .where(eq(advertisers.id, session.advertiserId))
    .limit(1);
  const adv = rows[0];
  if (!adv) return null;
  return { advertiser: adv, sessionId: session.id };
}

export async function logoutAdvertiser(): Promise<void> {
  const token = (await cookies()).get(ADVERTISER_COOKIE)?.value;
  if (token) await destroyAdvertiserSession(token);
}
