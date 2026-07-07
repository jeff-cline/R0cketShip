import { NextResponse } from "next/server";
import { db } from "@/src/db/client";
import { businessLeads } from "@/src/db/schema";
import { getCurrentTenant } from "@/src/tenant/context";
import { sendViaPool, platformTenantId } from "@/src/email/mailbox";

export const runtime = "nodejs";

// New-lead notification: both partners get every lead so god accounts (Jeff +
// Krystalore) see them and know to follow up. Best-effort — never blocks the save.
const LEAD_NOTIFY_TO = "krystalore@thecrewscoach.com, jeff.cline@me.com";

async function notifyNewLead(domain: string, source: string, b: Record<string, unknown>): Promise<void> {
  try {
    const pid = await platformTenantId();
    if (!pid) return;
    const esc = (v: unknown) => String(v ?? "—").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
    await sendViaPool(
      pid,
      {
        to: LEAD_NOTIFY_TO,
        subject: `New lead — ${domain} (${source})`,
        html: `<h2 style="margin:0 0 8px">New lead from ${esc(domain)}</h2>
<p style="margin:0 0 12px;color:#61708a">Source: ${esc(source)}</p>
<table style="border-collapse:collapse;font-size:14px">
  <tr><td style="padding:2px 10px 2px 0;color:#61708a">Name</td><td>${esc(b.name)}</td></tr>
  <tr><td style="padding:2px 10px 2px 0;color:#61708a">Company</td><td>${esc(b.company)}</td></tr>
  <tr><td style="padding:2px 10px 2px 0;color:#61708a">Email</td><td>${esc(b.email)}</td></tr>
  <tr><td style="padding:2px 10px 2px 0;color:#61708a">Work phone</td><td>${esc(b.workPhone)}</td></tr>
  <tr><td style="padding:2px 10px 2px 0;color:#61708a">Cell phone</td><td>${esc(b.cellPhone)}</td></tr>
  <tr><td style="padding:2px 10px 2px 0;color:#61708a;vertical-align:top">Message</td><td>${esc(b.message)}</td></tr>
  <tr><td style="padding:2px 10px 2px 0;color:#61708a;vertical-align:top">Predictive interest</td><td>${esc(b.predictive)}</td></tr>
</table>`,
      },
      "manual",
    );
  } catch {
    /* notification is best-effort */
  }
}

// Public endpoint — the hub's contact / investor / partner forms POST here so
// every submission lands in the Business Leads CRM (in addition to the mailto
// notification). No auth: it only ever inserts an inbound lead.
function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, 4000) : null;
}

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b || typeof b !== "object") return NextResponse.json({ error: "bad request" }, { status: 400 });

  const tenant = await getCurrentTenant().catch(() => null);
  const source = (str(b.source) ?? "contact").slice(0, 40);
  try {
    await db.insert(businessLeads).values({
      tenantId: tenant?.id ?? null,
      source,
      name: str(b.name),
      company: str(b.company),
      email: str(b.email),
      workPhone: str(b.workPhone),
      cellPhone: str(b.cellPhone),
      message: str(b.message),
      predictive: str(b.predictive),
      meta: b.meta && typeof b.meta === "object" ? (b.meta as Record<string, unknown>) : null,
    });
  } catch {
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
  await notifyNewLead(tenant?.domain ?? "worldchangers.ai", source, b);
  return NextResponse.json({ ok: true });
}
