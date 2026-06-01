"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { emailMailboxes } from "@/src/db/schema";
import { encryptSecret } from "@/src/crypto/secrets";
import { setOutboundSettings } from "@/src/email/settings";
import { importZapmailMailboxes } from "@/src/email/zapmail";
import { sendViaPool } from "@/src/email/mailbox";

const f = (formData: FormData, k: string) => String(formData.get(k) ?? "").trim();

export async function addMailboxAction(formData: FormData) {
  const ctx = await requireAuth(["god", "manager"]);
  const address = f(formData, "address");
  if (!address) return;
  const password = f(formData, "smtpPassword");
  await db.insert(emailMailboxes).values({
    tenantId: ctx.user.tenantId,
    address,
    displayName: f(formData, "displayName") || null,
    provider: "smtp",
    smtpHost: f(formData, "smtpHost") || null,
    smtpPort: f(formData, "smtpPort") || "587",
    smtpUser: f(formData, "smtpUser") || null,
    smtpPassEnc: password ? encryptSecret(password) : null,
    dailyCap: Number(f(formData, "dailyCap")) || 50,
    status: "active",
  });
  revalidatePath("/admin/email");
}

export async function updateMailboxAction(formData: FormData) {
  const ctx = await requireAuth(["god", "manager"]);
  const mailboxId = f(formData, "mailboxId");
  if (!mailboxId) return;
  const existing = (
    await db
      .select()
      .from(emailMailboxes)
      .where(and(eq(emailMailboxes.id, mailboxId), eq(emailMailboxes.tenantId, ctx.user.tenantId)))
      .limit(1)
  )[0];
  if (!existing) return;

  const status = f(formData, "status") === "paused" ? "paused" : "active";
  const set: Record<string, unknown> = {
    status,
    dailyCap: Number(f(formData, "dailyCap")) || existing.dailyCap,
  };
  const password = f(formData, "smtpPassword");
  if (password) set.smtpPassEnc = encryptSecret(password);

  await db
    .update(emailMailboxes)
    .set(set)
    .where(and(eq(emailMailboxes.id, mailboxId), eq(emailMailboxes.tenantId, ctx.user.tenantId)));
  revalidatePath("/admin/email");
}

export async function deleteMailboxAction(formData: FormData) {
  const ctx = await requireAuth(["god", "manager"]);
  const mailboxId = f(formData, "mailboxId");
  if (!mailboxId) return;
  await db
    .delete(emailMailboxes)
    .where(and(eq(emailMailboxes.id, mailboxId), eq(emailMailboxes.tenantId, ctx.user.tenantId)));
  revalidatePath("/admin/email");
}

export async function importZapmailAction() {
  const ctx = await requireAuth(["god", "manager"]);
  await importZapmailMailboxes(ctx.user.tenantId);
  revalidatePath("/admin/email");
}

export async function saveEmailSettingsAction(formData: FormData) {
  const ctx = await requireAuth(["god", "manager"]);
  const apiKey = f(formData, "zapmailApiKey");
  await setOutboundSettings(ctx.user.tenantId, {
    // Secret: blank => keep existing (undefined); non-empty => set.
    zapmailApiKey: apiKey === "" ? undefined : apiKey,
    zapmailWorkspaceKey: f(formData, "zapmailWorkspaceKey") || null,
    bookingUrl: f(formData, "bookingUrl") || null,
    autoReplyEnabled: formData.get("autoReplyEnabled") === "on",
    autoReplyHtml: f(formData, "autoReplyHtml") || null,
  });
  revalidatePath("/admin/email");
}

export async function sendTestEmailAction(formData: FormData) {
  const ctx = await requireAuth(["god", "manager"]);
  const to = String(formData.get("to") ?? "").trim();
  if (!to) return;
  await sendViaPool(
    ctx.user.tenantId,
    { to, subject: "Test from R0cketShip", html: "<p>This is a test email from your mailbox pool.</p>" },
    "manual",
  );
  revalidatePath("/admin/email");
}
