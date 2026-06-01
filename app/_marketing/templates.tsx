import type { Tenant } from "@/src/tenant/types";
import { marketingContent } from "@/src/marketing/content";
import { MarketingNav } from "./MarketingNav";
import { MarketingFooter } from "./MarketingFooter";
import { StatBar, FeatureGrid, HowItWorks, PricingBlock, Testimonials, EPartnerBand } from "./sections";

export function BoldTemplate({ tenant }: { tenant: Tenant }) {
  const c = marketingContent(tenant);
  return (
    <main>
      <MarketingNav brand={tenant.moneyWord} />
      <header className="px-6 pb-12 pt-20 text-center" style={{ background: "linear-gradient(160deg, var(--color-background) 45%, color-mix(in srgb, var(--color-accent) 12%, var(--color-background)))" }}>
        <div className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold" style={{ background: "color-mix(in srgb, var(--color-accent) 15%, transparent)", color: "var(--color-accent)" }}>⚡ Predictive intent · live in your ZIP</div>
        <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-extrabold md:text-6xl">{c.headline}</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg opacity-70">{c.subhead}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/signup" className="rounded-full px-7 py-3.5 font-bold text-white" style={{ background: "var(--color-accent)", boxShadow: "var(--shadow-md)" }}>Start free — $50 in leads →</a>
          <a href="/how-it-works" className="rounded-full border px-6 py-3.5 font-semibold" style={{ borderColor: "rgba(0,0,0,.15)" }}>See how it works</a>
        </div>
        <div className="mt-4 text-sm opacity-50">No card required · 3 free leads to test the system</div>
      </header>
      <StatBar stats={c.stats} />
      <FeatureGrid features={c.features} />
      <HowItWorks steps={c.steps} />
      <PricingBlock offers={c.offers} />
      <Testimonials testimonials={c.testimonials} />
      <EPartnerBand />
      <MarketingFooter footerHtml={c.footerHtml} />
    </main>
  );
}

export function TrustTemplate({ tenant }: { tenant: Tenant }) {
  const c = marketingContent(tenant);
  return (
    <main>
      <MarketingNav brand={tenant.moneyWord} />
      <header className="px-6 pb-14 pt-20 text-center" style={{ background: "var(--color-primary)", color: "var(--color-background)" }}>
        <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-accent)" }}>The {c.niche} growth network · established</div>
        <h1 className="font-serif-display mx-auto mt-5 max-w-3xl text-5xl font-bold md:text-6xl">{c.headline}</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg opacity-80">{c.subhead}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/signup" className="rounded-lg px-7 py-3.5 font-bold" style={{ background: "var(--color-accent)", color: "var(--color-primary)" }}>Get $50 in leads free</a>
          <a href="/how-it-works" className="rounded-lg border px-6 py-3.5 font-semibold" style={{ borderColor: "rgba(255,255,255,.25)", color: "#fff" }}>How it works</a>
        </div>
      </header>
      <StatBar stats={c.stats} />
      <FeatureGrid features={c.features} />
      <HowItWorks steps={c.steps} />
      <PricingBlock offers={c.offers} />
      <Testimonials testimonials={c.testimonials} />
      <EPartnerBand />
      <MarketingFooter footerHtml={c.footerHtml} />
    </main>
  );
}

export function DarkTemplate({ tenant }: { tenant: Tenant }) {
  const c = marketingContent(tenant);
  return (
    <main style={{ background: "#0a0d12", color: "#fff" }}>
      <MarketingNav brand={tenant.moneyWord} dark />
      <header className="px-6 pb-16 pt-20 text-center" style={{ background: "radial-gradient(120% 100% at 80% 0, #1c2533, #0a0d12)" }}>
        <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-accent)" }}>The {c.niche} growth engine</div>
        <h1 className="mx-auto mt-5 max-w-3xl text-5xl font-bold md:text-6xl">{c.headline}</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg" style={{ color: "#9aa6b6" }}>{c.subhead}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/signup" className="rounded-lg px-7 py-3.5 font-bold" style={{ background: "var(--color-accent)", color: "#0a0d12" }}>Claim your ZIP — $50 free</a>
          <a href="/how-it-works" className="rounded-lg border px-6 py-3.5 font-semibold" style={{ borderColor: "rgba(255,255,255,.2)", color: "#fff" }}>How it works</a>
        </div>
        <div className="mt-5 text-sm" style={{ color: "#6b7686" }}>★★★★★ trusted by operators nationwide</div>
      </header>
      <StatBar stats={c.stats} />
      <FeatureGrid features={c.features} dark />
      <HowItWorks steps={c.steps} dark />
      <PricingBlock offers={c.offers} dark />
      <Testimonials testimonials={c.testimonials} dark />
      <EPartnerBand dark />
      <MarketingFooter footerHtml={c.footerHtml} />
    </main>
  );
}
