"use server";
import { redirect } from "next/navigation";
import { getCurrentTenant } from "@/src/tenant/context";
import { requestPasswordReset } from "@/src/email/reset";

export async function requestResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const tenant = await getCurrentTenant();
  if (tenant && email) {
    const base = "https://" + (tenant.domain ?? "r0cketship.com");
    await requestPasswordReset(tenant.id, email, base);
  }
  // Always redirect the same way — never reveal whether the account exists.
  redirect("/forgot?sent=1");
}
