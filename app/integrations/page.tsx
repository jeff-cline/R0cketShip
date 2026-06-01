import { getCurrentTenant } from "@/src/tenant/context";
import { MarketingNav } from "@/app/_marketing/MarketingNav";
import { MarketingFooter } from "@/app/_marketing/MarketingFooter";
import { CRM_INTEGRATIONS, LEAD_PAYLOAD_FIELDS } from "@/src/marketing/integrations-list";

export default async function IntegrationsPage() {
  const t = await getCurrentTenant();
  return (
    <main>
      <MarketingNav brand={t?.moneyWord ?? "r0cketship"} />
      <header className="px-6 pb-2 pt-16 text-center">
        <h1 className="text-4xl font-extrabold">Integrations</h1>
        <p className="mx-auto mt-3 max-w-xl opacity-70">Leads flow in from our data engine and straight out to whatever CRM you already use — no engineering required.</p>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-accent)" }}>Inbound</div>
            <h2 className="mt-1 text-xl font-bold">Data in, automatically</h2>
            <p className="mt-2 text-sm opacity-75">Our predictive data engine refreshes daily, weekly, and monthly. New high-intent records in your ZIP land in your account on a recurring basis — no uploads.</p>
          </div>
          <div className="rounded-2xl border p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-accent)" }}>Outbound</div>
            <h2 className="mt-1 text-xl font-bold">Leads out to your CRM</h2>
            <p className="mt-2 text-sm opacity-75">Every lead you buy is POSTed as JSON to a webhook you control. Paste a URL from your CRM and you&rsquo;re live — works with all the tools below.</p>
          </div>
        </div>

        <h2 className="mt-12 text-center text-2xl font-extrabold">Connect your CRM in minutes</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {CRM_INTEGRATIONS.map((c) => (
            <div key={c.name} className="rounded-xl border p-4">
              <div className="font-bold">{c.name}</div>
              <div className="mt-1 text-sm opacity-70">{c.how}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border p-6" style={{ background: "#fafbfc" }}>
          <h3 className="font-bold">What we send</h3>
          <p className="mt-1 text-sm opacity-75">Each delivered lead is a JSON object with these fields:</p>
          <code className="mt-2 block break-words text-xs opacity-80">{LEAD_PAYLOAD_FIELDS.join(", ")}</code>
        </div>

        <div className="mt-10 text-center">
          <a href="/signup" className="inline-block rounded-full px-6 py-3 font-bold text-white" style={{ background: "var(--color-accent)" }}>Get started — $50 free →</a>
          <p className="mt-2 text-sm opacity-60">Already a member? Configure your CRM under Settings → Integration.</p>
        </div>
      </section>
      <MarketingFooter footerHtml={t?.footerHtml ?? ""} />
    </main>
  );
}
