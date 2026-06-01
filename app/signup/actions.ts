"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentTenant } from "@/src/tenant/context";
import { signupCustomer } from "@/src/auth/signup";
import { createSession, SESSION_COOKIE } from "@/src/auth/session";

export async function signupAction(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "Unknown site." };
  if (formData.get("tos") == null) return { error: "Please accept the terms to continue." };
  let user;
  try {
    user = await signupCustomer(tenant.id, {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      name: String(formData.get("name") ?? ""),
      businessName: String(formData.get("businessName") ?? ""),
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  const token = await createSession(user.id);
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  redirect("/leads");
}
