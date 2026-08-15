"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { users } from "@/src/db/schema";
import { coreEmail } from "@/src/core-api/client";
import { upgradeToVp } from "@/src/bd/partners";
import { voidFee, setInvestorReferralFee } from "@/src/bd/leads";

const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c));

export async function upgradeVpAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const userId = String(formData.get("userId") ?? "");
  if (userId) await upgradeToVp(userId);
  revalidatePath(`/admin/business-development/${userId}`);
}

export async function voidFeeAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const feeId = String(formData.get("feeId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (feeId) await voidFee(feeId);
  revalidatePath(`/admin/business-development/${userId}`);
}

export async function setFeeAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const amount = String(formData.get("amount") ?? "").trim();
  if (amount && !Number.isNaN(Number(amount))) await setInvestorReferralFee(amount);
  revalidatePath("/admin/business-development");
}

export async function sendPartnerEmailAction(formData: FormData): Promise<void> {
  await requireAuth(["god"]);
  const userId = String(formData.get("userId") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!userId || !subject || !body) return;
  const u = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!u) return;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111;white-space:pre-wrap">${esc(body)}</div>`;
  await coreEmail({ to: u.email, subject, html, provider: "zapmail" });
  revalidatePath(`/admin/business-development/${userId}`);
}
