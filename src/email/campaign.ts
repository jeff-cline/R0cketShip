import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { customerIntegrations, leadDeliveries, leads, emailSends, users } from "../db/schema";
import { resolveSmtp, sendEmail } from "./smtp";

export function trackedBookingLink(baseUrl: string, deliveryId: string): string {
  return `${baseUrl.replace(/\/$/, "")}/api/book/${deliveryId}`;
}

export function renderOfferEmail(template: { subject: string; body: string }, vars: { firstName: string | null; bookingLink: string }) {
  const sub = (s: string) => s.replace(/\{\{name\}\}/g, vars.firstName ?? "there").replace(/\{\{booking_link\}\}/g, vars.bookingLink);
  return { subject: sub(template.subject), html: sub(template.body) };
}

export async function getEmailSettings(customerId: string) {
  const row = (await db.select().from(customerIntegrations).where(eq(customerIntegrations.customerId, customerId)).limit(1))[0];
  return { bookingUrl: row?.bookingUrl ?? null, emailSubject: row?.emailSubject ?? null, emailBodyHtml: row?.emailBodyHtml ?? null };
}

export async function setEmailSettings(customerId: string, tenantId: string, input: { bookingUrl: string | null; emailSubject: string | null; emailBodyHtml: string | null }) {
  await db.insert(customerIntegrations)
    .values({ customerId, tenantId, bookingUrl: input.bookingUrl, emailSubject: input.emailSubject, emailBodyHtml: input.emailBodyHtml })
    .onConflictDoUpdate({ target: customerIntegrations.customerId, set: { bookingUrl: input.bookingUrl, emailSubject: input.emailSubject, emailBodyHtml: input.emailBodyHtml } });
}

const DEFAULT_BODY = '<p>Hi {{name}}, we have an offer for you. <a href="{{booking_link}}">Book a time</a>.</p>';

export async function sendOfferEmails(customerId: string, deliveryIds: string[], baseUrl: string) {
  const user = (await db.select().from(users).where(eq(users.id, customerId)).limit(1))[0];
  if (!user) throw new Error("user not found");
  const settings = await getEmailSettings(customerId);
  const cfg = await resolveSmtp(user.tenantId);
  const template = { subject: settings.emailSubject ?? "An offer for you", body: settings.emailBodyHtml ?? DEFAULT_BODY };
  let sent = 0, skipped = 0, failed = 0;
  for (const deliveryId of deliveryIds) {
    const row = (await db.select({ d: leadDeliveries, lead: leads })
      .from(leadDeliveries).innerJoin(leads, eq(leadDeliveries.leadId, leads.id))
      .where(and(eq(leadDeliveries.id, deliveryId), eq(leadDeliveries.customerId, customerId))).limit(1))[0];
    if (!row) { skipped++; continue; }
    const email = (row.lead.emails ?? [])[0];
    if (!email) { skipped++; await db.insert(emailSends).values({ tenantId: user.tenantId, customerId, deliveryId, leadEmail: null, status: "skipped" }); continue; }
    const { subject, html } = renderOfferEmail(template, { firstName: row.lead.firstName, bookingLink: trackedBookingLink(baseUrl, deliveryId) });
    const status = await sendEmail(cfg, { to: email, subject, html });
    if (status === "sent") sent++; else if (status === "failed") failed++; else skipped++;
    await db.insert(emailSends).values({ tenantId: user.tenantId, customerId, deliveryId, leadEmail: email, status });
  }
  return { sent, skipped, failed };
}
