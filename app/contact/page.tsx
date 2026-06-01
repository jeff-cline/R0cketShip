import { getCurrentTenant } from "@/src/tenant/context";
import { MarketingNav } from "@/app/_marketing/MarketingNav";
import { MarketingFooter } from "@/app/_marketing/MarketingFooter";

export default async function ContactPage() {
  const t = await getCurrentTenant();
  return (
    <main>
      <MarketingNav brand={t?.moneyWord ?? "r0cketship"} />
      <section className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="text-4xl font-extrabold">Contact</h1>
        <p className="mt-6 text-lg leading-relaxed opacity-75">Questions about {t?.domain}? Call <strong>1-770-ROOFERS</strong> or apply to our <a href="/partner" className="underline" style={{ color: "var(--color-accent)" }}>E-Partnership program</a>. Existing customers can <a href="/login" className="underline" style={{ color: "var(--color-accent)" }}>sign in</a> to manage their account.</p>
      </section>
      <MarketingFooter footerHtml={t?.footerHtml ?? ""} />
    </main>
  );
}
