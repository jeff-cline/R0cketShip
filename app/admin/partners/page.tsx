import { requireAuth } from "@/src/auth/guard";
import { tenantFilter } from "@/src/tenant/scope";
import { listApplications } from "@/src/marketing/partner";
import { PageHeader, Card } from "@/app/_ui/primitives";

export default async function PartnersAdminPage() {
  const ctx = await requireAuth(["god", "manager"]);
  const scope = tenantFilter({ role: ctx.user.role, tenantId: ctx.user.tenantId });
  const rows = await listApplications(scope ?? undefined);
  return (
    <>
      <PageHeader title="E-Partnership applications" subtitle="E-partnership applications." />

      <Card>
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--line)" }}>
              <div className="font-medium">{r.name} — {r.businessName} ({r.location})</div>
              <div className="mt-1" style={{ color: "var(--muted)" }}>{r.phone} · revenue {r.annualRevenue} · EBITDA {r.annualEbitda} · roofs/12mo {r.roofsLast12mo} · agree-exit {String(r.agreeExit)}</div>
            </li>
          ))}
          {rows.length === 0 && <li style={{ color: "var(--muted)" }}>No applications yet.</li>}
        </ul>
      </Card>
    </>
  );
}
