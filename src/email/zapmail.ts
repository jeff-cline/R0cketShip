import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { emailMailboxes } from "../db/schema";
import { encryptSecret } from "../crypto/secrets";
import { getOutboundSettings, setOutboundSettings } from "./settings";

/**
 * Zapmail adapter (api.zapmail.ai). Zapmail provisions Google/Microsoft mailboxes;
 * `/mailboxes/list` returns each mailbox WITH its app password, so we can import a
 * mailbox into a white-label's sending pool fully active (SMTP user = email,
 * pass = app password). Sending is over SMTP, ~50/day per mailbox.
 *
 * Auth: header `x-auth-zapmail: <apiKey>`, plus `x-workspace-key` and
 * `x-service-provider: GOOGLE|MICROSOFT`. The workspace key auto-resolves from
 * `/workspaces` (currentWorkspace.id).
 */
const BASE = "https://api.zapmail.ai/api/v2";

async function zmFetch(path: string, apiKey: string, workspaceKey: string | null, provider: "GOOGLE" | "MICROSOFT" = "GOOGLE"): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "x-auth-zapmail": apiKey,
      ...(workspaceKey ? { "x-workspace-key": workspaceKey } : {}),
      "x-service-provider": provider,
    },
  });
  if (!res.ok) throw new Error(`Zapmail API ${res.status}`);
  return res.json();
}

export async function resolveWorkspaceKey(apiKey: string): Promise<string | null> {
  try {
    const j = (await zmFetch("/workspaces", apiKey, null)) as { data?: { currentWorkspace?: { id?: string } } };
    return j?.data?.currentWorkspace?.id ?? null;
  } catch {
    return null;
  }
}

export interface ZapmailMailbox {
  zapmailId: string | null;
  email: string;
  displayName: string | null;
  appPassword: string;
  domain: string | null;
  status: string | null;
  isWarmedUp: boolean;
  provider: "zapmail-google" | "zapmail-microsoft";
}

export async function listZapmailMailboxes(
  apiKey: string,
  workspaceKey: string | null,
  provider: "GOOGLE" | "MICROSOFT" = "GOOGLE",
): Promise<{ mailboxes: ZapmailMailbox[]; error?: string }> {
  try {
    const j = (await zmFetch("/mailboxes/list", apiKey, workspaceKey, provider)) as {
      data?: { domains?: Array<{ domain?: string; mailboxes?: Array<Record<string, unknown>> }> };
    };
    const domains = j?.data?.domains ?? [];
    const mailboxes: ZapmailMailbox[] = [];
    for (const d of domains) {
      for (const m of d.mailboxes ?? []) {
        const email = String(m.email ?? "").trim().toLowerCase();
        if (!email.includes("@")) continue;
        const name = [m.firstName, m.lastName].filter(Boolean).join(" ").trim();
        mailboxes.push({
          zapmailId: m.id ? String(m.id) : null,
          email,
          displayName: name || null,
          appPassword: String(m.appPassword ?? "").replace(/\s+/g, ""),
          domain: (m.domain as string) ?? d.domain ?? null,
          status: m.status ? String(m.status) : null,
          isWarmedUp: Boolean(m.isWarmedUp),
          provider: provider === "MICROSOFT" ? "zapmail-microsoft" : "zapmail-google",
        });
      }
    }
    return { mailboxes };
  } catch (e) {
    return { mailboxes: [], error: String((e as Error)?.message ?? e) };
  }
}

export async function zapmailConfigured(tenantId: string): Promise<boolean> {
  const s = await getOutboundSettings(tenantId);
  return Boolean(s.zapmailApiKey);
}

/** List the Zapmail account's mailboxes using the key stored on `settingsTenantId` (the god tenant). */
export async function fetchZapmailMailboxes(settingsTenantId: string): Promise<{ mailboxes: ZapmailMailbox[]; error?: string }> {
  const s = await getOutboundSettings(settingsTenantId);
  if (!s.zapmailApiKey) return { mailboxes: [], error: "no Zapmail API key" };
  let wsk = s.zapmailWorkspaceKey;
  if (!wsk) {
    wsk = await resolveWorkspaceKey(s.zapmailApiKey);
    if (wsk) await setOutboundSettings(settingsTenantId, { zapmailWorkspaceKey: wsk });
  }
  return listZapmailMailboxes(s.zapmailApiKey, wsk);
}

function smtpHostFor(provider: ZapmailMailbox["provider"]): string {
  return provider === "zapmail-microsoft" ? "smtp.office365.com" : "smtp.gmail.com";
}

/** Assign one Zapmail mailbox into a target white-label's pool (active, with SMTP creds). */
export async function assignMailboxToTenant(targetTenantId: string, m: ZapmailMailbox): Promise<void> {
  const values = {
    tenantId: targetTenantId,
    address: m.email,
    displayName: m.displayName,
    provider: m.provider,
    smtpHost: smtpHostFor(m.provider),
    smtpPort: "587",
    smtpUser: m.email,
    smtpPassEnc: m.appPassword ? encryptSecret(m.appPassword) : null,
    zapmailId: m.zapmailId,
    status: (m.appPassword ? "active" : "paused") as "active" | "paused",
    dailyCap: 50,
  };
  const existing = (
    await db.select({ id: emailMailboxes.id }).from(emailMailboxes).where(and(eq(emailMailboxes.tenantId, targetTenantId), eq(emailMailboxes.address, m.email))).limit(1)
  )[0];
  if (existing) {
    await db.update(emailMailboxes).set(values).where(eq(emailMailboxes.id, existing.id));
  } else {
    await db.insert(emailMailboxes).values(values);
  }
}

/** Import all Zapmail mailboxes into one tenant's pool (uses the key stored on that tenant). */
export async function importZapmailMailboxes(tenantId: string): Promise<{ imported: number; found: number; error?: string }> {
  const { mailboxes, error } = await fetchZapmailMailboxes(tenantId);
  if (error) return { imported: 0, found: 0, error };
  for (const m of mailboxes) await assignMailboxToTenant(tenantId, m);
  return { imported: mailboxes.length, found: mailboxes.length };
}
