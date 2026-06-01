"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/src/auth/guard";
import { resolveTwilio, placeClickToCall } from "@/src/dialer/twilio";
import { recordCall } from "@/src/dialer/queue";

type Disposition = "no_answer" | "left_message" | "callback" | "hot_transfer" | "booked" | "sold" | "dead";

export async function callAction(_prev: unknown, formData: FormData): Promise<{ status?: string }> {
  const ctx = await requireAuth(["agent"]);
  const agentNumber = String(formData.get("agentNumber") ?? "").trim();
  const leadNumber = String(formData.get("leadNumber") ?? "").trim();
  if (!agentNumber || !leadNumber) return { status: "Enter your number and the lead has a phone." };
  const cfg = await resolveTwilio(ctx.user.tenantId);
  const r = await placeClickToCall(cfg, { agentNumber, leadNumber });
  return {
    status: r.status === "placed" ? "Calling — answer your phone, we'll connect the lead." :
      r.status === "skipped" ? "Twilio not configured — add keys in admin." : "Call failed.",
  };
}

export async function dispositionAction(formData: FormData) {
  const ctx = await requireAuth(["agent"]);
  const leadId = String(formData.get("leadId") ?? "");
  if (!leadId) return;
  const disposition = String(formData.get("disposition") ?? "no_answer") as Disposition;
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  const callbackRaw = String(formData.get("callbackAt") ?? "").trim();
  const saleRaw = String(formData.get("saleValue") ?? "").trim();
  await recordCall(ctx.user.tenantId, leadId, ctx.user.id, {
    disposition,
    notes,
    callbackAt: callbackRaw ? new Date(callbackRaw) : null,
    saleValue: saleRaw && !Number.isNaN(Number(saleRaw)) ? Number(saleRaw) : null,
  });
  revalidatePath("/agent");
}
