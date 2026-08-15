import { and, eq, desc } from "drizzle-orm";
import { db } from "../db/client";
import { users, bdPartners } from "../db/schema";
import { hashPassword } from "../auth/password";
import { findUserByEmail } from "../auth/users";
import { getOrCreateRepCode } from "../referral/core";

export type BdPartner = typeof bdPartners.$inferSelect;
export type BdTrack = "clients" | "investors" | "both";

const HUB = "https://r0cketship.com";

export function slugify(first: string, last: string): string {
  const base = `${first}-${last}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  return base || "partner";
}

async function uniqueSlug(first: string, last: string): Promise<string> {
  const base = slugify(first, last);
  let slug = base;
  for (let i = 2; i < 200; i++) {
    const exists = (await db.select({ id: bdPartners.id }).from(bdPartners).where(eq(bdPartners.slug, slug)).limit(1))[0];
    if (!exists) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Create a Business Development partner: a `bd_partner` user + profile + platform sales code. */
export async function createBdPartner(input: {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  city?: string;
  state?: string;
  zip?: string;
  track: BdTrack;
  sponsorUserId?: string | null;
}): Promise<{ user: typeof users.$inferSelect; partner: BdPartner }> {
  const email = input.email.toLowerCase().trim();
  if (!email.includes("@")) throw new Error("A valid email is required.");
  if (input.password.length < 8) throw new Error("Password must be at least 8 characters.");
  const existing = await findUserByEmail(input.tenantId, email);
  if (existing) throw new Error("An account with that email already exists. Sign in instead.");

  const name = `${input.firstName} ${input.lastName}`.trim();
  const [user] = await db
    .insert(users)
    .values({ tenantId: input.tenantId, email, passwordHash: await hashPassword(input.password), role: "bd_partner", mustResetPassword: false, name })
    .returning();

  const slug = await uniqueSlug(input.firstName, input.lastName);
  const [partner] = await db
    .insert(bdPartners)
    .values({
      userId: user.id,
      slug,
      firstName: input.firstName,
      lastName: input.lastName,
      city: input.city || null,
      state: input.state || null,
      zip: input.zip || null,
      track: input.track,
      sponsorUserId: input.sponsorUserId ?? null,
    })
    .returning();

  // Auto-provision their platform sales-affiliate code so they earn from the first click.
  await getOrCreateRepCode(user.id);
  return { user, partner };
}

export async function getBdPartnerByUserId(userId: string): Promise<BdPartner | null> {
  return (await db.select().from(bdPartners).where(eq(bdPartners.userId, userId)).limit(1))[0] ?? null;
}

export async function getBdPartnerBySlug(slug: string): Promise<BdPartner | null> {
  return (await db.select().from(bdPartners).where(eq(bdPartners.slug, slug.toLowerCase())).limit(1))[0] ?? null;
}

export async function getSalesCode(userId: string): Promise<string> {
  const rc = await getOrCreateRepCode(userId);
  return rc.code;
}

export function salesAffiliateLink(code: string): string {
  return `${HUB}/signup?ref=${code}`;
}
export function opportunityAffiliateLink(slug: string): string {
  return `${HUB}/opportunity/${slug}`;
}
export function recruitLink(slug: string): string {
  return `${HUB}/radar?sponsor=${slug}`;
}

export async function listBdPartners(): Promise<BdPartner[]> {
  return db.select().from(bdPartners).orderBy(desc(bdPartners.createdAt));
}

export async function listDownline(sponsorUserId: string): Promise<BdPartner[]> {
  return db.select().from(bdPartners).where(eq(bdPartners.sponsorUserId, sponsorUserId)).orderBy(desc(bdPartners.createdAt));
}

export async function upgradeToVp(userId: string): Promise<void> {
  await db.update(bdPartners).set({ tier: "vp" }).where(eq(bdPartners.userId, userId));
}

export async function markVideoWatched(userId: string): Promise<void> {
  await db.update(bdPartners).set({ videoWatchedAt: new Date() }).where(and(eq(bdPartners.userId, userId)));
}

export async function set1099Url(userId: string, url: string): Promise<void> {
  await db.update(bdPartners).set({ form1099Url: url }).where(eq(bdPartners.userId, userId));
}
