import { findUserByEmail } from "./users";
import { verifyPassword } from "./password";
import { createSession } from "./session";

type Role = "god" | "manager" | "customer" | "agent" | "partner" | "sales_manager" | "bd_partner";

export function roleHome(role: Role): string {
  if (role === "god") return "/admin";
  if (role === "manager") return "/admin"; // owner console (tenant-scoped)
  if (role === "sales_manager") return "/admin/sales"; // sales console
  if (role === "partner") return "/partner";
  if (role === "bd_partner") return "/radar";
  if (role === "agent") return "/agent";
  return "/dashboard";
}

export type LoginResult =
  | { ok: true; token: string; mustReset: boolean; home: string }
  | { ok: false };

export async function loginUser(tenantId: string, email: string, password: string): Promise<LoginResult> {
  const user = await findUserByEmail(tenantId, email);
  if (!user || user.status !== "active") return { ok: false };
  if (!(await verifyPassword(password, user.passwordHash))) return { ok: false };
  const token = await createSession(user.id);
  return { ok: true, token, mustReset: user.mustResetPassword, home: roleHome(user.role) };
}
