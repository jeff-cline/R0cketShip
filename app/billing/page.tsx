import { requireAuth } from "@/src/auth/guard";
import { getWalletForUser, ensureWalletWithBonus } from "@/src/billing/wallet";
import { walletBalance, ledgerEntries } from "@/src/billing/ledger";
import { listPendingPayments } from "@/src/billing/topup";
import { TopUpForm } from "./TopUpForm";

export default async function BillingPage() {
  const ctx = await requireAuth(["customer"]);
  const wallet = (await getWalletForUser(ctx.user.id)) ?? (await ensureWalletWithBonus(ctx.user.id));
  const balance = await walletBalance(wallet.id);
  const entries = await ledgerEntries(wallet.id);
  const pending = (await listPendingPayments(ctx.user.tenantId)).filter((p) => p.walletId === wallet.id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold">Credits</h1>
      <p className="mt-2 text-3xl font-bold">{balance} <span className="text-base font-normal opacity-60">credits</span></p>
      <h2 className="mt-6 font-semibold">Add credits</h2>
      <TopUpForm />
      {pending.length > 0 && <p className="mt-3 text-sm opacity-70">{pending.length} top-up(s) awaiting confirmation.</p>}
      <h2 className="mt-8 font-semibold">History</h2>
      <ul className="mt-2 divide-y text-sm">
        {entries.map((e) => (
          <li key={e.id} className="flex justify-between py-1">
            <span>{e.description ?? e.type}</span>
            <span className={Number(e.amount) < 0 ? "text-red-600" : "text-green-700"}>{Number(e.amount)}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
