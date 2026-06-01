import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { users, passwordResets } from "../db/schema";
import { generateToken, hashToken } from "../auth/session";
import { hashPassword } from "../auth/password";
import { sendViaPool } from "./mailbox";

const TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Start a password reset: mint a token, store its hash, and email the link via
 * the mailbox pool. Always resolves the same way whether or not the email exists
 * (no account enumeration). Returns the raw token only for testing.
 */
export async function requestPasswordReset(
  tenantId: string,
  email: string,
  baseUrl: string,
): Promise<{ sent: boolean; token?: string }> {
  const user = (
    await db.select().from(users).where(and(eq(users.tenantId, tenantId), eq(users.email, email.toLowerCase().trim()))).limit(1)
  )[0];
  if (!user) return { sent: false };

  const token = generateToken();
  await db.insert(passwordResets).values({
    userId: user.id,
    tenantId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + TTL_MS),
  });

  const link = `${baseUrl.replace(/\/$/, "")}/reset?token=${token}`;
  const html = `<p>We received a request to reset your password.</p>
<p><a href="${link}">Click here to set a new password</a>. This link expires in 1 hour.</p>
<p>If you didn't request this, you can ignore this email.</p>`;
  await sendViaPool(tenantId, { to: user.email, subject: "Reset your password", html }, "password_reset");
  return { sent: true, token };
}

/** Returns the userId for a valid, unused, unexpired token — else null. */
export async function verifyResetToken(token: string): Promise<{ userId: string; resetId: string } | null> {
  const row = (
    await db
      .select()
      .from(passwordResets)
      .where(and(eq(passwordResets.tokenHash, hashToken(token)), isNull(passwordResets.usedAt), gt(passwordResets.expiresAt, new Date())))
      .limit(1)
  )[0];
  return row ? { userId: row.userId, resetId: row.id } : null;
}

/** Complete a reset: set the new password and consume the token. */
export async function completePasswordReset(token: string, newPassword: string): Promise<boolean> {
  const valid = await verifyResetToken(token);
  if (!valid) return false;
  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash, mustResetPassword: false }).where(eq(users.id, valid.userId));
  await db.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.id, valid.resetId));
  return true;
}
