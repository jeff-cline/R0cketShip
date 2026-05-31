"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { users } from "@/src/db/schema";
import { hashPassword } from "@/src/auth/password";
import { roleHome } from "@/src/auth/login";
import { requireUser } from "@/src/auth/guard";

export async function changePasswordAction(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  const ctx = await requireUser();
  const pw = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (pw.length < 8) return { error: "Password must be at least 8 characters." };
  if (pw !== confirm) return { error: "Passwords do not match." };
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(pw), mustResetPassword: false })
    .where(eq(users.id, ctx.user.id));
  redirect(roleHome(ctx.user.role));
}
