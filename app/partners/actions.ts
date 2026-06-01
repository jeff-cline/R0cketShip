"use server";
import { redirect } from "next/navigation";
import { getCurrentTenant } from "@/src/tenant/context";
import { findUserByEmail } from "@/src/auth/users";
import { hashPassword } from "@/src/auth/password";
import { db } from "@/src/db/client";
import { users } from "@/src/db/schema";
import { getOrCreatePartnerCode } from "@/src/referral/core";

/**
 * PUBLIC partner self-signup. There is no authenticated actor here, so we cannot use
 * createUser() (its canCreateUser guard rejects role "partner"). Instead we insert a
 * minimal partner user row directly: tenant-scoped, hashed password, role "partner",
 * no wallet. Email uniqueness is enforced within the tenant before insert. Then we
 * materialize their referral code so it exists the moment they sign in.
 */
export async function joinPartnerAction(formData: FormData): Promise<void> {
  const err = (msg: string): never => redirect("/partners?err=" + encodeURIComponent(msg));
  const t = await getCurrentTenant();
  if (!t || !t.partnerProgramEnabled) err("This partner program isn't open right now.");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim() || null;
  if (!email || !email.includes("@")) err("A valid email is required.");
  if (password.length < 8) err("Password must be at least 8 characters.");

  const existing = await findUserByEmail(t!.id, email);
  if (existing) err("An account with that email already exists. Sign in instead.");

  const passwordHash = await hashPassword(password);
  const [newUser] = await db
    .insert(users)
    .values({ tenantId: t!.id, email, passwordHash, role: "partner", mustResetPassword: false, name })
    .returning();

  await getOrCreatePartnerCode(newUser.id, t!.id);
  redirect("/partners?joined=1");
}
