import { requireAuth } from "@/src/auth/guard";
import { logoutAction } from "@/app/logout/actions";
import { getOrCreatePartnerCode } from "@/src/referral/core";
import { partnerFunnel, partnerEarnings } from "@/src/referral/reports";
import { getPayoutSettings } from "@/src/referral/payouts";
import { PageHeader, Card, SectionTitle, StatCard, Badge, Field } from "@/app/_ui/primitives";
import { Rocket } from "@/app/_ui/Rocket";
import { savePayoutAction } from "./actions";

function money(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function PartnerDashboardPage() {
  const ctx = await requireAuth(["partner"]);
  const code = await getOrCreatePartnerCode(ctx.user.id, ctx.user.tenantId);
  const [funnel, earnings, payout] = await Promise.all([
    partnerFunnel(ctx.user.id),
    partnerEarnings(ctx.user.id),
    getPayoutSettings(ctx.user.id),
  ]);

  const link = `https://${ctx.tenant.domain}/signup?ref=${code.code}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(link)}`;
  const ratePct = Math.round(Number(ctx.tenant.partnerRate) * 100);
  const brand = ctx.tenant.moneyWord || "Partner";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-app)" }}>
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 backdrop-blur"
        style={{ background: "color-mix(in srgb, var(--bg-app) 80%, transparent)", borderBottom: "1px solid var(--line)" }}
      >
        <span className="flex items-center gap-2 text-sm font-extrabold capitalize">
          <Rocket size={16} color="var(--color-accent)" /> {brand}
        </span>
        <form action={logoutAction}>
          <button className="btn btn-ghost" style={{ padding: "7px 13px" }}>Log out</button>
        </form>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <PageHeader title="Partner dashboard" subtitle="Refer customers, track your commission." />

        {/* Your link */}
        <Card className="mb-6">
          <SectionTitle hint={`Code: ${code.code}`}>Your referral link</SectionTitle>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <code
                className="block w-full overflow-x-auto rounded-[var(--radius-lg)] px-4 py-3 text-sm"
                style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" }}
              >
                {link}
              </code>
              <div className="mt-2 flex items-center gap-2">
                <span className="chip">{code.code}</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>Share this link or code to earn commission.</span>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="Referral QR code" width={140} height={140} className="rounded-[var(--radius-lg)]" style={{ border: "1px solid var(--line)" }} />
          </div>
        </Card>

        {/* Funnel */}
        <SectionTitle>Funnel</SectionTitle>
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Referred" value={String(funnel.referred)} sub="Signed up with your link" />
          <StatCard label="Activated" value={String(funnel.activated)} sub="Used their free credit" />
          <StatCard label="Upgraded" value={String(funnel.upgraded)} sub="Became paying customers" accent />
        </div>

        {/* Earnings */}
        <SectionTitle>Earnings</SectionTitle>
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Earned" value={money(earnings.earned)} sub="All-time" />
          <StatCard label="Owed" value={money(earnings.owed)} sub="Unpaid" accent />
          <StatCard label="Paid" value={money(earnings.paid)} sub="Disbursed to you" />
        </div>

        {/* Payout settings */}
        <Card className="mb-6">
          <SectionTitle>Payout settings</SectionTitle>
          <form action={savePayoutAction} className="grid gap-4 sm:grid-cols-2">
            <Field label="Payout method">
              <select name="method" defaultValue={payout.method} className="input">
                <option value="manual">Manual (check / wire)</option>
                <option value="paypal">PayPal</option>
                <option value="stripe_connect">Stripe Connect</option>
              </select>
            </Field>
            <Field label="PayPal email" hint="Used when your method is PayPal.">
              <input name="paypalEmail" type="email" placeholder="you@example.com" defaultValue={payout.paypalEmail ?? ""} className="input" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Stripe Connect">
                <input className="input" value={payout.stripeConnectId ?? "Connect coming soon"} readOnly disabled />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <button className="btn btn-primary">Save payout settings</button>
            </div>
          </form>
        </Card>

        <p className="text-sm" style={{ color: "var(--muted)" }}>
          <Badge tone="accent">{ratePct}%</Badge>{" "}
          You earn {ratePct}% of your white-label&rsquo;s margin on every collected payment for 12 months after a referral upgrades.
        </p>
      </main>
    </div>
  );
}
