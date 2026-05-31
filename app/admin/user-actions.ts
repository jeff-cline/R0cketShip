"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { users } from "@/src/db/schema";
import { requireAuth } from "@/src/auth/guard";
import { createUser, resetUserPassword } from "@/src/auth/users";
import { startImpersonation } from "@/src/auth/impersonate";
import { SESSION_COOKIE } from "@/src/auth/session";

export async function createUserAction(formData: FormData) {
  const ctx = await requireAuth(["god", "manager"]);
  const role = String(formData.get("role") ?? "customer") as "manager" | "customer";
  const tenantId = ctx.user.role === "god" ? String(formData.get("tenantId") ?? "") : ctx.user.tenantId;
  await createUser(
    { role: ctx.user.role, tenantId: ctx.user.tenantId },
    { tenantId, email: String(formData.get("email") ?? ""), role, tempPassword: String(formData.get("tempPassword") ?? "") },
  );
  redirect(ctx.user.role === "god" ? "/admin" : "/manage");
}

export async function resetUserAction(formData: FormData) {
  const ctx = await requireAuth(["god", "manager"]);
  await resetUserPassword(
    { role: ctx.user.role, tenantId: ctx.user.tenantId },
    String(formData.get("userId") ?? ""),
    String(formData.get("tempPassword") ?? ""),
  );
  redirect(ctx.user.role === "god" ? "/admin" : "/manage");
}

export async function impersonateAction(formData: FormData) {
  const ctx = await requireAuth(["god", "manager"]);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");
  const target = (await db.select().from(users).where(eq(users.id, String(formData.get("userId") ?? ""))).limit(1))[0];
  if (!target) redirect(ctx.user.role === "god" ? "/admin" : "/manage");
  const impToken = await startImpersonation({ role: ctx.user.role, tenantId: ctx.user.tenantId }, target, token);
  (await cookies()).set(SESSION_COOKIE, impToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  redirect("/dashboard");
}
