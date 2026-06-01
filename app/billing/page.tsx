import { requireAuth } from "@/src/auth/guard";
import { getWalletForUser, ensureWalletWithBonus } from "@/src/billing/wallet";
import { walletBalance, ledgerEntries } from "@/src/billing/ledger";
import { listPendingPayments } from "@/src/billing/topup";
import { AppShell } from "@/app/_app/AppShell";
import { PageHeader, Card, SectionTitle, StatCard, Table, Tr, Td } from "@/app/_ui/primitives";
import { TopUpForm } from "./TopUpForm";

export default async function BillingPage() {
  const ctx = await requireAuth(["customer"]);
  const wallet = (await getWalletForUser(ctx.user.id)) ?? (await ensureWalletWithBonus(ctx.user.id));
  const balance = await walletBalance(wallet.id);
  const entries = await ledgerEntries(wallet.id);
  const pending = (await listPendingPayments(ctx.user.tenantId)).filter((p) => p.walletId === wallet.id);
  const brand = ctx.tenant.moneyWord.replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <AppShell brand={brand} role="customer" balance={balance}>
      <PageHeader title="Credits & billing" subtitle="Top up your wallet and review history." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <StatCard label="Wallet balance" value={`${balance}`} sub="credits" accent />
        </div>

        <Card className="lg:col-span-2">
          <SectionTitle>Add credits</SectionTitle>
          <TopUpForm />
          {pending.length > 0 && (
            <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
              {pending.length} top-up(s) awaiting confirmation.
            </p>
          )}
        </Card>
      </div>

      <Card className="mt-6" pad={false}>
        <Table head={["Activity", "Amount"]}>
          {entries.map((e) => {
            const amt = Number(e.amount);
            return (
              <Tr key={e.id}>
                <Td>{e.description ?? e.type}</Td>
                <Td>
                  <span style={{ color: amt < 0 ? "var(--neg)" : "var(--pos)", fontWeight: 600 }}>{amt}</span>
                </Td>
              </Tr>
            );
          })}
          {entries.length === 0 && (
            <tr className="border-t" style={{ borderColor: "var(--line)" }}>
              <td colSpan={2} className="px-4 py-3" style={{ color: "var(--muted)" }}>No activity yet.</td>
            </tr>
          )}
        </Table>
      </Card>
    </AppShell>
  );
}
