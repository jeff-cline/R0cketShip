import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { tenantFilter } from "@/src/tenant/scope";
import { getIntegrations } from "@/src/integrations/store";
import { maskSecret } from "@/src/crypto/secrets";
import { saveIntegrationsAction, regenerateIngestKeyAction } from "./actions";
import { PageHeader, Card, SectionTitle } from "@/app/_ui/primitives";

export default async function IntegrationsAdminPage() {
  const ctx = await requireAuth(["god", "manager"]);
  const scope = tenantFilter({ role: ctx.user.role, tenantId: ctx.user.tenantId });
  const all = await db.select().from(tenants).orderBy(tenants.domain);
  const list = scope === null ? all : all.filter((t) => t.id === scope);

  return (
    <>
      <PageHeader title="Integrations / API keys" subtitle="Payment, messaging, and inbound-data keys per white-label." />

      <div className="flex flex-col gap-6">
        {await Promise.all(list.map(async (t) => {
          const i = await getIntegrations(t.id);
          return (
            <Card key={t.id}>
              <h2 className="mb-4 font-semibold">{t.domain}</h2>

              <SectionTitle>Inbound data webhook</SectionTitle>
              <div className="mb-4 rounded-lg p-3 text-xs" style={{ background: "var(--surface-2)" }}>
                <p style={{ color: "var(--muted)" }} className="mb-1">Give this URL and key to your data provider.</p>
                <code className="block break-all">POST https://{t.domain}/api/ingest/{t.id}</code>
                <code className="block break-all">Header — x-ingest-key: {t.ingestKey ?? "(run seed)"}</code>
                <div className="mt-1" style={{ color: "var(--muted)" }}>Body: a JSON array of lead objects, OR raw CSV (same columns as your bulk file). Have them POST your weekly/daily drop here. Returns {"{ inserted, updated, skipped, errors }"}.</div>
                <form action={regenerateIngestKeyAction} className="mt-2"><input type="hidden" name="tenantId" value={t.id} /><button className="btn btn-ghost">Regenerate key</button></form>
              </div>

              <form action={saveIntegrationsAction} className="grid grid-cols-2 gap-3 text-sm">
                <input type="hidden" name="tenantId" value={t.id} />

                <label className="col-span-2 font-medium">Stripe</label>
                <input name="stripePublishable" defaultValue={i.stripePublishable ?? ""} placeholder="pk_..." className="input" />
                <input name="stripeSecret" type="password" placeholder={i.stripeSecret ? maskSecret(i.stripeSecret) : "sk_... (secret)"} className="input" />
                <input name="stripeWebhookSecret" type="password" placeholder={i.stripeWebhookSecret ? maskSecret(i.stripeWebhookSecret) : "whsec_... (webhook signing secret)"} className="col-span-2 input" />

                <label className="col-span-2 mt-2 font-medium">PayPal</label>
                <input name="paypalClientId" defaultValue={i.paypalClientId ?? ""} placeholder="client id" className="input" />
                <input name="paypalSecret" type="password" placeholder={i.paypalSecret ? maskSecret(i.paypalSecret) : "secret"} className="input" />

                <label className="col-span-2 mt-2 font-medium">Twilio</label>
                <input name="twilioAccountSid" defaultValue={i.twilioAccountSid ?? ""} placeholder="AC..." className="input" />
                <input name="twilioAuthToken" type="password" placeholder={i.twilioAuthToken ? maskSecret(i.twilioAuthToken) : "auth token"} className="input" />
                <input name="twilioFromNumber" defaultValue={i.twilioFromNumber ?? ""} placeholder="+1770..." className="col-span-2 input" />
                <input name="hotTransferNumber" defaultValue={i.hotTransferNumber ?? ""} placeholder="hot-transfer number (+1770...)" className="col-span-2 input" />

                <label className="col-span-2 mt-2 font-medium">SMTP (email)</label>
                <input name="smtpHost" defaultValue={i.smtpHost ?? ""} placeholder="smtp host" className="input" />
                <input name="smtpPort" defaultValue={i.smtpPort ?? ""} placeholder="port (587)" className="input" />
                <input name="smtpUser" defaultValue={i.smtpUser ?? ""} placeholder="smtp user" className="input" />
                <input name="smtpPass" type="password" placeholder={i.smtpPass ? maskSecret(i.smtpPass) : "smtp password"} className="input" />
                <input name="smtpFrom" defaultValue={i.smtpFrom ?? ""} placeholder="from (e.g. leads@roofers.co)" className="col-span-2 input" />

                <div className="col-span-2 mt-2 flex items-center gap-2">
                  <label>Active payment provider:</label>
                  <select name="activePaymentProvider" defaultValue={i.activePaymentProvider} className="input">
                    <option value="manual">manual</option><option value="stripe">stripe</option><option value="paypal">paypal</option>
                  </select>
                  <button className="btn btn-primary ml-auto">Save</button>
                </div>
              </form>
            </Card>
          );
        }))}
      </div>
    </>
  );
}
