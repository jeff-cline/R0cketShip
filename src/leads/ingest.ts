import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { persons, leads } from "../db/schema";
import { normalizeRow } from "./normalize";
import type { IngestSummary, LeadSource, NormalizedLead } from "./types";

const BATCH = 1000;

function leadValues(tenantId: string, personId: string, source: LeadSource, l: NormalizedLead) {
  return {
    tenantId, personId, shaLcHem: l.shaLcHem,
    firstName: l.firstName, lastName: l.lastName, businessEmail: l.businessEmail,
    personalPhones: l.personalPhones, mobilePhones: l.mobilePhones, emails: l.emails,
    linkedinUrl: l.linkedinUrl, address: l.address, city: l.city, state: l.state,
    zip: l.zip, zip4: l.zip4, gender: l.gender, ageRange: l.ageRange,
    incomeRange: l.incomeRange, netWorth: l.netWorth, jobTitle: l.jobTitle, department: l.department,
    companyName: l.companyName, companyDomain: l.companyDomain, companyRevenue: l.companyRevenue,
    companyEmployeeCount: l.companyEmployeeCount, companyState: l.companyState,
    companyLinkedinUrl: l.companyLinkedinUrl, businessEmailValidationStatus: l.businessEmailValidationStatus,
    contactCountry: l.contactCountry, scoreCategory: l.scoreCategory, segment: l.segment,
    lastUpdated: l.lastUpdated, extra: l.extra, source,
  };
}

async function upsertOne(tenantId: string, source: LeadSource, l: NormalizedLead, summary: IngestSummary): Promise<void> {
  const [person] = await db
    .insert(persons)
    .values({ shaLcHem: l.shaLcHem })
    .onConflictDoUpdate({ target: persons.shaLcHem, set: { updatedAt: new Date() } })
    .returning({ id: persons.id });

  const existing = (
    await db.select({ id: leads.id, lastUpdated: leads.lastUpdated }).from(leads)
      .where(and(eq(leads.tenantId, tenantId), eq(leads.personId, person.id))).limit(1)
  )[0];

  if (!existing) {
    const [row] = await db.insert(leads).values(leadValues(tenantId, person.id, source, l)).returning({ id: leads.id });
    summary.inserted++;
    summary.insertedLeadIds.push(row.id);
    return;
  }
  const incoming = l.lastUpdated?.getTime() ?? null;
  const current = existing.lastUpdated?.getTime() ?? null;
  const isNewer = incoming !== null && (current === null || incoming > current);
  if (isNewer) {
    await db.update(leads).set({ ...leadValues(tenantId, person.id, source, l), updatedAt: new Date() }).where(eq(leads.id, existing.id));
    summary.updated++;
  } else {
    summary.skipped++;
  }
}

export async function ingestRows(
  tenantId: string,
  source: LeadSource,
  rows: AsyncIterable<Record<string, string>> | Iterable<Record<string, string>>,
): Promise<IngestSummary> {
  const summary: IngestSummary = { inserted: 0, updated: 0, skipped: 0, errors: 0, insertedLeadIds: [] };
  let count = 0;
  for await (const raw of rows as AsyncIterable<Record<string, string>>) {
    const res = normalizeRow(raw);
    if (!res.ok) { summary.errors++; continue; }
    await upsertOne(tenantId, source, res.lead, summary);
    count++;
    if (count % BATCH === 0) { /* checkpoint hook for future bulk tuning */ }
  }
  return summary;
}
