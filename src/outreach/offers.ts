import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { outreachOffers } from "../db/schema";

export type OutreachOffer = typeof outreachOffers.$inferSelect;

export async function getOutreachOffer(tenantId: string): Promise<OutreachOffer | null> {
  const row = (await db.select().from(outreachOffers).where(eq(outreachOffers.tenantId, tenantId)).limit(1))[0];
  return row ?? null;
}

export interface OfferInput {
  logoUrl?: string | null;
  title: string;
  description: string;
  ctaUrl: string;
  active?: boolean;
}

export async function setOutreachOffer(tenantId: string, input: OfferInput): Promise<void> {
  const values = {
    tenantId,
    logoUrl: input.logoUrl ?? null,
    title: input.title.trim(),
    description: input.description.trim(),
    ctaUrl: input.ctaUrl.trim(),
    active: input.active ?? true,
    updatedAt: new Date(),
  };
  await db
    .insert(outreachOffers)
    .values(values)
    .onConflictDoUpdate({ target: outreachOffers.tenantId, set: { ...values } });
}
