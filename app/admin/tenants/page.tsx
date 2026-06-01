import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";

export default async function TenantsPage() {
  await requireAuth(["god"]);
  const rows = await db.select().from(tenants).orderBy(tenants.domain);
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">White-labels</h1>
        <a href="/admin/launch" className="rounded bg-black px-3 py-2 text-sm text-white">+ Launch</a>
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {rows.map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded border p-3">
            <span className="font-medium">{t.domain}</span>
            <span className="opacity-70">{t.niche} · {t.status}</span>
            <a href={`/admin/tenants/${t.id}`} className="ml-auto underline">Edit</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
