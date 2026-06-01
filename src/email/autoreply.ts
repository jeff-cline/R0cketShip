import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { emailInbound, tenants } from "../db/schema";
import { getOutboundSettings, DEFAULT_AUTO_REPLY } from "./settings";
import { sendViaPool } from "./mailbox";

function render(html: string, vars: { booking_link: string; brand: string }): string {
  return html.replace(/\{\{\s*booking_link\s*\}\}/g, vars.booking_link).replace(/\{\{\s*brand\s*\}\}/g, vars.brand);
}

/**
 * Record an inbound email and, when enabled, auto-reply with the white-label's
 * booking link ("this inbox isn't monitored — book here"). Sent through the pool.
 */
export async function handleInbound(
  tenantId: string,
  msg: { from: string; to?: string | null; subject?: string | null; body?: string | null },
): Promise<{ stored: true; autoReplied: boolean }> {
  const [row] = await db
    .insert(emailInbound)
    .values({ tenantId, fromAddr: msg.from, toAddr: msg.to ?? null, subject: msg.subject ?? null, bodyText: msg.body ?? null })
    .returning({ id: emailInbound.id });

  const settings = await getOutboundSettings(tenantId);
  if (!settings.autoReplyEnabled || !settings.bookingUrl) return { stored: true, autoReplied: false };
  // Don't auto-reply to obvious no-reply / bounce senders.
  if (/no[-_.]?reply|mailer-daemon|postmaster/i.test(msg.from)) return { stored: true, autoReplied: false };

  const tenant = (await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1))[0];
  const brand = tenant?.moneyWord ? tenant.moneyWord.replace(/\b\w/g, (c) => c.toUpperCase()) : "the team";
  const html = render(settings.autoReplyHtml || DEFAULT_AUTO_REPLY, { booking_link: settings.bookingUrl, brand });
  const subject = msg.subject ? `Re: ${msg.subject}` : "Thanks — let's book a time";

  const res = await sendViaPool(tenantId, { to: msg.from, subject, html }, "auto_reply");
  if (res.status === "sent") {
    await db.update(emailInbound).set({ autoReplied: true, mailboxId: res.mailboxId }).where(eq(emailInbound.id, row.id));
    return { stored: true, autoReplied: true };
  }
  return { stored: true, autoReplied: false };
}
