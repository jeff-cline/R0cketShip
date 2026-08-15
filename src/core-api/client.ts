// Thin server-side client for the R0cketShip Core API (shared email/SMS/lead
// services). The manifest's guidance: "send email THROUGH /api/core/email
// instead of configuring Zapmail yourself." Credentials live in env only
// (CORE_API_* in the gitignored .env.local) — never in code or the client bundle.
//
// Every call is best-effort: it returns a result object and never throws, so a
// Core outage can't break a lead save or a page render.

const BASE = process.env.CORE_API_BASE ?? "https://worldchangers.ai";
const KEY = process.env.CORE_API_KEY;
const SECRET = process.env.CORE_API_SECRET;

export function coreConfigured(): boolean {
  return Boolean(KEY && SECRET);
}

type CoreResult = { ok: boolean; error?: string; [k: string]: unknown };

async function call(path: string, body: unknown): Promise<CoreResult> {
  if (!coreConfigured()) return { ok: false, error: "core api not configured" };
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-core-key": KEY!,
        "x-core-secret": SECRET!,
      },
      body: JSON.stringify(body),
      // Notifications must never hang a request; cap the wait.
      signal: AbortSignal.timeout(15000),
    });
    const json = (await res.json().catch(() => ({}))) as CoreResult;
    return res.ok && json.ok !== false ? { ...json, ok: true } : { ...json, ok: false, error: json.error ?? `http ${res.status}` };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e).slice(0, 200) };
  }
}

export interface CoreEmail {
  to: string; // comma-separated ok
  subject: string;
  html?: string;
  text?: string;
  provider?: "zapmail" | "google_workspace" | "smtp";
}
/** Send email via the Core (Zapmail by default). Scope: email:send. */
export function coreEmail(msg: CoreEmail): Promise<CoreResult> {
  return call("/api/core/email", msg);
}

export interface CoreLead {
  name: string;
  email: string;
  phone?: string;
  zip?: string;
  state?: string;
  creatorRef?: string; // attribution — which white-label sent it
  notes?: string;
}
/** Push a lead into the Core CRM (enriched + attributed). Scope: lead:create. */
export function coreLead(lead: CoreLead): Promise<CoreResult> {
  return call("/api/core/lead", lead);
}

export interface CoreSms {
  to: string; // E.164
  body: string;
}
/** Send SMS via the Core's Twilio. Scope: sms:send. */
export function coreSms(msg: CoreSms): Promise<CoreResult> {
  return call("/api/core/sms", msg);
}
