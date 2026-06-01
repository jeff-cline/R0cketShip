import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { leadCounts } from "@/src/leads/stats";
import { regenerateIngestKeyAction } from "./actions";
import { UploadForm } from "./UploadForm";
import { PageHeader, Card, SectionTitle } from "@/app/_ui/primitives";

export default async function DataPage() {
  await requireAuth(["god"]);
  const allTenants = await db.select().from(tenants).orderBy(tenants.domain);
  const base = process.env.PUBLIC_BASE_URL ?? "https://r0cketship.com";

  return (
    <>
      <PageHeader title="Data ingestion" subtitle="Upload lead files and view ingestion webhooks." />

      <div className="flex flex-col gap-6">
        {await Promise.all(allTenants.map(async (t) => {
          const counts = await leadCounts(t.id);
          return (
            <Card key={t.id}>
              <h2 className="mb-4 text-lg font-semibold">{t.domain}</h2>

              <SectionTitle>Webhook Integration</SectionTitle>
              <div className="rounded-lg p-3 text-xs" style={{ background: "var(--surface-2)" }}>
                <code className="block break-all">POST {base}/api/ingest/{t.id}</code>
                <code className="block break-all">x-ingest-key: {t.ingestKey ?? "(none — run seed)"}</code>
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
                <SectionTitle hint={`${counts.total} leads`}>Counts</SectionTitle>
                <div style={{ color: "var(--muted)" }}>
                  tiers: real_time {counts.byTier.real_time}, one_week {counts.byTier.one_week}, thirty_day {counts.byTier.thirty_day}, older {counts.byTier.older}
                </div>
                <div style={{ color: "var(--muted)" }}>segments: residential {counts.bySegment.residential}, commercial {counts.bySegment.commercial}</div>
                <div style={{ color: "var(--muted)" }}>top zips: {counts.topZips.map((z) => `${z.zip}(${z.count})`).join(", ") || "—"}</div>
              </div>
            </Card>
          );
        }))}
      </div>
    </>
  );
}
