import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { getAuthContext, canAccess } from "@/src/auth/context";
import { db } from "@/src/db/client";
import { outreachOffers } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { KNOWN_COLUMNS } from "@/src/leads/normalize";
import { recognizedColumnKeys } from "@/src/leads/custom_columns";

export const runtime = "nodejs";

/**
 * Pre-upload dry-run: parse the file header + first few rows so god/manager
 * can confirm the columns and row shape BEFORE we commit any inserts (and
 * before we accidentally trigger outreach emails on a bad file).
 *
 * Returns a structured `format` field so the UI can render the right
 * remediation hint when someone uploads a .numbers or .xlsx file.
 */

interface MappingCheck {
  recognized: string[];   // headers that match a KNOWN canonical column
  unrecognized: string[]; // headers that won't map to anything
  suspicious: string[];   // empty strings, "(N)", "untitled" — Numbers/Excel junk
  /** True when at least one header maps to a column we know how to ingest. */
  hasUsableMapping: boolean;
  /** True when zero recognized headers — almost certainly a mis-formatted file
   *  (e.g. Numbers title-row export). UI should block the commit. */
  noMappingAtAll: boolean;
  /** Lowercased KNOWN list so the UI can show "available columns". */
  availableColumns: string[];
}

interface PreviewOk {
  ok: true;
  format: "csv";
  headers: string[];
  sample: Record<string, string>[];
  rowCount: number;
  /** True when this tenant has an active outreach offer — uploading will
   *  enqueue the drip for every freshly inserted lead. */
  willTriggerEmails: boolean;
  mapping: MappingCheck;
  /** How many rows we skipped before reading headers (echoes the request
   *  param so the UI can stay in sync). */
  skippedRows: number;
}

interface PreviewErr {
  ok: false;
  format: "numbers" | "xlsx" | "xls" | "ods" | "unknown" | "binary_zip";
  reason: string;
  hint?: string;
}

const SAMPLE_ROWS = 5;
const MAX_HEADER_BYTES = 256 * 1024; // 256KB — plenty for headers + first few rows

function rejectByExt(name: string): PreviewErr | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".numbers")) {
    return {
      ok: false,
      format: "numbers",
      reason: "Apple Numbers files (.numbers) aren't supported.",
      hint: "Open the file in Numbers → File → Export To → CSV… → Save. Then upload that CSV here.",
    };
  }
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    return {
      ok: false,
      format: lower.endsWith(".xlsx") ? "xlsx" : "xls",
      reason: "Excel files aren't supported.",
      hint: "In Excel → File → Save As → CSV (Comma delimited). Then upload that CSV here.",
    };
  }
  if (lower.endsWith(".ods")) {
    return {
      ok: false,
      format: "ods",
      reason: "OpenDocument spreadsheets aren't supported.",
      hint: "Export to CSV from your spreadsheet app, then upload.",
    };
  }
  return null;
}

function looksLikeZipMagic(buf: Uint8Array): boolean {
  // ZIP file magic: 0x50 0x4B 0x03 0x04  (PK\x03\x04)
  return (
    buf.length >= 4 &&
    buf[0] === 0x50 &&
    buf[1] === 0x4b &&
    buf[2] === 0x03 &&
    buf[3] === 0x04
  );
}

