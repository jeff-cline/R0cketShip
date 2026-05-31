import { requireAuth } from "@/src/auth/guard";
import { getWalletForUser, ensureWalletWithBonus } from "@/src/billing/wallet";
import { walletBalance } from "@/src/billing/ledger";
import { searchAvailableLeads, availableCount } from "@/src/delivery/search";
import { FilterBuy } from "./FilterBuy";

export default async function LeadsPage() {
  const ctx = await requireAuth(["customer"]);
  const wallet = (await getWalletForUser(ctx.user.id)) ?? (await ensureWalletWithBonus(ctx.user.id));
  const balance = await walletBalance(wallet.id);
  const preview = await searchAvailableLeads(ctx.user.id, ctx.user.tenantId, {}, 25);
  const total = await availableCount(ctx.user.id, ctx.user.tenantId, {});

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-bold">Buy leads</h1>
      <p className="mt-1 text-sm opacity-70">Balance: {balance} credits · {total} available</p>
      <FilterBuy />
      <h2 className="mt-8 font-semibold">Available (preview — full contact unlocks on purchase)</h2>
      <table className="mt-2 w-full text-sm">
        <thead><tr className="text-left opacity-60"><th>ZIP</th><th>City</th><th>State</th><th>Segment</th><th>Score</th><th>Age</th><th>Price</th></tr></thead>
        <tbody>
          {preview.map((p) => (
            <tr key={p.leadId} className="border-t">
              <td>{p.zip}</td><td>{p.city}</td><td>{p.state}</td><td>{p.segment}</td><td>{p.scoreCategory}</td><td>{p.tier}</td><td>{p.price}</td>
            </tr>
          ))}
          {preview.length === 0 && <tr><td colSpan={7} className="py-2 opacity-60">none available</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
