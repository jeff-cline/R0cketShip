import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { emailMailboxes } from "../db/schema";
import { getOutboundSettings } from "./settings";

/**
 * Key-gated Zapmail adapter. Zapmail (api.zapmail.ai) provisions Google/Microsoft
 * mailboxes; we import them into our sending pool. Sending still happens over each
 * mailbox's SMTP (app password), respecting the ~50/day per-mailbox cap.
 *
 * Activates only when a tenant has a Zapmail API key saved. Endpoints follow the
 * documented base/headers; parsing is defensive so an API shape change can't break
 * the UI (returns an empty list + reason instead of throwing).
 */
const BASE = "https://api.zapmail.ai/api";

export interface ZapmailMailbox {
  zapmailId: string | null;
  address: string;
  provider: "zapmail-google" | "zapmail-microsoft";
  smtpHost: string | null;
  smtpUser: string | null;
}

export async function zapmailConfigured(tenantId: string): Promise<boolean> {
  const s = await getOutboundSettings(tenantId);
  return Boolean(s.zapmailApiKey);
}

export async function listZapmailMailboxes(
  apiKey: string,
  workspaceKey: string | null,
  serviceProvider: "GOOGLE" | "MICROSOFT" = "GOOGLE",
): Promise<{ mailboxes: ZapmailMailbox[]; error?: string }> {
  try {
    const res = await fetch(`${BASE}/v2/mailboxes`, {
      headers: {
        "x-auth-zapmail": apiKey,
        ...(workspaceKey ? { "x-workspace-key": workspaceKey } : {}),
        "x-service-provider": serviceProvider,
      },
    });
    if (!res.ok) return { mailboxes: [], error: `Zapmail API ${res.status}` };
    const data: unknown = await res.json();
    const list: unknown[] = Array.isArray(data) ? data : Array.isArray((data as { mailboxes?: unknown[] })?.mailboxes) ? (data as { mailboxes: unknown[] }).mailboxes : Array.isArray((data as { data?: unknown[] })?.data) ? (data as { data: unknown[] }).data : [];
    const mailboxes: ZapmailMailbox[] = [];
    for (const item of list) {
      const o = item as Record<string, unknown>;
      const address = String(o.email ?? o.address ?? o.username ?? o.emailAddress ?? "").trim();
      if (!address.includes("@")) continue;
      mailboxes.push({
        zapmailId: o.id ? String(o.id) : null,
        address: address.toLowerCase(),
        provider: serviceProvider === "MICROSOFT" ? "zapmail-microsoft" : "zapmail-google",
        smtpHost: o.smtpHost ? String(o.smtpHost) : serviceProvider === "MICROSOFT" ? "smtp.office365.com" : "smtp.gmail.com",
        smtpUser: address.toLowerCase(),
      });
    }
    return { mailboxes };
  } catch (e) {
    return { mailboxes: [], error: String((e as Error)?.message ?? e) };
  }
}

/**
 * Import Zapmail mailboxes into the pool for a tenant. Created mailboxes start
 * PAUSED with no SMTP password — the owner adds each mailbox's app password to
 * activate it (Zapmail's API does not expose passwords).
 */
export async function importZapmailMailboxes(tenantId: string): Promise<{ imported: number; found: number; error?: string }> {
  const s = await getOutboundSettings(tenantId);
  if (!s.zapmailApiKey) return { imported: 0, found: 0, error: "no Zapmail API key" };
  const { mailboxes, error } = await listZapmailMailboxes(s.zapmailApiKey, s.zapmailWorkspaceKey);
  if (error) return { imported: 0, found: 0, error };

  let imported = 0;
  for (const m of mailboxes) {
    const exists = (
      await db.select({ id: emailMailboxes.id }).from(emailMailboxes).where(and(eq(emailMailboxes.tenantId, tenantId), eq(emailMailboxes.address, m.address))).limit(1)
    )[0];
    if (exists) continue;
    await db.insert(emailMailboxes).values({
      tenantId,
      address: m.address,
      provider: m.provider,
      smtpHost: m.smtpHost,
      smtpPort: "587",
      smtpUser: m.smtpUser,
      zapmailId: m.zapmailId,
      status: "paused", // needs an app password before it can send
      dailyCap: 50,
    });
    imported++;
  }
  return { imported, found: mailboxes.length };
}
