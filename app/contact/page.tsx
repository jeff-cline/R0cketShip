import { getCurrentTenant } from "@/src/tenant/context";
import { MarketingNav } from "@/app/_marketing/MarketingNav";
import { MarketingFooter } from "@/app/_marketing/MarketingFooter";
import { Card } from "@/app/_ui/primitives";

export default async function ContactPage() {
  const t = await getCurrentTenant();
  return (
    <main>
      <MarketingNav brand={t?.moneyWord ?? "r0cketship"} />
      <section className="mx-auto max-w-2xl px-6 py-20">
        <Card pad>
          <h1 className="text-4xl font-extrabold">Contact</h1>
          <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--muted)" }}>Questions about {t?.domain}? Call <strong>1-770-ROOFERS</strong> or apply to our <a href="/partner" className="font-semibold underline" style={{ color: "var(--color-accent)" }}>E-Partnership program</a>. Existing customers can <a href="/login" className="font-semibold underline" style={{ color: "var(--color-accent)" }}>sign in</a> to manage their account.</p>
        </Card>
      </section>
      <MarketingFooter footerHtml={t?.footerHtml ?? ""} />
    </main>
  );
}
