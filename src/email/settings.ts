import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { tenantIntegrations } from "../db/schema";
import { encryptSecret, decryptSecret } from "../crypto/secrets";

export interface OutboundSettings {
  zapmailApiKey: string | null;
  zapmailWorkspaceKey: string | null;
  bookingUrl: string | null;
  autoReplyEnabled: boolean;
  autoReplyHtml: string | null;
}

export const DEFAULT_AUTO_REPLY = `<p>Thanks for your reply!</p>
<p>This mailbox isn't actively monitored. To get a fast answer or get started, please book a quick conversation here:</p>
<p><a href="{{booking_link}}">{{booking_link}}</a></p>
<p>— The {{brand}} team</p>`;

export async function getOutboundSettings(tenantId: string): Promise<OutboundSettings> {
  const row = (await db.select().from(tenantIntegrations).where(eq(tenantIntegrations.tenantId, tenantId)).limit(1))[0];
  return {
    zapmailApiKey: decryptSecret(row?.zapmailApiKeyEnc),
    zapmailWorkspaceKey: row?.zapmailWorkspaceKey ?? null,
    bookingUrl: row?.bookingUrl ?? null,
    autoReplyEnabled: row?.autoReplyEnabled ?? true,
    autoReplyHtml: row?.autoReplyHtml ?? null,
  };
}

export interface OutboundPatch {
  zapmailApiKey?: string | null; // undefined keeps, "" clears
  zapmailWorkspaceKey?: string | null;
  bookingUrl?: string | null;
  autoReplyEnabled?: boolean;
  autoReplyHtml?: string | null;
}

export async function setOutboundSettings(tenantId: string, patch: OutboundPatch): Promise<void> {
  const existing = (await db.select().from(tenantIntegrations).where(eq(tenantIntegrations.tenantId, tenantId)).limit(1))[0];
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.zapmailApiKey !== undefined) set.zapmailApiKeyEnc = patch.zapmailApiKey ? encryptSecret(patch.zapmailApiKey) : null;
  if (patch.zapmailWorkspaceKey !== undefined) set.zapmailWorkspaceKey = patch.zapmailWorkspaceKey || null;
  if (patch.bookingUrl !== undefined) set.bookingUrl = patch.bookingUrl || null;
  if (patch.autoReplyEnabled !== undefined) set.autoReplyEnabled = patch.autoReplyEnabled;
  if (patch.autoReplyHtml !== undefined) set.autoReplyHtml = patch.autoReplyHtml || null;
  if (existing) {
    await db.update(tenantIntegrations).set(set).where(eq(tenantIntegrations.tenantId, tenantId));
  } else {
    await db.insert(tenantIntegrations).values({ tenantId, ...(set as object) });
  }
}
