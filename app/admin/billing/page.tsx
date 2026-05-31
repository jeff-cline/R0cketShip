import { requireAuth } from "@/src/auth/guard";
import { tenantFilter } from "@/src/tenant/scope";
import { listPendingPayments, paymentsByTenant } from "@/src/billing/topup";
import { listCoupons } from "@/src/billing/coupons";
import { markPaidAction, grantCreditsAction, createCouponAction } from "./actions";

export default async function AdminBillingPage() {
  const ctx = await requireAuth(["god", "manager"]);
  const scope = tenantFilter({ role: ctx.user.role, tenantId: ctx.user.tenantId });
  const pending = await listPendingPayments(scope ?? undefined);
  const revenue = (await paymentsByTenant()).filter((r) => scope === null || r.tenantId === scope);
  const coupons = await listCoupons(scope ?? undefined);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold">Billing</h1>
      <h2 className="mt-6 font-semibold">Pending top-ups</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {pending.map((p) => (
          <li key={p.id} className="flex items-center gap-3">
            <span>${Number(p.amountUsd)} → {Number(p.credits)} credits {p.couponCode ? `(${p.couponCode})` : ""}</span>
            <form action={markPaidAction}><input type="hidden" name="paymentId" value={p.id} /><button className="rounded border px-2 py-1">Mark paid</button></form>
          </li>
        ))}
        {pending.length === 0 && <li className="opacity-60">none</li>}
      </ul>
      <h2 className="mt-8 font-semibold">Grant credits</h2>
      <form action={grantCreditsAction} className="mt-2 flex flex-wrap gap-2">
        <input name="walletId" placeholder="wallet id" required className="rounded border p-2" />
        <input name="amount" type="number" step="0.01" placeholder="credits (+/-)" required className="rounded border p-2" />
        <input name="description" placeholder="note" className="rounded border p-2" />
        <button className="rounded bg-black px-3 py-2 text-white">Grant</button>
      </form>
      <h2 className="mt-8 font-semibold">Coupons</h2>
      <form action={createCouponAction} className="mt-2 flex flex-wrap gap-2">
        <input name="code" placeholder="CODE" required className="rounded border p-2" />
        <select name="kind" className="rounded border p-2"><option value="fixed_credits">fixed_credits</option><option value="percent">percent</option></select>
        <input name="value" type="number" step="0.01" placeholder="value" required className="rounded border p-2" />
        <button className="rounded bg-black px-3 py-2 text-white">Create</button>
      </form>
      <ul className="mt-2 text-sm">
        {coupons.map((c) => <li key={c.id}>{c.code} — {c.kind} {Number(c.value)} (used {c.timesRedeemed})</li>)}
      </ul>
      <h2 className="mt-8 font-semibold">Revenue by tenant (paid)</h2>
      <ul className="mt-2 text-sm">
        {revenue.map((r) => <li key={r.tenantId}>{r.tenantId}: {r.count} payments, ${r.usd}</li>)}
        {revenue.length === 0 && <li className="opacity-60">none</li>}
      </ul>
    </main>
  );
}
