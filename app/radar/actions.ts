"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentTenant } from "@/src/tenant/context";
import { loginUser } from "@/src/auth/login";
import { SESSION_COOKIE, createSession } from "@/src/auth/session";
import { createBdPartner, getBdPartnerBySlug, type BdTrack } from "@/src/bd/partners";

const COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export async function radarSignupAction(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  const t = await getCurrentTenant();
  if (!t) return { error: "Unknown site." };
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const zip = String(formData.get("zip") ?? "").trim();
  const trackRaw = String(formData.get("track") ?? "both");
  const track: BdTrack = trackRaw === "clients" || trackRaw === "investors" ? trackRaw : "both";
  const sponsorSlug = String(formData.get("sponsor") ?? "").trim();

  if (!firstName || !lastName) return { error: "First and last name are required." };
  if (!email.includes("@")) return { error: "A valid email is required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  let sponsorUserId: string | null = null;
  if (sponsorSlug) {
    const sp = await getBdPartnerBySlug(sponsorSlug);
    if (sp) sponsorUserId = sp.userId;
  }

  let userId: string;
  try {
    const { user } = await createBdPartner({ tenantId: t.id, firstName, lastName, email, password, city, state, zip, track, sponsorUserId });
    userId = user.id;
  } catch (e) {
    return { error: (e as Error).message || "Could not create your account." };
  }

  const token = await createSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, COOKIE);
  redirect("/radar");
}

export async function radarLoginAction(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  const t = await getCurrentTenant();
  if (!t) return { error: "Unknown site." };
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = await loginUser(t.id, email, password);
  if (!result.ok) return { error: "Invalid email or password." };
  (await cookies()).set(SESSION_COOKIE, result.token, COOKIE);
  redirect("/radar");
}
