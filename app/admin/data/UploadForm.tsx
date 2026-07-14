"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Two-step upload flow:
 *   1. Pick file → POST to /api/admin/import/preview
 *      - Server checks file format, parses headers + 5 sample rows
 *      - Returns either an error (with remediation hint) or a preview payload
 *   2. Preview screen shows detected columns + sample rows
 *      - If the tenant's outreach offer is active, a modal warns that
 *        confirming the upload will trigger emails to every new lead
 *      - User picks Confirm or Cancel; Confirm posts to /api/admin/import
 *
 * Phase 1's "upload immediately, enqueue silently" behavior is preserved as
 * the underlying API — this form just adds the preview gate on top.
 */

interface MappingCheck {
  recognized: string[];
  unrecognized: string[];
  suspicious: string[];
  hasUsableMapping: boolean;
  noMappingAtAll: boolean;
  availableColumns: string[];
}

type Preview =
  | {
      ok: true;
      format: "csv";
      headers: string[];
      sample: Record<string, string>[];
      rowCount: number;
      willTriggerEmails: boolean;
      mapping: MappingCheck;
      skippedRows: number;
    }
  | {
      ok: false;
      format: "numbers" | "xlsx" | "xls" | "ods" | "unknown" | "binary_zip";
      reason: string;
      hint?: string;
    };

type CommitSummary = {
  inserted?: number;
  updated?: number;
  skipped?: number;
  errors?: number;
  emailsTriggered?: boolean;
  error?: string;
  hint?: string;
};

type Stage =
  | { kind: "idle" }
  | { kind: "previewing" }
  | { kind: "preview"; preview: Preview; file: File; skipRows: number; force: boolean }
  | { kind: "uploading" }
  | { kind: "done"; summary: CommitSummary };

