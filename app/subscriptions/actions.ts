"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/src/auth/guard";
import { subscribeZip, cancelZip } from "@/src/billing/subscriptions";

export async function subscribeAction(_prev: unknown, formData: FormData): Promise<{ error?: string; ok?: string }> {
  const ctx = await requireAuth(["customer"]);
  const zip = String(formData.get("zip") ?? "").trim();
  const offer = String(formData.get("offer") ?? "data") as "data" | "booking" | "epartner";
  const coupon = String(formData.get("coupon") ?? "").trim() || undefined;
  if (!zip) return { error: "Enter a ZIP." };
  try {
    const { subscription } = await subscribeZip(ctx.user.id, zip, offer, coupon);
    revalidatePath("/subscriptions");
    return { ok: `Subscribed to ${zip} at ${subscription.monthlyPrice}/mo — invoice pending confirmation.` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function cancelSubAction(formData: FormData) {
  const ctx = await requireAuth(["customer"]);
  try { await cancelZip(ctx.user.id, String(formData.get("id") ?? "")); } catch {}
  revalidatePath("/subscriptions");
}
