import { requireAuth } from "@/src/auth/guard";
import { tenantFilter } from "@/src/tenant/scope";
import { listApplications } from "@/src/marketing/partner";

export default async function PartnersAdminPage() {
  const ctx = await requireAuth(["god", "manager"]);
  const scope = tenantFilter({ role: ctx.user.role, tenantId: ctx.user.tenantId });
  const rows = await listApplications(scope ?? undefined);
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-bold">E-Partnership applications</h1>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded border p-3 text-sm">
            <div className="font-medium">{r.name} — {r.businessName} ({r.location})</div>
            <div className="opacity-70">{r.phone} · revenue {r.annualRevenue} · EBITDA {r.annualEbitda} · roofs/12mo {r.roofsLast12mo} · agree-exit {String(r.agreeExit)}</div>
          </li>
        ))}
        {rows.length === 0 && <li className="opacity-60">No applications yet.</li>}
      </ul>
    </main>
  );
}
