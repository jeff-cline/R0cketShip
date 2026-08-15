import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { sessions } from "../db/schema";
import { createSession, destroySession, hashToken } from "./session";
import type { UserRow } from "./context";

type Role = "god" | "manager" | "customer" | "agent" | "partner" | "sales_manager" | "bd_partner";

export function canImpersonate(actor: { role: Role; tenantId: string }, target: UserRow): boolean {
  if (target.role === "god") return false;
  // God can "open as" any white-label user (manager/customer/agent) to manage it.
  if (actor.role === "god") return true;
  // Managers stay limited to their own-tenant customers.
  if (actor.role === "manager") return target.role === "customer" && target.tenantId === actor.tenantId;
  return false;
}

/** Creates an impersonation session for `target`, remembering the admin's current session. */
export async function startImpersonation(
  actor: { role: Role; tenantId: string },
  target: UserRow,
  adminToken: string,
): Promise<string> {
  if (!canImpersonate(actor, target)) throw new Error("Not authorized to impersonate");
  const adminSession = (
    await db.select().from(sessions).where(eq(sessions.tokenHash, hashToken(adminToken))).limit(1)
  )[0];
  if (!adminSession) throw new Error("No active admin session");
  return createSession(target.id, {
    impersonatorUserId: adminSession.userId,
    returnToSessionId: adminSession.id,
  });
}

/**
 * Ends impersonation: deletes the impersonation session and the admin's original session
 * (its raw token can't be recovered from the stored hash), then mints a fresh admin session.
 * Returns the new admin token to set as the cookie, or null if not an impersonation session.
 */
export async function exitImpersonation(impToken: string): Promise<string | null> {
  const impSession = (
    await db.select().from(sessions).where(eq(sessions.tokenHash, hashToken(impToken))).limit(1)
  )[0];
  if (!impSession || !impSession.impersonatorUserId) return null;
  const adminUserId = impSession.impersonatorUserId;
  await destroySession(impToken);
  if (impSession.returnToSessionId) {
    await db.delete(sessions).where(eq(sessions.id, impSession.returnToSessionId));
  }
  return createSession(adminUserId);
}
