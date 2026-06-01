import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users, tenants, sessions } from "../db/schema";
import { resolveSession, SESSION_COOKIE } from "./session";

type Role = "god" | "manager" | "customer" | "agent" | "partner" | "sales_manager";
export type UserRow = typeof users.$inferSelect;
export type TenantRow = typeof tenants.$inferSelect;

export interface AuthContext {
  user: UserRow;
  tenant: TenantRow;
  impersonator: UserRow | null;
  sessionRow: typeof sessions.$inferSelect;
}

export function canAccess(role: Role, allowed: Role[]): boolean {
  return allowed.includes(role);
}

export async function resolveAuthContext(token: string | undefined): Promise<AuthContext | null> {
  if (!token) return null;
  const session = await resolveSession(token);
  if (!session) return null;
  const user = (await db.select().from(users).where(eq(users.id, session.userId)).limit(1))[0];
  if (!user || user.status !== "active") return null;
  const tenant = (await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1))[0];
  if (!tenant) return null;
  let impersonator: UserRow | null = null;
  if (session.impersonatorUserId) {
    impersonator = (await db.select().from(users).where(eq(users.id, session.impersonatorUserId)).limit(1))[0] ?? null;
  }
  return { user, tenant, impersonator, sessionRow: session };
}

/** Reads the session cookie and resolves the auth context. Server-only. */
export async function getAuthContext(): Promise<AuthContext | null> {
  const { cookies } = await import("next/headers");
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return resolveAuthContext(token);
}
