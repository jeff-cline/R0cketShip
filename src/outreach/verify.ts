import { resolveMx } from "node:dns/promises";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { emailSuppression } from "../db/schema";
import type { suppressionReason } from "../db/schema";

type SuppressionReason = (typeof suppressionReason.enumValues)[number];

/** A lead carries several email fields. Pick the first usable address (lowercased). */
export function leadEmail(lead: { emails?: string[] | null; businessEmail?: string | null }): string | null {
  for (const e of lead.emails ?? []) {
    const v = (e ?? "").trim().toLowerCase();
    if (v) return v;
  }
  const b = (lead.businessEmail ?? "").trim().toLowerCase();
  return b || null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function validSyntax(email: string): boolean {
  if (!email || email.length > 254) return false;
  return EMAIL_RE.test(email);
}

const mxCache = new Map<string, boolean>();

/** Does the address's domain have MX (or fallback A) records? Cached per-process, fails closed to false. */
export async function hasMx(email: string): Promise<boolean> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  if (mxCache.has(domain)) return mxCache.get(domain)!;
  let ok = false;
  try {
    const mx = await resolveMx(domain);
    ok = Array.isArray(mx) && mx.length > 0;
  } catch {
    ok = false;
  }
  mxCache.set(domain, ok);
  return ok;
}

export async function isSuppressed(address: string): Promise<boolean> {
  const a = address.trim().toLowerCase();
  if (!a) return true;
  const row = (await db.select({ id: emailSuppression.id }).from(emailSuppression).where(eq(emailSuppression.address, a)).limit(1))[0];
  return !!row;
}

export async function suppress(address: string, reason: SuppressionReason, tenantId?: string | null): Promise<void> {
  const a = (address ?? "").trim().toLowerCase();
  if (!a) return;
  await db.insert(emailSuppression).values({ address: a, reason, tenantId: tenantId ?? null }).onConflictDoNothing({ target: emailSuppression.address });
}
