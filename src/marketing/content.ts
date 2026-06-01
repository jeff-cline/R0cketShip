import type { Tenant } from "../tenant/types";

export interface MFeature { icon: string; title: string; desc: string }
export interface MStat { value: string; label: string }
export interface MTestimonial { quote: string; author: string; meta: string }
export interface MarketingContent {
  moneyWord: string;
  niche: string;
  offers: { id: number; title: string; description: string; price: string }[];
  /** Hero H1 — tenant override when set, else the money word. */
  headline: string;
  subhead: string;
  /** Optional hero image URL from the tenant. */
  heroImage: string | null;
  features: MFeature[];
  stats: MStat[];
  testimonials: MTestimonial[];
  footerHtml: string;
  steps: { title: string; desc: string }[];
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function marketingContent(tenant: Tenant): MarketingContent {
  const niche = tenant.niche;
  return {
    moneyWord: tenant.moneyWord,
    niche,
    offers: tenant.offers,
    footerHtml: tenant.footerHtml,
    headline: tenant.heroHeadline || titleCase(tenant.moneyWord),
    heroImage: tenant.heroImage,
    subhead:
      tenant.heroSubhead ||
      `High-intent ${niche} customers actively looking — in your exclusive ZIP, delivered daily to your CRM.`,
    features: [
      { icon: "◎", title: "Predictive intent", desc: `Reach ${niche} buyers acting like past closers — before your competitors.` },
      { icon: "⌖", title: "Door-knock lists", desc: "Optimized address lists so your crews waste zero doors." },
      { icon: "↻", title: "CRM webhooks", desc: "Leads flow straight into HubSpot, GoHighLevel, or any CRM." },
      { icon: "◆", title: "ZIP exclusivity", desc: "Lock your territory — exclusives and first right of refusal." },
      { icon: "⏱", title: "5-year lookback", desc: "Retrospective data refreshed daily, weekly, and monthly." },
      { icon: "✦", title: "Done-for-you booking", desc: "We email and book appointments straight onto your calendar." },
    ],
    stats: [
      { value: "12,000+", label: `${niche} leads / mo` },
      { value: "5 yrs", label: "retrospective data" },
      { value: "Exclusive", label: "by ZIP" },
      { value: "4.9★", label: "from operators" },
    ],
    testimonials: [
      { quote: "Our close rate doubled in 60 days. Exclusive ZIPs mean no more bidding wars.", author: "Mike R.", meta: "Apex — 340 jobs/yr" },
      { quote: "The door-knock lists save my crew hours every single day.", author: "Dana K.", meta: "Summit Exteriors" },
      { quote: "Best leads we've ever bought — the intent data is the real deal.", author: "Luis P.", meta: "Peak Contractors" },
    ],
    steps: [
      { title: "Create your account", desc: "Sign up free and get $50 in lead credits — no card required." },
      { title: "Pick your ZIP & filters", desc: "Choose territory, demographics, segment, and recency." },
      { title: "Buy & receive leads", desc: "Spend credits on high-intent leads; full contact unlocks instantly." },
      { title: "Work them & close", desc: "Track status, conversions, and sales — auto-pushed to your CRM." },
    ],
  };
}
