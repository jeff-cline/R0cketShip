"use client";
import { useState } from "react";

/**
 * God-only "Send emails" pressure-test panel. Renders inline on each tenant
 * card on /admin/data. Server already restricts this page to god+ via
 * requireAuth, and the underlying `/api/admin/godsend` endpoint additionally
 * checks for jeff.cline@me.com — so non-Jeff gods see the UI but the API
 * declines. (The server page also gates rendering by email.)
 *
 * Modes:
 *   - all      → every lead with a deliverable email
 *   - last N   → most recent N leads
 *   - random N → random N leads
 *
 * Offer:
 *   - current outreach offer (only option for v1; future: templates)
 *
 * Cadence:
 *   - drip (normal 5-7 day pacing)
 *   - immediate (collapse pacing → fire on next tick)
 */

type Mode = "all" | "last" | "random";

interface Result {
  ok?: boolean;
  error?: string;
  hint?: string;
  requested?: number;
  queued?: number;
  skippedNoEmail?: number;
  skippedSuppressed?: number;
  skippedBadAddress?: number;
  skippedDuplicate?: number;
  accelerated?: number;
  immediate?: boolean;
  offerTitle?: string;
}

export function GodSendPanel({ tenantId, tenantDomain }: { tenantId: string; tenantDomain: string }) {
  const [mode, setMode] = useState<Mode>("last");
  const [n, setN] = useState(100);
  const [immediate, setImmediate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function fire() {
    setBusy(true);
    setResult(null);
    setConfirmOpen(false);
    try {
      const res = await fetch("/api/admin/godsend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, mode, n, immediate }),
      });
      const j = (await res.json()) as Result;
      setResult(j);
    } catch {
      setResult({ error: "network_error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="mt-4 rounded-lg border p-3 text-sm"
      style={{
        borderColor: "color-mix(in srgb, var(--accent, #FF6B35) 35%, transparent)",
        background: "color-mix(in srgb, var(--accent, #FF6B35) 5%, transparent)",
      }}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold uppercase tracking-wider" style={{ color: "var(--accent, #FF6B35)" }}>
          Jeff Cline only · Send emails
        </span>
        <span className="chip">{tenantDomain}</span>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            Offer
          </span>
          <select
            className="input"
            defaultValue="current_offer"
            style={{ padding: "6px 10px", fontSize: 13 }}
          >
            <option value="current_offer">Single offer (current outreach)</option>
            <option value="top_performing" disabled>
              Top performing template (coming soon)
            </option>
            <option value="other_template" disabled>
              Other template (coming soon)
            </option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            Recipients
          </span>
          <select
            className="input"
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            style={{ padding: "6px 10px", fontSize: 13 }}
          >
            <option value="all">All leads</option>
            <option value="last">Last N</option>
            <option value="random">Random N</option>
          </select>
        </label>

        {mode !== "all" && (
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              N
            </span>
            <input
              type="number"
              className="input"
              min={1}
              max={50000}
              value={n}
              onChange={(e) => setN(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              style={{ padding: "6px 10px", fontSize: 13 }}
            />
          </label>
        )}
      </div>

      <label className="mb-3 flex items-center gap-2 text-xs">
        <input type="checkbox" checked={immediate} onChange={(e) => setImmediate(e.target.checked)} />
        <span style={{ color: "var(--ink-2)" }}>
          Send <strong>immediately</strong> (collapse drip pacing — next cron tick will attempt every queued row)
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={() => setConfirmOpen(true)}
          style={{ padding: "6px 12px" }}
        >
          {busy ? "Sending…" : "Send emails"}
        </button>
        {result && result.ok && (
          <div className="text-xs" style={{ color: "var(--pos)" }}>
            ✓ Requested {result.requested}, queued {result.queued}
            {result.immediate ? `, accelerated ${result.accelerated}` : ""}
            {result.skippedDuplicate ? `, ${result.skippedDuplicate} already queued` : ""}
            {result.skippedSuppressed ? `, ${result.skippedSuppressed} suppressed` : ""}
            {result.skippedNoEmail ? `, ${result.skippedNoEmail} no email` : ""}
            {result.skippedBadAddress ? `, ${result.skippedBadAddress} bad addr / no MX` : ""}
          </div>
        )}
        {result && !result.ok && (
          <div className="text-xs" style={{ color: "var(--neg)" }}>
            ✗ {result.error}{result.hint ? ` — ${result.hint}` : ""}
          </div>
        )}
      </div>

      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center px-4"
          style={{ background: "rgba(5,6,8,0.65)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmOpen(false);
          }}
        >
          <div
            className="max-w-md rounded-xl border p-5 text-sm"
            style={{ background: "var(--bg, #fff)", borderColor: "var(--line)", color: "var(--ink)" }}
          >
            <div className="mb-2 text-base font-semibold" style={{ color: "var(--accent, #FF6B35)" }}>
              Confirm pressure-test send
            </div>
            <p className="mb-2" style={{ color: "var(--ink-2)" }}>
              This will queue the active outreach offer to
              <strong> {mode === "all" ? "every lead" : `${mode} ${n} leads`}</strong> on <code>{tenantDomain}</code>.
            </p>
            {immediate && (
              <p className="mb-3 text-xs" style={{ color: "var(--warn)" }}>
                ⚡ Immediate mode is ON. All queued rows for this tenant will fire on the next cron tick.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" disabled={busy} onClick={fire}>
                Yes, send
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
