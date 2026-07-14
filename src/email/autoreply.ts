import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { emailInbound, tenants } from "../db/schema";
import { getOutboundSettings, DEFAULT_AUTO_REPLY } from "./settings";
import { sendViaPool } from "./mailbox";
import { suppress } from "../outreach/verify";

function render(html: string, vars: { booking_link: string; brand: string }): string {
  return html.replace(/\{\{\s*booking_link\s*\}\}/g, vars.booking_link).replace(/\{\{\s*brand\s*\}\}/g, vars.brand);
}

const BOUNCE_RE = /mailer-daemon|postmaster|delivery (status notification|has failed)|address not found|user unknown|550[ -]/i;

/** Pull the failed recipient out of a delivery-failure body, e.g. "<bob@x.com>: not found". */
function failedRecipient(body: string | null | undefined): string | null {
  if (!body) return null;
  const angle = body.match(/<([^>@\s]+@[^>@\s]+)>/);
  if (angle) return angle[1].toLowerCase();
  const bare = body.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return bare ? bare[0].toLowerCase() : null;
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

  // Bounce / delivery-failure → add the dead address to the global suppression list.
  if (BOUNCE_RE.test(msg.from) || BOUNCE_RE.test(msg.subject ?? "")) {
    const dead = failedRecipient(msg.body) ?? failedRecipient(msg.subject);
    if (dead) await suppress(dead, "bounce", tenantId).catch(() => {});
    return { stored: true, autoReplied: false };
  }

  const settings = await getOutboundSettings(tenantId);
  if (!settings.autoReplyEnabled || !settings.bookingUrl) return { stored: true, autoReplied: false };
  // Don't auto-reply to obvious no-reply senders.
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
