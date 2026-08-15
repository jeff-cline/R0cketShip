/**
 * Phase 2: signup guards for `/advertise/signup`.
 *
 * Guards enforced (locked in spec):
 * - 1 signup per email (lifetime)
 * - 1 signup per IP per 24h
 * - Tenant-manager email rejection (god/manager accounts cannot create
 *   advertiser accounts — they must use a separate email)
 */
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "../db/client";
import { advertisers, advertiserSignupAttempts, users } from "../db/schema";

type RateLimitResult =
  | { ok: true }
  | { ok: false; reason: "email_already_registered" }
  | { ok: false; reason: "ip_rate_limited" };

export async function checkSignupRateLimit(input: {
  email: string;
  ip: string | null;
}): Promise<RateLimitResult> {
  const email = input.email.toLowerCase().trim();

  // 1) Hard block on email reuse — one advertiser per email forever.
  const existing = await db
    .select({ id: advertisers.id })
    .from(advertisers)
    .where(eq(advertisers.email, email))
    .limit(1);
  if (existing.length > 0) {
    return { ok: false, reason: "email_already_registered" };
  }

  // 2) IP rate limit — 1 signup per IP per 24h. Counts ATTEMPTS not just
  //    completed accounts, so abuse (filling form with bad data, retrying)
  //    still gets blocked.
  if (input.ip) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const attempts = await db
      .select({ id: advertiserSignupAttempts.id })
      .from(advertiserSignupAttempts)
      .where(
        and(
          eq(advertiserSignupAttempts.ip, input.ip),
          gte(advertiserSignupAttempts.createdAt, since),
        ),
      )
      .limit(2);
    // Threshold is 2: the signup action calls `recordSignupAttempt` BEFORE
    // calling this guard, so the current attempt is already in the table.
    // We block only when there's at least one PRIOR attempt in the window.
    if (attempts.length >= 2) {
      return { ok: false, reason: "ip_rate_limited" };
    }
  }

  return { ok: true };
}

export async function recordSignupAttempt(input: {
  email: string;
  ip: string | null;
}): Promise<void> {
  await db.insert(advertiserSignupAttempts).values({
    email: input.email.toLowerCase().trim(),
    ip: input.ip,
  });
}

/**
 * Hard separation: tenant managers/gods cannot create advertiser accounts
 * with their existing platform email. They must use a different email so
 * tenant subscription dollars never mingle with advertiser dollars in the
 * optimizer or in accounting.
 */
export async function checkTenantSeparation(input: { email: string }): Promise<
  { ok: true } | { ok: false; reason: "email_belongs_to_tenant_account" }
> {
  const email = input.email.toLowerCase().trim();
  const rows = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(
      and(
        sql`lower(${users.email}) = ${email}`,
        inArray(users.role, ["god", "manager"]),
        eq(users.status, "active"),
      ),
    )
    .limit(1);
  if (rows.length > 0) {
    return { ok: false, reason: "email_belongs_to_tenant_account" };
  }
  return { ok: true };
}
