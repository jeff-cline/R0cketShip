import { requireAuth } from "@/src/auth/guard";
import { tenantFilter } from "@/src/tenant/scope";
import { listPendingPayments, paymentsByTenant } from "@/src/billing/topup";
import { listCoupons } from "@/src/billing/coupons";
import { markPaidAction, createCouponAction } from "./actions";
import { PageHeader, Card, SectionTitle } from "@/app/_ui/primitives";
import { UserGrantPanel } from "./UserGrantPanel";

export default async function AdminBillingPage() {
  const ctx = await requireAuth(["god", "manager"]);
  const scope = tenantFilter({ role: ctx.user.role, tenantId: ctx.user.tenantId });
  const pending = await listPendingPayments(scope ?? undefined);
  const revenue = (await paymentsByTenant()).filter((r) => scope === null || r.tenantId === scope);
  const coupons = await listCoupons(scope ?? undefined);

  return (
    <>
      <PageHeader title="Billing" subtitle="Top-ups, subscriptions, and manual payments." />

      <div className="flex flex-col gap-6">
        <Card>
          <SectionTitle>Pending top-ups</SectionTitle>
          <ul className="space-y-2 text-sm">
            {pending.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <span>${Number(p.amountUsd)} → {Number(p.credits)} credits {p.couponCode ? `(${p.couponCode})` : ""}</span>
                <form action={markPaidAction}><input type="hidden" name="paymentId" value={p.id} /><button className="btn btn-ghost">Mark paid</button></form>
              </li>
            ))}
            {pending.length === 0 && <li style={{ color: "var(--muted)" }}>none</li>}
          </ul>
        </Card>

        <Card>
          <SectionTitle hint="search by email → review account → grant $ with an audit note">
            Grant credits
          </SectionTitle>
          <UserGrantPanel />
        </Card>

        <Card>
          <SectionTitle>Coupons</SectionTitle>
          <form action={createCouponAction} className="flex flex-wrap gap-2">
            <input name="code" placeholder="CODE" required className="input" />
            <select name="kind" className="input"><option value="fixed_credits">fixed_credits</option><option value="percent">percent</option></select>
            <input name="value" type="number" step="0.01" placeholder="value" required className="input" />
            <button className="btn btn-primary">Create</button>
          </form>
          <ul className="mt-4 space-y-1 text-sm">
            {coupons.map((c) => <li key={c.id}>{c.code} — {c.kind} {Number(c.value)} (used {c.timesRedeemed})</li>)}
          </ul>
        </Card>

        <Card>
          <SectionTitle>Revenue by tenant (paid)</SectionTitle>
          <ul className="space-y-1 text-sm">
            {revenue.map((r) => <li key={r.tenantId}>{r.tenantId}: {r.count} payments, ${r.usd}</li>)}
            {revenue.length === 0 && <li style={{ color: "var(--muted)" }}>none</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
