import { NextResponse } from "next/server";
import { handleInbound } from "@/src/email/autoreply";

export const runtime = "nodejs";

/**
 * Inbound mail webhook, keyed by tenant id in the URL. Point your mailbox
 * forwarding / inbound-parse provider at:
 *   POST https://<tenant-domain>/api/email/inbound/<tenantId>
 * Accepts JSON ({ from, to?, subject?, text?/body?/html? }) or form-encoded.
 *
 * Open by design (no auth) so any forwarding provider can post. Keyed by the
 * opaque tenant UUID in the path. TODO(optional): also accept a `?key=` shared
 * secret per tenant for an extra guard if abuse becomes a concern.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  if (!tenant) {
    return NextResponse.json({ error: "missing tenant" }, { status: 400 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let from = "";
  let to: string | undefined;
  let subject: string | undefined;
  let body: string | undefined;

  try {
    if (contentType.includes("application/json")) {
      const data = (await req.json()) as Record<string, unknown>;
      from = String(data.from ?? "").trim();
      to = data.to != null ? String(data.to) : undefined;
      subject = data.subject != null ? String(data.subject) : undefined;
      const raw = data.text ?? data.body ?? data.html;
      body = raw != null ? stripHtml(String(raw)) : undefined;
    } else {
      const form = await req.formData();
      from = String(form.get("from") ?? "").trim();
      const toVal = form.get("to");
      to = toVal != null ? String(toVal) : undefined;
      const subjVal = form.get("subject");
      subject = subjVal != null ? String(subjVal) : undefined;
      const raw = form.get("text") ?? form.get("body") ?? form.get("html");
      body = raw != null ? stripHtml(String(raw)) : undefined;
    }
  } catch {
    return NextResponse.json({ error: "could not parse body" }, { status: 400 });
  }

  if (!from) {
    return NextResponse.json({ error: "missing from" }, { status: 400 });
  }

  const result = await handleInbound(tenant, { from, to, subject, body });
  return NextResponse.json(result);
}

function stripHtml(s: string): string {
  // Only strips tags when the payload looks like HTML; plain text passes through.
  return /<[a-z][\s\S]*>/i.test(s) ? s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : s;
}
