"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { businessLeads, businessLeadNotes } from "@/src/db/schema";
import { requireAuth } from "@/src/auth/guard";

const ROLES = ["god", "manager", "sales_manager"] as const;

/** Add a timestamped, attributed note to a lead. */
export async function addNoteAction(formData: FormData) {
  const ctx = await requireAuth([...ROLES]);
  const leadId = String(formData.get("leadId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (leadId && body) {
    await db.insert(businessLeadNotes).values({ leadId, authorId: ctx.user.id, authorEmail: ctx.user.email, body });
    await db.update(businessLeads).set({ updatedAt: new Date() }).where(eq(businessLeads.id, leadId));
  }
  revalidatePath("/admin/business-leads");
}

/** Update a lead's pipeline status. */
export async function setStatusAction(formData: FormData) {
  await requireAuth([...ROLES]);
  const leadId = String(formData.get("leadId") ?? "");
  const status = String(formData.get("status") ?? "new");
  if (leadId) await db.update(businessLeads).set({ status, updatedAt: new Date() }).where(eq(businessLeads.id, leadId));
  revalidatePath("/admin/business-leads");
}

/** Assign (or unassign) a lead to another platform user — god only. */
export async function assignLeadAction(formData: FormData) {
  await requireAuth(["god"]);
  const leadId = String(formData.get("leadId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (leadId) await db.update(businessLeads).set({ assignedToUserId: userId || null, updatedAt: new Date() }).where(eq(businessLeads.id, leadId));
  revalidatePath("/admin/business-leads");
}
