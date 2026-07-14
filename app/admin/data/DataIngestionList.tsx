"use client";
/**
 * Searchable list of tenants on /admin/data.
 *
 * The page fetches every tenant + its lead counts server-side; this client
 * component renders the cards with a sticky search filter so god can find a
 * specific site to upload data into.
 */
import { useMemo, useState } from "react";
import { Card, SectionTitle } from "@/app/_ui/primitives";
import { UploadForm } from "./UploadForm";
import { regenerateIngestKeyAction } from "./actions";
import { GodSendPanel } from "./GodSendPanel";

export interface DataTenantRow {
  id: string;
  domain: string;
  niche: string;
  moneyWord: string;
  ingestKey: string | null;
  counts: {
    total: number;
    byTier: { real_time: number; one_week: number; thirty_day: number; older: number };
    bySegment: { residential: number; commercial: number };
    topZips: { zip: string; count: number }[];
  };
}

export function DataIngestionList({
  tenants,
  base,
  isJeff = false,
}: {
  tenants: DataTenantRow[];
  base: string;
  isJeff?: boolean;
}) {
  const [q, setQ] = useState("");
  const norm = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!norm) return tenants;
    return tenants.filter((t) =>
      [t.domain, t.niche, t.moneyWord]
        .filter(Boolean)
        .some((s) => s.toLowerCase().includes(norm)),
    );
  }, [tenants, norm]);

  return (
    <>
      {/* Sticky search bar so it stays put while scrolling 30+ tenants. */}
      <div
        className="sticky z-10 mb-5 flex flex-wrap items-center gap-3"
        style={{
          top: 0,
          background: "var(--bg)",
          padding: "10px 0",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by domain, niche, or money word…"
          className="input"
          style={{ flex: "1 1 320px", maxWidth: 520 }}
          autoFocus
        />
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          {filtered.length === tenants.length
            ? `${tenants.length} sites`
            : `${filtered.length} of ${tenants.length} sites`}
        </div>
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="btn btn-ghost"
            style={{ padding: "4px 10px", fontSize: 12 }}
          >
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            No sites match <strong>&ldquo;{q}&rdquo;</strong>. Try a different search.
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {filtered.map((t) => (
            <Card key={t.id}>
              <h2 className="mb-4 text-lg font-semibold">{t.domain}</h2>

              <SectionTitle>Webhook Integration</SectionTitle>
              <div className="rounded-lg p-3 text-xs" style={{ background: "var(--surface-2)" }}>
                <code className="block break-all">
                  POST {base}/api/ingest/{t.id}
                </code>
                <code className="block break-all">
                  x-ingest-key: {t.ingestKey ?? "(none — run seed)"}
                </code>
                <form action={regenerateIngestKeyAction} className="mt-2">
                  <input type="hidden" name="tenantId" value={t.id} />
                  <button className="btn btn-ghost">Regenerate key</button>
                </form>
              </div>

              <div className="mt-4">
                <SectionTitle>Upload CSV</SectionTitle>
                <UploadForm tenantId={t.id} />
              </div>

              <div className="mt-4 text-sm">
                <SectionTitle hint={`${t.counts.total} leads`}>Counts</SectionTitle>
                <div style={{ color: "var(--muted)" }}>
                  tiers: real_time {t.counts.byTier.real_time}, one_week {t.counts.byTier.one_week},
                  thirty_day {t.counts.byTier.thirty_day}, older {t.counts.byTier.older}
                </div>
                <div style={{ color: "var(--muted)" }}>
                  segments: residential {t.counts.bySegment.residential}, commercial {t.counts.bySegment.commercial}
                </div>
                <div style={{ color: "var(--muted)" }}>
                  top zips: {t.counts.topZips.map((z) => `${z.zip}(${z.count})`).join(", ") || "—"}
                </div>
              </div>

              <div className="mt-4">
                <a className="btn btn-ghost" href={`/admin/leads?tenant=${t.id}`}>
                  Browse leads →
                </a>
              </div>

              {isJeff && <GodSendPanel tenantId={t.id} tenantDomain={t.domain} />}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
