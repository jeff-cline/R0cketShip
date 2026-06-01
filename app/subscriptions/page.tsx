import { requireAuth } from "@/src/auth/guard";
import { listSubscriptions } from "@/src/billing/subscriptions";
import { AppShell } from "@/app/_app/AppShell";
import { PageHeader, Card, SectionTitle, Table, Tr, Td, Badge } from "@/app/_ui/primitives";
import { SubscribeForm } from "./SubscribeForm";
import { cancelSubAction } from "./actions";

export default async function SubscriptionsPage() {
  const ctx = await requireAuth(["customer"]);
  const subs = await listSubscriptions(ctx.user.id);
  const brand = ctx.tenant.moneyWord.replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <AppShell brand={brand} role="customer">
      <PageHeader title="ZIP subscriptions" subtitle="Own every new lead in your territories." />

      <Card>
        <SectionTitle hint="2nd −10% · 3rd −20% · 4th+ −30%">Subscribe a ZIP</SectionTitle>
        <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
          Leads in your subscribed ZIPs are <strong>free</strong> — covered by the monthly fee.
        </p>
        <SubscribeForm />
      </Card>

      <div className="mt-6">
        <SectionTitle>Your subscriptions</SectionTitle>
        {subs.length === 0 ? (
          <Card>
            <p className="text-sm" style={{ color: "var(--muted)" }}>No subscriptions yet.</p>
          </Card>
        ) : (
          <Table head={["ZIP", "Offer", "Monthly", "Status", ""]}>
            {subs.map((s) => (
              <Tr key={s.id}>
                <Td className="font-semibold">{s.zip}</Td>
                <Td>{s.offer}</Td>
                <Td>
                  ${Number(s.monthlyPrice)}/mo
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    {s.paidThrough ? `paid through ${new Date(s.paidThrough).toLocaleDateString()}` : "invoice pending"}
                  </div>
                </Td>
                <Td>
                  <Badge tone={s.status === "active" ? "pos" : "neutral"}>{s.status}</Badge>
                </Td>
                <Td>
                  {s.status === "active" && (
                    <form action={cancelSubAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="btn btn-ghost" style={{ padding: "5px 11px" }}>Cancel</button>
                    </form>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </div>
    </AppShell>
  );
}
