import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { leadCounts } from "@/src/leads/stats";
import { regenerateIngestKeyAction } from "./actions";
import { UploadForm } from "./UploadForm";

export default async function DataPage() {
  await requireAuth(["god"]);
  const allTenants = await db.select().from(tenants).orderBy(tenants.domain);
  const base = process.env.PUBLIC_BASE_URL ?? "https://r0cketship.com";

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-bold">Data ingestion</h1>
      {await Promise.all(allTenants.map(async (t) => {
        const counts = await leadCounts(t.id);
        return (
          <section key={t.id} className="mt-8 rounded-xl border p-5">
            <h2 className="text-lg font-semibold">{t.domain}</h2>

            <div className="mt-3 rounded bg-gray-50 p-3 text-xs">
              <div className="font-medium">Webhook Integration</div>
              <code className="block break-all">POST {base}/api/ingest/{t.id}</code>
              <code className="block break-all">x-ingest-key: {t.ingestKey ?? "(none — run seed)"}</code>
              <form action={regenerateIngestKeyAction} className="mt-2">
                <input type="hidden" name="tenantId" value={t.id} />
                <button className="rounded border px-2 py-1">Regenerate key</button>
              </form>
            </div>

            <div className="mt-3">
              <div className="text-sm font-medium">Upload CSV</div>
              <UploadForm tenantId={t.id} />
            </div>

            <div className="mt-3 text-sm">
              <div className="font-medium">Counts — {counts.total} leads</div>
              <div className="opacity-80">
                tiers: real_time {counts.byTier.real_time}, one_week {counts.byTier.one_week}, thirty_day {counts.byTier.thirty_day}, older {counts.byTier.older}
              </div>
              <div className="opacity-80">segments: residential {counts.bySegment.residential}, commercial {counts.bySegment.commercial}</div>
              <div className="opacity-80">top zips: {counts.topZips.map((z) => `${z.zip}(${z.count})`).join(", ") || "—"}</div>
            </div>
          </section>
        );
      }))}
    </main>
  );
}
