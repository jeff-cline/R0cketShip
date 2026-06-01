import { requireAuth } from "@/src/auth/guard";
import { getCurrentTenant } from "@/src/tenant/context";
import { getOrCreateCode } from "@/src/affiliate/code";
import { affiliateStats } from "@/src/affiliate/referral";
import { AppShell } from "@/app/_app/AppShell";
import { PageHeader, Card, SectionTitle, StatCard } from "@/app/_ui/primitives";

export default async function AffiliatePage() {
  const ctx = await requireAuth(["customer"]);
  const code = await getOrCreateCode(ctx.user.id);
  const stats = await affiliateStats(ctx.user.id);
  const tenant = await getCurrentTenant();
  const link = `https://${tenant?.domain ?? "r0cketship.com"}/signup?ref=${code}`;
  const brand = ctx.tenant.moneyWord.replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <AppShell brand={brand} role="customer">
      <PageHeader title="Affiliate program" subtitle="Earn 10% of referred customers' credit purchases." />

      <Card>
        <SectionTitle>Your referral link</SectionTitle>
        <p className="mb-3 text-sm" style={{ color: "var(--muted)" }}>
          Share your link. Earn <strong>10% of the credits</strong> every member you refer buys — paid as credits in your wallet.
        </p>
        <code className="block break-all rounded px-2 py-1 text-sm" style={{ background: "var(--surface-3)", color: "var(--ink-2)" }}>
          {link}
        </code>
        <div className="mt-3 text-xs" style={{ color: "var(--muted-2)" }}>
          Referral code: <code className="rounded px-2 py-1" style={{ background: "var(--surface-3)" }}>{code}</code>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Referrals" value={String(stats.referrals)} />
        <StatCard label="Credits earned" value={String(stats.earnedCredits)} accent />
      </div>
    </AppShell>
  );
}
