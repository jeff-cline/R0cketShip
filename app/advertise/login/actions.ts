"use server";
/**
 * Advertiser login server action.
 *
 * - Validates email/password via `loginAdvertiser` from src/auth/advertiser.ts
 * - On success: writes the `adv_session` cookie (httpOnly, secure in prod,
 *   sameSite=lax, path=/, 7d max-age) and redirects to /advertise/dashboard.
 * - On failure: redirects back to /advertise/login?error=<reason> so the UI
 *   can show a friendly message.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADVERTISER_COOKIE, loginAdvertiser } from "@/src/auth/advertiser";

const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;

export async function loginAdvertiserAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/advertise/login?error=invalid_credentials");
  }

  const result = await loginAdvertiser({ email, password });
  if (!result.ok) {
    // result.reason is one of: "invalid" | "unverified" | "suspended"
    const errorParam =
      result.reason === "invalid" ? "invalid_credentials" : result.reason;
    redirect(`/advertise/login?error=${errorParam}`);
  }

  (await cookies()).set(ADVERTISER_COOKIE, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SEVEN_DAYS_SECONDS,
  });

  redirect("/advertise/dashboard");
}
