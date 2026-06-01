"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Summary = { inserted?: number; updated?: number; skipped?: number; errors?: number; error?: string };

export function UploadForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-2 flex flex-wrap items-center gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem("file") as HTMLInputElement;
        if (!input.files?.[0]) return;
        setBusy(true);
        setSummary(null);
        const fd = new FormData();
        fd.append("file", input.files[0]);
        try {
          const res = await fetch(`/api/admin/import?tenantId=${tenantId}`, { method: "POST", body: fd });
          const json: Summary = await res.json();
          setSummary(json);
          if (res.ok) router.refresh(); // re-render the server page so COUNTS update
        } catch {
          setSummary({ error: "upload failed" });
        } finally {
          setBusy(false);
        }
      }}
    >
      <input type="file" name="file" accept=".csv,text/csv" required className="text-sm" />
      <button disabled={busy} className="btn btn-primary" style={{ padding: "8px 14px" }}>
        {busy ? "Importing…" : "Upload CSV"}
      </button>
      {summary &&
        (summary.error ? (
          <span className="text-sm font-medium" style={{ color: "var(--neg)" }}>{summary.error}</span>
        ) : (
          <span className="flex flex-wrap items-center gap-2 text-sm">
            <span className="chip" style={{ background: "color-mix(in srgb, var(--pos) 14%, transparent)", color: "var(--pos)" }}>{summary.inserted ?? 0} added</span>
            {!!summary.updated && <span className="chip">{summary.updated} updated</span>}
            {!!summary.skipped && <span className="chip">{summary.skipped} duplicate</span>}
            {!!summary.errors && <span className="chip" style={{ background: "color-mix(in srgb, var(--warn) 16%, transparent)", color: "var(--warn)" }}>{summary.errors} empty</span>}
          </span>
        ))}
    </form>
  );
}
