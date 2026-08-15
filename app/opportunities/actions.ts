"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/src/auth/guard";
import {
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  reorderOpportunities,
  addNote,
} from "@/src/opportunities/store";

// Every action is god-only. The board is jointly managed by Jeff + Krystalore.
async function godEmail() {
  const ctx = await requireAuth(["god"]);
  return { email: ctx.user.email, id: ctx.user.id };
}

export async function createOpportunityAction(fd: FormData) {
  const { email } = await godEmail();
  const title = String(fd.get("title") ?? "").trim();
  if (!title) return;
  await createOpportunity(email, {
    title,
    businessName: str(fd.get("businessName")),
    address: str(fd.get("address")),
    keyPeople: str(fd.get("keyPeople")),
    entryValue: str(fd.get("entryValue")),
    monthlyValue: str(fd.get("monthlyValue")),
  });
  revalidatePath("/opportunities");
}

export async function updateOpportunityAction(fd: FormData) {
  const { email } = await godEmail();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  // Only touch fields the submitted form actually carries. The inline status
  // dropdown posts just {id,status}; the full edit form posts every field. An
  // absent field → undefined (leave as-is); a present-but-empty field → null (clear).
  await updateOpportunity(email, id, {
    title: fd.has("title") ? str(fd.get("title")) ?? undefined : undefined,
    businessName: opt(fd, "businessName"),
    address: opt(fd, "address"),
    keyPeople: opt(fd, "keyPeople"),
    entryValue: opt(fd, "entryValue"),
    monthlyValue: opt(fd, "monthlyValue"),
    status: fd.has("status") ? str(fd.get("status")) ?? undefined : undefined,
  });
  revalidatePath("/opportunities");
}

export async function setStageAction(fd: FormData) {
  const { email } = await godEmail();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await updateOpportunity(email, id, { stage: Number(fd.get("stage") ?? 0) });
  revalidatePath("/opportunities");
}

export async function addNoteAction(fd: FormData) {
  const { email, id: uid } = await godEmail();
  const opportunityId = String(fd.get("opportunityId") ?? "");
  const body = String(fd.get("body") ?? "");
  if (!opportunityId || !body.trim()) return;
  await addNote(email, uid, opportunityId, body);
  revalidatePath("/opportunities");
}

export async function deleteOpportunityAction(fd: FormData) {
  await godEmail();
  const id = String(fd.get("id") ?? "");
  if (id) await deleteOpportunity(id);
  revalidatePath("/opportunities");
}

export async function reorderAction(orderedIds: string[]) {
  const { email } = await godEmail();
  if (Array.isArray(orderedIds) && orderedIds.length) {
    await reorderOpportunities(email, orderedIds.map(String));
    revalidatePath("/opportunities");
  }
}

function str(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/** undefined if the field is absent from the form; otherwise the trimmed value (null when empty). */
function opt(fd: FormData, key: string): string | null | undefined {
  return fd.has(key) ? str(fd.get(key)) : undefined;
}
