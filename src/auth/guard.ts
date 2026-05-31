import { redirect } from "next/navigation";
import { getAuthContext, canAccess } from "./context";

type Role = "god" | "manager" | "customer";

/** Server guard: ensures a session, forces password reset, and gates by role. */
export async function requireAuth(allowed: Role[]) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (ctx.user.mustResetPassword) redirect("/account/password");
  if (!canAccess(ctx.user.role, allowed)) redirect("/login");
  return ctx;
}

/** Like requireAuth but allows the forced-reset page itself (no reset redirect loop). */
export async function requireUser() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  return ctx;
}
