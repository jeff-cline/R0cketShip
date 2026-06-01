import { getCurrentTenant } from "@/src/tenant/context";
import { notFound } from "next/navigation";
import { marketingContent } from "@/src/marketing/content";
import { MarketingNav } from "@/app/_marketing/MarketingNav";
import { MarketingFooter } from "@/app/_marketing/MarketingFooter";
import { PricingBlock } from "@/app/_marketing/sections";

export default async function PricingPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const c = marketingContent(tenant);
  return (
    <main>
      <MarketingNav brand={tenant.moneyWord} />
      <header className="px-6 pb-2 pt-16 text-center">
        <h1 className="text-4xl font-extrabold">Simple, exclusive pricing</h1>
        <p className="mx-auto mt-3 max-w-lg" style={{ color: "var(--muted)" }}>Prepay, no contracts, lock your territory by ZIP. Start with $50 in leads free.</p>
      </header>
      <PricingBlock offers={c.offers} />
      <MarketingFooter footerHtml={c.footerHtml} />
    </main>
  );
}
