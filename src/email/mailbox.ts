import { and, eq, sql } from "drizzle-orm";
import nodemailer from "nodemailer";
import { db } from "../db/client";
import { emailMailboxes, emailOutbound } from "../db/schema";
import { decryptSecret } from "../crypto/secrets";

export type MailboxRow = typeof emailMailboxes.$inferSelect;
export type SendKind = "campaign" | "auto_reply" | "password_reset" | "manual";

function today(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

/** Remaining sends for a mailbox right now, accounting for the daily roll-over. */
export function remainingToday(m: MailboxRow): number {
  const used = m.sentDate === today() ? m.sentToday : 0;
  return Math.max(0, m.dailyCap - used);
}

/**
 * Pick the next active mailbox for a tenant that still has daily capacity and
 * SMTP credentials. Chooses the one with the most remaining headroom so sends
 * spread evenly across the pool (better deliverability).
 */
export async function pickMailbox(tenantId: string): Promise<MailboxRow | null> {
  const all = await db
    .select()
    .from(emailMailboxes)
    .where(and(eq(emailMailboxes.tenantId, tenantId), eq(emailMailboxes.status, "active")));
  const usable = all
    .filter((m) => m.smtpHost && m.smtpUser && m.smtpPassEnc && remainingToday(m) > 0)
    .sort((a, b) => remainingToday(b) - remainingToday(a));
  return usable[0] ?? null;
}

/** Total daily capacity / remaining across a tenant's active pool (for the dashboard). */
export async function poolCapacity(tenantId: string): Promise<{ cap: number; remaining: number; mailboxes: number }> {
  const all = await db
    .select()
    .from(emailMailboxes)
    .where(and(eq(emailMailboxes.tenantId, tenantId), eq(emailMailboxes.status, "active")));
  return {
    mailboxes: all.length,
    cap: all.reduce((s, m) => s + m.dailyCap, 0),
    remaining: all.reduce((s, m) => s + remainingToday(m), 0),
  };
}

async function bumpCount(m: MailboxRow): Promise<void> {
  const isToday = m.sentDate === today();
  await db
    .update(emailMailboxes)
    .set({ sentDate: today(), sentToday: isToday ? sql`${emailMailboxes.sentToday} + 1` : 1 })
    .where(eq(emailMailboxes.id, m.id));
}

/**
 * Send one email through the tenant's mailbox pool, respecting per-mailbox daily
 * caps. Logs every attempt to `email_outbound`. Returns the outcome + mailbox used.
 */
export async function sendViaPool(
  tenantId: string,
  msg: { to: string; subject: string; html: string },
  kind: SendKind = "manual",
): Promise<{ status: "sent" | "failed" | "skipped"; mailboxId: string | null; reason?: string }> {
  const mailbox = await pickMailbox(tenantId);
  if (!mailbox) {
    await db.insert(emailOutbound).values({ tenantId, mailboxId: null, toAddr: msg.to, subject: msg.subject, kind, status: "skipped", error: "no mailbox with capacity" });
    return { status: "skipped", mailboxId: null, reason: "no mailbox with capacity" };
  }

  const pass = decryptSecret(mailbox.smtpPassEnc) ?? "";
  const port = Number(mailbox.smtpPort ?? 587);
  try {
    const transport = nodemailer.createTransport({
      host: mailbox.smtpHost!,
      port,
      secure: port === 465,
      auth: mailbox.smtpUser ? { user: mailbox.smtpUser, pass } : undefined,
    });
    const from = mailbox.displayName ? `"${mailbox.displayName}" <${mailbox.address}>` : mailbox.address;
    await transport.sendMail({ from, to: msg.to, subject: msg.subject, html: msg.html });
    await bumpCount(mailbox);
    await db.insert(emailOutbound).values({ tenantId, mailboxId: mailbox.id, toAddr: msg.to, subject: msg.subject, kind, status: "sent" });
    return { status: "sent", mailboxId: mailbox.id };
  } catch (e) {
    await db.insert(emailOutbound).values({ tenantId, mailboxId: mailbox.id, toAddr: msg.to, subject: msg.subject, kind, status: "failed", error: String((e as Error)?.message ?? e).slice(0, 300) });
    return { status: "failed", mailboxId: mailbox.id };
  }
}
