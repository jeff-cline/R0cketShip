"use server";
import { redirect } from "next/navigation";
import { completePasswordReset } from "@/src/email/reset";

export async function doResetAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) redirect("/reset?err=1");
  if (password.length < 8 || password !== confirm) {
    redirect(`/reset?token=${encodeURIComponent(token)}&err=1`);
  }

  const ok = await completePasswordReset(token, password);
  if (ok) redirect("/login?reset=1");
  redirect(`/reset?token=${encodeURIComponent(token)}&err=expired`);
}
