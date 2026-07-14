"use client";
/**
 * Tabbed snippet viewer for the Offer Box edit page.
 *
 * The five snippet payloads are computed server-side and handed in as props
 * so this component stays purely presentational — no fetching, no DB. The
 * "Copy" button uses the Clipboard API with a textarea fallback (some host
 * environments — older Safari, iframes without document focus — refuse
 * `navigator.clipboard.writeText` silently).
 */
import { useState } from "react";

type TabKey = "iframe" | "js" | "html" | "popup" | "klaviyo";

interface SnippetTabsProps {
  defaultTab: TabKey;
  iframe: string;
  js: string;
  html: string;
  popup: string;
  klaviyoHint: string;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "iframe", label: "Iframe" },
  { key: "js", label: "JS loader" },
  { key: "html", label: "HTML for email" },
  { key: "popup", label: "Popup" },
  { key: "klaviyo", label: "Klaviyo" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-primary"
      style={{ padding: "8px 14px" }}
      onClick={async () => {
        try {
          if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
          } else {
            // Fallback for older browsers / restrictive iframes.
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
          }
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // swallow — UI still toggles to "Copy" so user can retry
        }
      }}
    >
      {copied ? "Copied ✓" : "Copy to clipboard"}
    </button>
  );
}

export function SnippetTabs(props: SnippetTabsProps) {
  const [tab, setTab] = useState<TabKey>(props.defaultTab);

  const code =
    tab === "iframe"
      ? props.iframe
      : tab === "js"
      ? props.js
      : tab === "html"
      ? props.html
      : tab === "popup"
      ? props.popup
      : props.klaviyoHint;

  const intro: Record<TabKey, string> = {
    iframe: "Drop this into any HTML page. Best when the host allows iframes.",
    js: "Paste these two lines anywhere in the page body. The script injects offers into the div.",
    html: "Pre-rendered HTML snapshot of the current top offers. Best for email and Klaviyo Universal Content.",
    popup: "Loads a modal overlay on first page-view per session. Dismissible.",
    klaviyo: "Klaviyo Universal Content instructions — the HTML you paste comes from the 'HTML for email' tab.",
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: tab === t.key ? "var(--color-accent)" : "var(--surface-2)",
              color: tab === t.key ? "#fff" : "var(--ink-2)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mb-3 text-xs" style={{ color: "var(--muted)" }}>
        {intro[tab]}
      </p>
      <pre
        className="overflow-auto rounded-[var(--radius-lg)] p-4 text-xs"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
          color: "var(--ink-2)",
          maxHeight: 360,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        <code>{code}</code>
      </pre>
      <div className="mt-3">
        <CopyButton text={code} />
      </div>
    </div>
  );
}
