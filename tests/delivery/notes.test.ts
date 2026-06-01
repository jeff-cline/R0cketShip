import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, persons, leads, leadDeliveries } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { ensureWalletWithBonus } from "@/src/billing/wallet";
import { getDeliveryDetail, getLeadNotes, addLeadNote } from "@/src/delivery/notes";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };

async function seed() {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  const cust = await createUser({ role: "god", tenantId: t.id }, { tenantId: t.id, email: "c@roofers.co", role: "customer", tempPassword: "x" });
  const other = await createUser({ role: "god", tenantId: t.id }, { tenantId: t.id, email: "o@roofers.co", role: "customer", tempPassword: "x" });
  const wallet = await ensureWalletWithBonus(cust.id);
  const [p] = await db.insert(persons).values({ shaLcHem: "h1" }).returning();
  const [lead] = await db.insert(leads).values({ tenantId: t.id, personId: p.id, shaLcHem: "h1", firstName: "Glen", lastName: "Pallas", zip: "30265", segment: "residential", source: "upload" }).returning();
  const [del] = await db.insert(leadDeliveries).values({ tenantId: t.id, customerId: cust.id, walletId: wallet.id, leadId: lead.id, priceCredits: "4", tierAtDelivery: "one_week", status: "new" }).returning();
  return { t, cust, other, del };
}

describe("CRM lead notes", () => {
  let s: Awaited<ReturnType<typeof seed>>;
  beforeEach(async () => { s = await seed(); });

  it("returns full detail only to the owner", async () => {
    const detail = await getDeliveryDetail(s.cust.id, s.del.id);
    expect(detail?.lead.firstName).toBe("Glen");
    expect(await getDeliveryDetail(s.other.id, s.del.id)).toBeNull();
  });

  it("appends a timestamped note and advances disposition + sale", async () => {
    const ok = await addLeadNote(s.cust.id, s.del.id, { body: "Called, left VM", disposition: "contacted" });
    expect(ok).toBe(true);
    await addLeadNote(s.cust.id, s.del.id, { body: "Closed!", disposition: "sold", saleValue: 8000 });

    const notes = await getLeadNotes(s.del.id);
    expect(notes.length).toBe(2);
    expect(notes[0].body).toBe("Closed!"); // newest first
    expect(notes[0].disposition).toBe("sold");

    const detail = await getDeliveryDetail(s.cust.id, s.del.id);
    expect(detail?.delivery.status).toBe("sold");
    expect(detail?.delivery.saleValue).toBe("8000");
  });

  it("rejects notes from a non-owner and empty notes", async () => {
    expect(await addLeadNote(s.other.id, s.del.id, { body: "hax" })).toBe(false);
    expect(await addLeadNote(s.cust.id, s.del.id, { body: "", disposition: "" })).toBe(false);
    expect((await getLeadNotes(s.del.id)).length).toBe(0);
  });
});