export async function POST(req: Request): Promise<NextResponse<PreviewOk | PreviewErr>> {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ ok: false, format: "unknown", reason: "unauthenticated" }, { status: 401 });
  if (!canAccess(ctx.user.role, ["god", "manager"])) {
    return NextResponse.json({ ok: false, format: "unknown", reason: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const tenantId = ctx.user.role === "god" ? url.searchParams.get("tenantId") : ctx.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ ok: false, format: "unknown", reason: "tenantId required" }, { status: 400 });
  }
  if (ctx.user.role === "manager" && tenantId !== ctx.user.tenantId) {
    return NextResponse.json({ ok: false, format: "unknown", reason: "forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, format: "unknown", reason: "no file submitted" }, { status: 400 });
  }

  // Reject by extension first — clearest UX.
  const extReject = rejectByExt(file.name);
  if (extReject) return NextResponse.json(extReject, { status: 200 });

  // Read first chunk only — enough for headers + a few rows of preview without
  // blowing memory on huge files.
  const headSlice = await file.slice(0, MAX_HEADER_BYTES).arrayBuffer();
  const headBytes = new Uint8Array(headSlice);

  // Detect zipped office documents that lack the correct extension.
  if (looksLikeZipMagic(headBytes)) {
    return NextResponse.json({
      ok: false,
      format: "binary_zip",
      reason: "This looks like a binary spreadsheet file, not CSV.",
      hint: "Export to CSV from your spreadsheet app (Numbers / Excel / Google Sheets) and re-upload.",
    });
  }

  // Decode as UTF-8 (lenient — replace invalid bytes so a stray byte at the
  // edge of our slice doesn't break parsing).
  const headText = new TextDecoder("utf-8", { fatal: false }).decode(headBytes);

  // Optional: skip N leading rows so Numbers/Excel "table title" exports can
  // still be parsed. UI sends `?skipRows=1` (or 2, etc.) after the user picks
  // it from the preview panel.
  const skipRowsRaw = url.searchParams.get("skipRows");
  const skipRows = Math.max(0, Math.min(10, Number(skipRowsRaw ?? "0") | 0));

  // Strip skipRows worth of leading lines before letting csv-parse read headers.
  // Use a streaming split rather than chunky slicing so quoted newlines stay
  // intact within a row — for the small initial chunk this is fine.
  let working = headText;
  if (skipRows > 0) {
    let cursor = 0;
    for (let i = 0; i < skipRows; i++) {
      const nl = working.indexOf("\n", cursor);
      if (nl === -1) break;
      cursor = nl + 1;
    }
    working = working.slice(cursor);
  }

  let rows: Record<string, string>[];
  try {
    rows = parse(working, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
      bom: true,
    }) as Record<string, string>[];
  } catch (e) {
    return NextResponse.json({
      ok: false,
      format: "unknown",
      reason: "CSV parse error.",
      hint: `${(e as Error).message ?? "unknown"} — try saving the file as standard CSV and uploading again.`,
    });
  }

  const headers = rows[0] ? Object.keys(rows[0]) : [];
  // Guard against text files that aren't actually CSVs (no real headers).
  if (headers.length === 0 || (headers.length === 1 && headers[0]?.length && headers[0].length > 200)) {
    return NextResponse.json({
      ok: false,
      format: "unknown",
      reason: "No CSV header row detected.",
      hint: "Make sure the first row of your file contains column names (e.g., first_name, email, zip).",
    });
  }

  // Check whether this tenant has an active outreach offer — uploading will
  // queue the drip for every inserted lead.
  const offer = (
    await db
      .select({ active: outreachOffers.active })
      .from(outreachOffers)
      .where(eq(outreachOffers.tenantId, tenantId))
      .limit(1)
  )[0];
  const willTriggerEmails = offer?.active === true;

  // Mapping check — does the user's CSV actually align with the ingest schema?
  // Combine hard-coded KNOWN_COLUMNS with any god-registered custom columns.
  const knownSet = await recognizedColumnKeys();
  const recognized: string[] = [];
  const unrecognized: string[] = [];
  const suspicious: string[] = [];
  for (const h of headers) {
    if (knownSet.has(h)) {
      recognized.push(h);
      continue;
    }
    // Suspicious patterns: empty header, Numbers export artifacts like
    // "audience_export_… (1)" / "untitled" / "table 1".
    if (
      h === "" ||
      /^audience_export[_-]?\w*(?:\s*\(\d+\))?$/i.test(h) ||
      /^untitled/i.test(h) ||
      /^table\s*\d+$/i.test(h) ||
      /^column\s*\d+$/i.test(h)
    ) {
      suspicious.push(h);
    } else {
      unrecognized.push(h);
    }
  }

  return NextResponse.json({
    ok: true,
    format: "csv",
    headers,
    sample: rows.slice(0, SAMPLE_ROWS),
    rowCount: rows.length,
    willTriggerEmails,
    mapping: {
      recognized,
      unrecognized,
      suspicious,
      hasUsableMapping: recognized.length > 0,
      noMappingAtAll: recognized.length === 0,
      availableColumns: Array.from(knownSet).sort(),
    },
    skippedRows: skipRows,
  });
}
