import { requireAuth } from "@/src/auth/guard";
import { listSubscriptions } from "@/src/billing/subscriptions";
import { SubscribeForm } from "./SubscribeForm";
import { cancelSubAction } from "./actions";

export default async function SubscriptionsPage() {
  const ctx = await requireAuth(["customer"]);
  const subs = await listSubscriptions(ctx.user.id);
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold">ZIP subscriptions</h1>
      <p className="mt-1 text-sm opacity-70">Subscribe a ZIP for monthly access — leads in your subscribed ZIPs are <strong>free</strong> (covered by the monthly fee). Volume discount: 2nd −10%, 3rd −20%, 4th+ −30%.</p>
      <SubscribeForm />
      <ul className="mt-6 space-y-2 text-sm">
        {subs.map((s) => (
          <li key={s.id} className="flex items-center gap-3 rounded border p-3">
            <span className="font-medium">{s.zip}</span>
            <span className="opacity-70">{s.offer} · ${Number(s.monthlyPrice)}/mo · {s.status}{s.paidThrough ? ` · paid through ${new Date(s.paidThrough).toLocaleDateString()}` : " · invoice pending"}</span>
            {s.status === "active" && (
              <form action={cancelSubAction} className="ml-auto"><input type="hidden" name="id" value={s.id} /><button className="text-sm underline">Cancel</button></form>
            )}
          </li>
        ))}
        {subs.length === 0 && <li className="opacity-60">No subscriptions yet.</li>}
      </ul>
    </main>
  );
}
