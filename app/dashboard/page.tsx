import { requireAuth } from "@/src/auth/guard";
import { AppShell } from "@/app/_app/AppShell";
import { PageHeader, Card, SectionTitle } from "@/app/_ui/primitives";

const TILES: { href: string; label: string; desc: string }[] = [
  { href: "/billing", label: "Credits & billing", desc: "Top up and review your wallet ledger." },
  { href: "/leads", label: "Buy leads", desc: "Browse and purchase available leads." },
  { href: "/subscriptions", label: "ZIP subscriptions", desc: "Own every new lead in your territories." },
  { href: "/crm", label: "My leads (CRM)", desc: "Track and work the leads you own." },
  { href: "/settings/integrations", label: "Integrations", desc: "Push leads to your CRM automatically." },
  { href: "/settings/email", label: "Email & booking", desc: "Configure your offer email and calendar." },
];

export default async function DashboardPage() {
  const ctx = await requireAuth(["customer"]);
  const brand = ctx.tenant.moneyWord.replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <AppShell brand={brand} role="customer">
      <PageHeader title="Dashboard" subtitle={`Signed in as ${ctx.user.email} · ${ctx.tenant.domain}`} />

      <SectionTitle>Quick links</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => (
          <Card key={t.href}>
            <div className="text-base font-bold">{t.label}</div>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{t.desc}</p>
            <a href={t.href} className="btn btn-ghost mt-4 inline-flex" style={{ padding: "7px 13px" }}>
              Open
            </a>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
