"use client";
import { useState } from "react";

export function UploadForm({ tenantId }: { tenantId: string }) {
  const [result, setResult] = useState<string>("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-2 flex items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const input = (e.currentTarget.elements.namedItem("file") as HTMLInputElement);
        if (!input.files?.[0]) return;
        setBusy(true);
        setResult("");
        const fd = new FormData();
        fd.append("file", input.files[0]);
        const res = await fetch(`/api/admin/import?tenantId=${tenantId}`, { method: "POST", body: fd });
        const json = await res.json();
        setResult(JSON.stringify(json));
        setBusy(false);
      }}
    >
      <input type="file" name="file" accept=".csv,text/csv" required className="text-sm" />
      <button disabled={busy} className="rounded bg-black px-3 py-1 text-sm text-white">
        {busy ? "Importing…" : "Upload CSV"}
      </button>
      {result && <span className="text-xs">{result}</span>}
    </form>
  );
}
