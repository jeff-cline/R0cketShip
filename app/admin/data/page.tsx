import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { leadCounts } from "@/src/leads/stats";
import { PageHeader } from "@/app/_ui/primitives";
import { DataIngestionList, type DataTenantRow } from "./DataIngestionList";

const GOD_SEND_EMAIL = "jeff.cline@me.com";

export default async function DataPage() {
  const ctx = await requireAuth(["god"]);
  const isJeff = (ctx.user.email ?? "").toLowerCase().trim() === GOD_SEND_EMAIL;
  const allTenants = await db.select().from(tenants).orderBy(tenants.domain);
  const base = process.env.PUBLIC_BASE_URL ?? "https://r0cketship.com";

  const rows: DataTenantRow[] = await Promise.all(
    allTenants.map(async (t) => ({
      id: t.id,
      domain: t.domain,
      niche: t.niche,
      moneyWord: t.moneyWord,
      ingestKey: t.ingestKey,
      counts: await leadCounts(t.id),
    })),
  );

  return (
    <>
      <PageHeader
        title="Data ingestion"
        subtitle="Upload lead files and view ingestion webhooks. Use the search to jump to a specific site."
      />
      <DataIngestionList tenants={rows} base={base} isJeff={isJeff} />
    </>
  );
}
