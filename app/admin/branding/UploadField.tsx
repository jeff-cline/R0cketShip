"use client";
import { useState } from "react";
import { Field } from "@/app/_ui/primitives";

export default function UploadField({
  name,
  label,
  accept,
  defaultValue,
  kind,
}: {
  name: string;
  label: string;
  accept: string;
  defaultValue?: string;
  kind: "image" | "video";
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "upload failed");
      } else {
        setValue(data.url);
      }
    } catch {
      setError("upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Field label={label}>
      <input type="file" accept={accept} onChange={onFile} />
      {uploading && (
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          Uploading…
        </span>
      )}
      {error && (
        <span className="text-xs" style={{ color: "var(--neg)" }}>
          {error}
        </span>
      )}
      <input
        className="input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="or paste a URL"
      />
      <input type="hidden" name={name} value={value} />
      {value &&
        (kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="mt-1 max-h-32 rounded" />
        ) : (
          <video src={value} muted className="mt-1 max-h-32 rounded" />
        ))}
    </Field>
  );
}
