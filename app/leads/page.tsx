import { requireAuth } from "@/src/auth/guard";
import { getWalletForUser, ensureWalletWithBonus } from "@/src/billing/wallet";
import { walletBalance } from "@/src/billing/ledger";
import { searchAvailableLeads, availableCount } from "@/src/delivery/search";
import { AppShell } from "@/app/_app/AppShell";
import { PageHeader, Card, SectionTitle, Table, Tr, Td } from "@/app/_ui/primitives";
import { FilterBuy } from "./FilterBuy";

export default async function LeadsPage() {
  const ctx = await requireAuth(["customer"]);
  const wallet = (await getWalletForUser(ctx.user.id)) ?? (await ensureWalletWithBonus(ctx.user.id));
  const balance = await walletBalance(wallet.id);
  const preview = await searchAvailableLeads(ctx.user.id, ctx.user.tenantId, {}, 25);
  const total = await availableCount(ctx.user.id, ctx.user.tenantId, {});
  const brand = ctx.tenant.moneyWord.replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <AppShell brand={brand} role="customer" balance={balance}>
      <PageHeader title="Buy leads" subtitle={`${total} leads available in your tenant pool`} />

      <Card>
        <FilterBuy />
      </Card>

      <div className="mt-6">
        <SectionTitle hint="Full contact unlocks on purchase">Available preview</SectionTitle>
        <Table head={["ZIP", "City", "State", "Segment", "Score", "Age", "Price"]}>
          {preview.map((p) => (
            <Tr key={p.leadId}>
              <Td>{p.zip}</Td>
              <Td>{p.city}</Td>
              <Td>{p.state}</Td>
              <Td>{p.segment}</Td>
              <Td>{p.scoreCategory}</Td>
              <Td>{p.tier}</Td>
              <Td>{p.price}</Td>
            </Tr>
          ))}
          {preview.length === 0 && (
            <tr className="border-t" style={{ borderColor: "var(--line)" }}>
              <td colSpan={7} className="px-4 py-3" style={{ color: "var(--muted)" }}>none available</td>
            </tr>
          )}
        </Table>
      </div>
    </AppShell>
  );
}
