import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { tenantFilter } from "@/src/tenant/scope";
import { getIntegrations } from "@/src/integrations/store";
import { maskSecret } from "@/src/crypto/secrets";
import { saveIntegrationsAction } from "./actions";

export default async function IntegrationsAdminPage() {
  const ctx = await requireAuth(["god", "manager"]);
  const scope = tenantFilter({ role: ctx.user.role, tenantId: ctx.user.tenantId });
  const all = await db.select().from(tenants).orderBy(tenants.domain);
  const list = scope === null ? all : all.filter((t) => t.id === scope);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold">Integrations / API keys</h1>
      <p className="mt-1 text-sm opacity-70">Keys are encrypted at rest. Leave a secret blank to keep the current value.</p>
      {await Promise.all(list.map(async (t) => {
        const i = await getIntegrations(t.id);
        return (
          <section key={t.id} className="mt-6 rounded-xl border p-5">
            <h2 className="font-semibold">{t.domain}</h2>
            <form action={saveIntegrationsAction} className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <input type="hidden" name="tenantId" value={t.id} />
              <label className="col-span-2 font-medium">Stripe</label>
              <input name="stripePublishable" defaultValue={i.stripePublishable ?? ""} placeholder="pk_..." className="rounded border p-2" />
              <input name="stripeSecret" type="password" placeholder={i.stripeSecret ? maskSecret(i.stripeSecret) : "sk_... (secret)"} className="rounded border p-2" />
              <input name="stripeWebhookSecret" type="password" placeholder={i.stripeWebhookSecret ? maskSecret(i.stripeWebhookSecret) : "whsec_... (webhook signing secret)"} className="col-span-2 rounded border p-2" />
              <label className="col-span-2 mt-2 font-medium">PayPal</label>
              <input name="paypalClientId" defaultValue={i.paypalClientId ?? ""} placeholder="client id" className="rounded border p-2" />
              <input name="paypalSecret" type="password" placeholder={i.paypalSecret ? maskSecret(i.paypalSecret) : "secret"} className="rounded border p-2" />
              <label className="col-span-2 mt-2 font-medium">Twilio</label>
              <input name="twilioAccountSid" defaultValue={i.twilioAccountSid ?? ""} placeholder="AC..." className="rounded border p-2" />
              <input name="twilioAuthToken" type="password" placeholder={i.twilioAuthToken ? maskSecret(i.twilioAuthToken) : "auth token"} className="rounded border p-2" />
              <input name="twilioFromNumber" defaultValue={i.twilioFromNumber ?? ""} placeholder="+1770..." className="col-span-2 rounded border p-2" />
              <label className="col-span-2 mt-2 font-medium">SMTP (email)</label>
              <input name="smtpHost" defaultValue={i.smtpHost ?? ""} placeholder="smtp host" className="rounded border p-2" />
              <input name="smtpPort" defaultValue={i.smtpPort ?? ""} placeholder="port (587)" className="rounded border p-2" />
              <input name="smtpUser" defaultValue={i.smtpUser ?? ""} placeholder="smtp user" className="rounded border p-2" />
              <input name="smtpPass" type="password" placeholder={i.smtpPass ? maskSecret(i.smtpPass) : "smtp password"} className="rounded border p-2" />
              <input name="smtpFrom" defaultValue={i.smtpFrom ?? ""} placeholder="from (e.g. leads@roofers.co)" className="col-span-2 rounded border p-2" />
              <div className="col-span-2 mt-2 flex items-center gap-2">
                <label>Active payment provider:</label>
                <select name="activePaymentProvider" defaultValue={i.activePaymentProvider} className="rounded border p-2">
                  <option value="manual">manual</option><option value="stripe">stripe</option><option value="paypal">paypal</option>
                </select>
                <button className="ml-auto rounded bg-black px-3 py-2 text-white">Save</button>
              </div>
            </form>
          </section>
        );
      }))}
    </main>
  );
}
