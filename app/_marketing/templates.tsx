import type { Tenant } from "@/src/tenant/types";
import { marketingContent } from "@/src/marketing/content";
import { MarketingNav } from "./MarketingNav";
import { MarketingFooter } from "./MarketingFooter";
import { Hero } from "./Hero";
import { StatBar, FeatureGrid, HowItWorks, PricingBlock, Testimonials, EPartnerBand } from "./sections";

export function BoldTemplate({ tenant }: { tenant: Tenant }) {
  const c = marketingContent(tenant);
  return (
    <main>
      <MarketingNav brand={tenant.moneyWord} />
      <Hero content={c} variant="bold" />
      <StatBar stats={c.stats} />
      <FeatureGrid features={c.features} />
      <HowItWorks steps={c.steps} />
      <PricingBlock offers={c.offers} />
      <Testimonials testimonials={c.testimonials} />
      <EPartnerBand />
      <MarketingFooter footerHtml={c.footerHtml} becomeAPartner={tenant.showBecomeAPartner} />
    </main>
  );
}

export function TrustTemplate({ tenant }: { tenant: Tenant }) {
  const c = marketingContent(tenant);
  return (
    <main>
      <MarketingNav brand={tenant.moneyWord} />
      <Hero content={c} variant="trust" />
      <StatBar stats={c.stats} />
      <FeatureGrid features={c.features} />
      <HowItWorks steps={c.steps} />
      <PricingBlock offers={c.offers} />
      <Testimonials testimonials={c.testimonials} />
      <EPartnerBand />
      <MarketingFooter footerHtml={c.footerHtml} becomeAPartner={tenant.showBecomeAPartner} />
    </main>
  );
}

export function DarkTemplate({ tenant }: { tenant: Tenant }) {
  const c = marketingContent(tenant);
  return (
    <main style={{ background: "#0a0d12", color: "#fff" }}>
      <MarketingNav brand={tenant.moneyWord} dark />
      <Hero content={c} variant="dark" />
      <StatBar stats={c.stats} />
      <FeatureGrid features={c.features} dark />
      <HowItWorks steps={c.steps} dark />
      <PricingBlock offers={c.offers} dark />
      <Testimonials testimonials={c.testimonials} dark />
      <EPartnerBand dark />
      <MarketingFooter footerHtml={c.footerHtml} becomeAPartner={tenant.showBecomeAPartner} />
    </main>
  );
}
