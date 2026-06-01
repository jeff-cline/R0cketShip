import { describe, it, expect, vi, beforeEach } from "vitest";
const sendMail = vi.fn(async () => ({}));
vi.mock("nodemailer", () => ({ default: { createTransport: vi.fn(() => ({ sendMail })) } }));

import { db } from "@/src/db/client";
import { tenants, leads, persons, leadDeliveries } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { createUser } from "@/src/auth/users";
import { purchaseLeads } from "@/src/delivery/purchase";
import { setIntegrations } from "@/src/integrations/store";
import { renderOfferEmail, trackedBookingLink, sendOfferEmails } from "@/src/email/campaign";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
const now = new Date("2026-05-31T12:00:00Z");
let tA: string, c1: string;
async function addLead(sha: string, email?: string) {
  const [p] = await db.insert(persons).values({ shaLcHem: sha }).returning();
  const [l] = await db.insert(leads).values({ tenantId: tA, personId: p.id, shaLcHem: sha, firstName: "Sue", zip: "30265", segment: "residential", emails: email ? [email] : [], lastUpdated: new Date("2026-01-01"), source: "upload" }).returning();
  return l.id;
}
beforeEach(async () => {
  sendMail.mockClear();
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
  c1 = (await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c1@roofers.co", role: "customer", tempPassword: "x" })).id;
});

describe("email campaign", () => {
  it("renderOfferEmail substitutes name + booking link", () => {
    const r = renderOfferEmail({ subject: "Hi {{name}}", body: 'go {{booking_link}}' }, { firstName: "Pat", bookingLink: "L" });
    expect(r.subject).toBe("Hi Pat");
    expect(r.html).toBe("go L");
  });
  it("trackedBookingLink builds the /api/book URL", () => {
    expect(trackedBookingLink("https://x.co/", "d1")).toBe("https://x.co/api/book/d1");
  });
  it("sendOfferEmails sends to leads with email (SMTP set), skips those without, records sends", async () => {
    await setIntegrations(tA, { smtpHost: "smtp.test", smtpFrom: "leads@roofers.co", smtpPort: "587" });
    const withEmail = await addLead("h1", "lead@x.co");
    const noEmail = await addLead("h2");
    const res = await purchaseLeads(c1, [withEmail, noEmail], now);
    const ids = res.delivered.map((d) => d.deliveryId);
    const out = await sendOfferEmails(c1, ids, "https://roofers.co");
    expect(out.sent).toBe(1);
    expect(out.skipped).toBe(1);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0].to).toBe("lead@x.co");
  });
  it("sendOfferEmails skips when SMTP is not configured", async () => {
    const id = await addLead("h1", "lead@x.co");
    const res = await purchaseLeads(c1, [id], now);
    const out = await sendOfferEmails(c1, [res.delivered[0].deliveryId], "https://roofers.co");
    expect(out.sent).toBe(0);
    expect(out.skipped).toBe(1); // SMTP null -> sendEmail returns "skipped"
  });
});
