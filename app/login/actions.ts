"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentTenant } from "@/src/tenant/context";
import { loginUser } from "@/src/auth/login";
import { SESSION_COOKIE } from "@/src/auth/session";

export async function loginAction(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "Unknown site." };
  const result = await loginUser(tenant.id, email, password);
  if (!result.ok) return { error: "Invalid email or password." };
  (await cookies()).set(SESSION_COOKIE, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect(result.mustReset ? "/account/password" : result.home);
}
