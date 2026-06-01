import { requireAuth } from "@/src/auth/guard";
import { getIntegration } from "@/src/delivery/webhook";
import { AppShell } from "@/app/_app/AppShell";
import { PageHeader, Card, SectionTitle, Field } from "@/app/_ui/primitives";
import { saveIntegrationAction, testIntegrationAction } from "./actions";
import { CRM_INTEGRATIONS } from "@/src/marketing/integrations-list";

export default async function IntegrationsPage() {
  const ctx = await requireAuth(["customer"]);
  const integ = await getIntegration(ctx.user.id);
  const brand = ctx.tenant.moneyWord.replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <AppShell brand={brand} role="customer">
      <PageHeader title="Integrations" subtitle="Push your leads to your CRM automatically." />

      <Card>
        <SectionTitle>Outbound webhook</SectionTitle>
        <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
          Each lead you buy is POSTed to this URL as JSON.
        </p>
        <form action={saveIntegrationAction} className="flex flex-col gap-4">
          <Field label="Webhook URL">
            <input name="webhookUrl" defaultValue={integ?.webhookUrl ?? ""} placeholder="https://your-crm/webhook" className="input" />
          </Field>
          <Field label="Secret" hint="Optional — sent as a signing secret with each delivery.">
            <input type="password" name="webhookSecret" defaultValue={integ?.webhookSecret ?? ""} placeholder="secret (optional)" className="input" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={integ?.active ?? true} /> Active
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-primary">Save</button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4" style={{ borderColor: "var(--line)" }}>
          <form action={testIntegrationAction}>
            <button className="btn btn-ghost">Send test</button>
          </form>
          {integ?.lastStatus && (
            <span className="text-sm" style={{ color: "var(--muted)" }}>Last delivery: {integ.lastStatus}</span>
          )}
        </div>
      </Card>

      <div className="mt-6">
        <SectionTitle>Move your leads to your CRM</SectionTitle>
        <p className="mb-3 text-sm" style={{ color: "var(--muted)" }}>
          Get a webhook/inbound URL from your CRM, paste it above, and every lead you buy is pushed there automatically.
        </p>
        <Card pad={false}>
          <ul>
            {CRM_INTEGRATIONS.map((c, i) => (
              <li
                key={c.name}
                className="flex flex-col gap-0.5 px-5 py-3.5 sm:flex-row sm:items-baseline sm:gap-3"
                style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
              >
                <span className="shrink-0 font-semibold">{c.name}</span>
                <span className="text-sm" style={{ color: "var(--muted)" }}>{c.how}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
