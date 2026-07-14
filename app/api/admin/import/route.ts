import { NextResponse } from "next/server";
import { getAuthContext, canAccess } from "@/src/auth/context";
import { ingestRows } from "@/src/leads/ingest";
import { parseCsvStream } from "@/src/leads/parse";
import { enqueueLeads } from "@/src/outreach/enqueue";
import { recognizedColumnKeys } from "@/src/leads/custom_columns";
import { parse as parseSync } from "csv-parse/sync";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!canAccess(ctx.user.role, ["god", "manager"])) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const tenantId = ctx.user.role === "god" ? url.searchParams.get("tenantId") : ctx.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  if (ctx.user.role === "manager" && tenantId !== ctx.user.tenantId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });

  // Defense in depth: reject obvious non-CSV files even when the client tried
  // to skip the preview step. (Preview route does the friendly version.)
  const lower = file.name.toLowerCase();
  if (
    lower.endsWith(".numbers") ||
    lower.endsWith(".xlsx") ||
    lower.endsWith(".xls") ||
    lower.endsWith(".ods")
  ) {
    return NextResponse.json(
      { error: "file_format_not_supported", hint: "Please export your file to CSV before uploading." },
      { status: 400 },
    );
  }
  // Magic-byte check — catch ZIP-backed office files even if extension is stripped.
  const peek = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (
    peek.length === 4 &&
    peek[0] === 0x50 &&
    peek[1] === 0x4b &&
    peek[2] === 0x03 &&
    peek[3] === 0x04
  ) {
    return NextResponse.json(
      { error: "binary_file_rejected", hint: "Looks like a binary spreadsheet — export to CSV and try again." },
      { status: 400 },
    );
  }

  // Apply `?skipRows=N` BEFORE handing the text to the CSV parser — same
  // logic the preview route uses. This is how we accommodate Numbers/Excel
  // exports that prepend a table-title row above the real header.
  const skipRows = Math.max(0, Math.min(10, Number(url.searchParams.get("skipRows") ?? "0") | 0));
  let text = await file.text();
  if (skipRows > 0) {
    let cursor = 0;
    for (let i = 0; i < skipRows; i++) {
      const nl = text.indexOf("\n", cursor);
      if (nl === -1) break;
      cursor = nl + 1;
    }
    text = text.slice(cursor);
  }

  // Hard guard: refuse to ingest if NONE of the headers map to a known canonical
  // column. The user can opt in to a force-override with `?force=true` if they
  // really want to drop unmapped junk into `extra` (rare, e.g. archival).
  const force = url.searchParams.get("force") === "true";
  if (!force) {
    try {
      const head = parseSync(text.slice(0, 8 * 1024), {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        relax_quotes: true,
        bom: true,
        to_line: 2,
      }) as Record<string, string>[];
      const headers = head[0] ? Object.keys(head[0]) : [];
      const knownSet = await recognizedColumnKeys();
      const recognized = headers.filter((h) => knownSet.has(h));
      if (recognized.length === 0) {
        return NextResponse.json(
          {
            error: "no_recognized_columns",
            hint:
              "None of your column headers match expected fields. Open the file, make sure row 1 is the real header row (e.g. first_name, business_email, personal_zip…), and try again — or use the preview's Skip-rows control if your file has a title row.",
            detectedHeaders: headers,
          },
          { status: 400 },
        );
      }
    } catch {
      // If our quick peek fails, fall through to ingestRows which will surface
      // its own parse error.
    }
  }

  const summary = await ingestRows(tenantId, "upload", parseCsvStream(text));

  // Honor an explicit `?triggerEmails=false` to skip outreach enqueue. The
  // UI's safeguard modal sends this when the user opts out of the email
  // trigger at upload time. Default = trigger (Phase 1 behavior).
  const triggerEmails = url.searchParams.get("triggerEmails") !== "false";
  if (triggerEmails) {
    await enqueueLeads(tenantId, summary.insertedLeadIds).catch(() => {});
  }
  return NextResponse.json({ ...summary, emailsTriggered: triggerEmails, skippedRows: skipRows });
}
