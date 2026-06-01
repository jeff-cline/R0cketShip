import { getCurrentTenant } from "@/src/tenant/context";
import { MarketingNav } from "@/app/_marketing/MarketingNav";
import { MarketingFooter } from "@/app/_marketing/MarketingFooter";
import { Card } from "@/app/_ui/primitives";

export default async function AboutPage() {
  const t = await getCurrentTenant();
  return (
    <main>
      <MarketingNav brand={t?.moneyWord ?? "r0cketship"} />
      <section className="mx-auto max-w-2xl px-6 py-20">
        <Card pad>
          <h1 className="text-4xl font-extrabold capitalize">{t?.moneyWord}</h1>
          <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--muted)" }}>We connect {t?.niche} businesses with consumers who are actively in-market, using predictive and intent signals across billions of data points. Data drives decisions — we put you in front of the right people at the right time, by ZIP code, with exclusivity and the buying power of a nationwide network.</p>
          <a href="/signup" className="btn btn-primary mt-8 inline-flex">Get started — $50 free →</a>
        </Card>
      </section>
      <MarketingFooter footerHtml={t?.footerHtml ?? ""} />
    </main>
  );
}