export function UploadForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [warnTriggerOpen, setWarnTriggerOpen] = useState(false);

  function reset() {
    setStage({ kind: "idle" });
    setWarnTriggerOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function runPreview(file: File, skipRows: number) {
    setStage({ kind: "previewing" });
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(
        `/api/admin/import/preview?tenantId=${tenantId}&skipRows=${skipRows}`,
        { method: "POST", body: fd },
      );
      const preview = (await res.json()) as Preview;
      setStage({ kind: "preview", preview, file, skipRows, force: false });
    } catch {
      setStage({
        kind: "preview",
        preview: {
          ok: false,
          format: "unknown",
          reason: "Network error while previewing the file.",
        },
        file,
        skipRows,
        force: false,
      });
    }
  }

  async function commit({ triggerEmails }: { triggerEmails: boolean }) {
    if (stage.kind !== "preview" || !stage.preview.ok) return;
    const { file, skipRows, force } = stage;
    setStage({ kind: "uploading" });
    setWarnTriggerOpen(false);
    const fd = new FormData();
    fd.append("file", file);
    const qs = new URLSearchParams({
      tenantId,
      triggerEmails: triggerEmails ? "true" : "false",
      skipRows: String(skipRows),
    });
    if (force) qs.set("force", "true");
    try {
      const res = await fetch(`/api/admin/import?${qs.toString()}`, {
        method: "POST",
        body: fd,
      });
      const summary = (await res.json()) as CommitSummary;
      setStage({ kind: "done", summary });
      if (res.ok) router.refresh();
    } catch {
      setStage({ kind: "done", summary: { error: "upload_failed" } });
    }
  }

  function handleConfirm() {
    if (stage.kind !== "preview" || !stage.preview.ok) return;
    if (stage.preview.willTriggerEmails) {
      setWarnTriggerOpen(true);
    } else {
      void commit({ triggerEmails: false });
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-3">
      {stage.kind === "idle" && (
        <form
          className="flex flex-wrap items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = fileInputRef.current?.files?.[0];
            if (f) void runPreview(f, 0);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="text-sm"
          />
          <button className="btn btn-primary" style={{ padding: "8px 14px" }}>
            Preview &amp; upload CSV
          </button>
        </form>
      )}

      {stage.kind === "previewing" && (
        <div className="text-sm" style={{ color: "var(--muted)" }}>
          Inspecting file…
        </div>
      )}

      {stage.kind === "preview" && !stage.preview.ok && (
        <div
          className="rounded-lg border p-3 text-sm"
          style={{
            borderColor: "color-mix(in srgb, var(--neg) 35%, transparent)",
            background: "color-mix(in srgb, var(--neg) 7%, transparent)",
            color: "var(--neg)",
          }}
        >
          <div className="mb-1 font-semibold">
            {stage.preview.reason}{" "}
            <span className="text-xs opacity-70">
              (detected: <code>{stage.preview.format}</code>)
            </span>
          </div>
          {stage.preview.hint && (
            <div className="text-xs" style={{ color: "var(--ink-2)" }}>
              {stage.preview.hint}
            </div>
          )}
          <div className="mt-2">
            <button type="button" className="btn btn-ghost" onClick={reset}>
              Pick a different file
            </button>
          </div>
        </div>
      )}

      {stage.kind === "preview" && stage.preview.ok && (() => {
        // Alias to a const so TS keeps the narrowing inside .map callbacks.
        const pv = stage.preview;
        return (
        <div
          className="rounded-lg border p-3 text-sm"
          style={{
            borderColor: "var(--line)",
            background: "var(--surface-2, rgba(0,0,0,0.04))",
          }}
        >
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wider">Preview</span>
            <span className="chip">{pv.headers.length} columns</span>
            <span className="chip">~{pv.rowCount} rows in sample</span>
            <span className="chip">file: {stage.file.name}</span>
          </div>
          {/* Mapping check — flags the most common upload failure where none
              of the CSV's headers match the ingest schema. */}
          <div
            className="mb-3 rounded-md border p-2 text-xs"
            style={{
              borderColor: pv.mapping.noMappingAtAll
                ? "color-mix(in srgb, var(--neg) 45%, transparent)"
                : "var(--line)",
              background: pv.mapping.noMappingAtAll
                ? "color-mix(in srgb, var(--neg) 8%, transparent)"
                : "transparent",
            }}
          >
            <div
              className="mb-1.5 font-bold uppercase tracking-wider"
              style={{ color: pv.mapping.noMappingAtAll ? "var(--neg)" : "var(--muted)" }}
            >
              Mapping check {pv.mapping.noMappingAtAll && "— 🚨 No columns match"}
            </div>
            {pv.mapping.recognized.length > 0 && (
              <div className="mb-1">
                <span className="mr-2" style={{ color: "var(--pos)" }}>
                  ✓ Recognized ({pv.mapping.recognized.length}):
                </span>
                {pv.mapping.recognized.map((h) => (
                  <code
                    key={h}
                    className="mr-1 rounded px-1.5 py-0.5"
                    style={{ background: "color-mix(in srgb, var(--pos) 14%, transparent)", color: "var(--pos)" }}
                  >
                    {h}
                  </code>
                ))}
              </div>
            )}
            {pv.mapping.suspicious.length > 0 && (
              <div className="mb-1">
                <span className="mr-2" style={{ color: "var(--warn)" }}>
                  ⚠ Suspicious ({pv.mapping.suspicious.length}):
                </span>
                {pv.mapping.suspicious.map((h, i) => (
                  <code
                    key={`${h}-${i}`}
                    className="mr-1 rounded px-1.5 py-0.5"
                    style={{ background: "color-mix(in srgb, var(--warn) 14%, transparent)", color: "var(--warn)" }}
                  >
                    {h === "" ? "(empty)" : h}
                  </code>
                ))}
                <div className="mt-1" style={{ color: "var(--muted)" }}>
                  These look like Numbers/Excel table-title artifacts. Try Skip first 1 row below.
                </div>
              </div>
            )}
            {pv.mapping.unrecognized.length > 0 && (
              <div>
                <span className="mr-2" style={{ color: "var(--muted)" }}>
                  ? Unrecognized ({pv.mapping.unrecognized.length}):
                </span>
                {pv.mapping.unrecognized.slice(0, 8).map((h) => (
                  <code key={h} className="mr-1 rounded px-1.5 py-0.5" style={{ background: "rgba(0,0,0,0.06)" }}>
                    {h}
                  </code>
                ))}
                {pv.mapping.unrecognized.length > 8 && (
                  <span style={{ color: "var(--muted)" }}>
                    +{pv.mapping.unrecognized.length - 8} more
                  </span>
                )}
                <div className="mt-1" style={{ color: "var(--muted)" }}>
                  These columns land in <code>extra</code> JSONB but don&rsquo;t feed core fields like
                  <code>business_email</code>, <code>personal_zip</code>, etc.
                </div>
              </div>
            )}
            {pv.mapping.noMappingAtAll && (
              <div className="mt-2 text-[12px]" style={{ color: "var(--neg)" }}>
                None of your headers match the ingest schema. Your data won&rsquo;t be saved to the right
                fields — uploading now would create rows with empty <code>business_email</code>,
                <code>first_name</code>, etc. Fix row 1 of your CSV (it must contain the canonical column
                names) or use Skip first N rows if you have a title row above the headers.
              </div>
            )}
          </div>

          {/* Skip-rows control — Numbers/Excel exports often have a title row */}
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Skip first rows
            </span>
            {[0, 1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                className="rounded-full px-3 py-1 font-semibold"
                style={{
                  border: `1px solid ${stage.skipRows === n ? "var(--accent, #FF6B35)" : "var(--line)"}`,
                  background:
                    stage.skipRows === n
                      ? "color-mix(in srgb, var(--accent, #FF6B35) 14%, transparent)"
                      : "transparent",
                  color: stage.skipRows === n ? "var(--accent, #FF6B35)" : "var(--ink-2)",
                }}
                onClick={() => void runPreview(stage.file, n)}
              >
                {n}
              </button>
            ))}
            <span style={{ color: "var(--muted)" }}>
              (try 1 if you exported from Numbers/Excel and the first row is a table title)
            </span>
          </div>
          {pv.sample.length > 0 && (
            <div className="mb-3 overflow-auto rounded border" style={{ borderColor: "var(--line)" }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.04)" }}>
                    {pv.headers.slice(0, 8).map((h) => (
                      <th key={h} className="px-2 py-1.5 text-left font-semibold">
                        {h}
                      </th>
                    ))}
                    {pv.headers.length > 8 && (
                      <th className="px-2 py-1.5 text-left font-semibold" style={{ color: "var(--muted)" }}>
                        +{pv.headers.length - 8} more
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pv.sample.map((row, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: "var(--line)" }}>
                      {pv.headers.slice(0, 8).map((h) => (
                        <td
                          key={h}
                          className="px-2 py-1 align-top"
                          style={{ color: "var(--ink-2)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                          {row[h] ?? ""}
                        </td>
                      ))}
                      {pv.headers.length > 8 && (
                        <td className="px-2 py-1 align-top" style={{ color: "var(--muted)" }}>
                          …
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pv.willTriggerEmails && (
            <div
              className="mb-3 rounded-lg border p-2 text-xs"
              style={{
                borderColor: "color-mix(in srgb, var(--warn) 35%, transparent)",
                background: "color-mix(in srgb, var(--warn) 8%, transparent)",
                color: "var(--warn)",
              }}
            >
              ⚠ This tenant has an <strong>active outreach offer</strong>. Confirming will queue the drip
              email to every newly inserted lead.
            </div>
          )}
          {/* Force-override checkbox — only relevant when the mapping check
              found zero recognized columns. Disables the block in /api/admin/import. */}
          {pv.mapping.noMappingAtAll && (
            <label className="mb-2 flex items-center gap-2 text-xs" style={{ color: "var(--ink-2)" }}>
              <input
                type="checkbox"
                checked={stage.force}
                onChange={(e) =>
                  setStage({ ...stage, force: e.target.checked })
                }
              />
              <span>
                Force upload anyway (rows will save with empty core fields — only do this if you
                intentionally want raw archival data).
              </span>
            </label>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={pv.mapping.noMappingAtAll && !stage.force}
              style={
                pv.mapping.noMappingAtAll && !stage.force
                  ? { opacity: 0.5, cursor: "not-allowed" }
                  : undefined
              }
              title={
                pv.mapping.noMappingAtAll && !stage.force
                  ? "Fix the headers or check 'Force upload' to proceed"
                  : undefined
              }
            >
              Confirm upload
            </button>
            <button type="button" className="btn btn-ghost" onClick={reset}>
              Pick a different file
            </button>
          </div>
        </div>
        );
      })()}

      {stage.kind === "uploading" && (
        <div className="text-sm" style={{ color: "var(--muted)" }}>
          Importing…
        </div>
      )}

      {stage.kind === "done" && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {stage.summary.error ? (
            <span className="font-medium" style={{ color: "var(--neg)" }}>
              {stage.summary.error}
              {stage.summary.hint ? ` — ${stage.summary.hint}` : ""}
            </span>
          ) : (
            <>
              <span
                className="chip"
                style={{ background: "color-mix(in srgb, var(--pos) 14%, transparent)", color: "var(--pos)" }}
              >
                {stage.summary.inserted ?? 0} added
              </span>
              {!!stage.summary.updated && <span className="chip">{stage.summary.updated} updated</span>}
              {!!stage.summary.skipped && <span className="chip">{stage.summary.skipped} duplicate</span>}
              {!!stage.summary.errors && (
                <span
                  className="chip"
                  style={{ background: "color-mix(in srgb, var(--warn) 16%, transparent)", color: "var(--warn)" }}
                >
                  {stage.summary.errors} empty
                </span>
              )}
              <span
                className="chip"
                style={{
                  background: stage.summary.emailsTriggered
                    ? "color-mix(in srgb, var(--accent, #FF6B35) 14%, transparent)"
                    : "rgba(0,0,0,0.06)",
                  color: stage.summary.emailsTriggered ? "var(--accent, #FF6B35)" : "var(--muted)",
                }}
              >
                emails {stage.summary.emailsTriggered ? "triggered" : "skipped"}
              </span>
            </>
          )}
          <button type="button" className="btn btn-ghost" onClick={reset} style={{ padding: "4px 10px" }}>
            Upload another
          </button>
        </div>
      )}

      {/* Trigger-emails warning modal */}
      {warnTriggerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center px-4"
          style={{ background: "rgba(5,6,8,0.65)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setWarnTriggerOpen(false);
          }}
        >
          <div
            className="max-w-md rounded-xl border p-5 text-sm"
            style={{ background: "var(--bg, #fff)", borderColor: "var(--line)", color: "var(--ink)" }}
          >
            <div className="mb-2 text-base font-semibold" style={{ color: "var(--warn)" }}>
              ⚠ Heads up — this will trigger outreach emails
            </div>
            <p className="mb-3" style={{ color: "var(--ink-2)" }}>
              Uploading this file will queue the <strong>currently active outreach offer</strong> to be
              emailed to every newly-inserted lead, paced over the next ~5–7 days.
            </p>
            <p className="mb-4 text-xs" style={{ color: "var(--muted)" }}>
              If you don&rsquo;t want to send: click <em>Upload without emails</em>. If you do: click
              <em> Yes, send emails</em>.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: "var(--warn)", color: "#fff" }}
                onClick={() => commit({ triggerEmails: true })}
              >
                Yes, send emails
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => commit({ triggerEmails: false })}>
                Upload without emails
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setWarnTriggerOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
