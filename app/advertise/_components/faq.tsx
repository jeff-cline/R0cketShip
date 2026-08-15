import { COLORS } from "./shared";

const faqs: Array<{ q: string; a: string }> = [
  {
    q: "What exactly am I paying for?",
    a: "A verified action that meets the KPI you set — typically a qualified inbound lead, a form submission, a booked appointment, or a closed transaction. If the action does not meet the rule, you are not charged. Wallet funds are escrowed and released only against verified events.",
  },
  {
    q: "How fast can I get live?",
    a: "Same-day for the Pay-for-Success offer. Drop a $1,000 minimum deposit, pick a niche, define a KPI rule, and the engine begins targeting. Strategic-partner applications run a 5–10 day diligence cycle before exclusivity is granted.",
  },
  {
    q: "What's the catch on a $5 minimum CPA?",
    a: "It's a floor, not a ceiling. $5 is the lowest you can bid for a simple lead-form action in a high-volume niche. Tier-1 actions (a funded mortgage, a booked roof inspection, a SaaS demo with a qualified buyer) bid higher because they're worth more — but you set the ceiling.",
  },
  {
    q: "How is this not just another lead aggregator?",
    a: "Lead aggregators sell the same lead to 3–7 buyers and call it 'exclusive within your zip.' r0cketship's Strategic Partner tier is one company per industry, period. Pay-for-Success is non-resold actions tied to your campaign ID. The compliance layer is owned by us.",
  },
  {
    q: "Where do the targeted prospects come from?",
    a: "VRTCLS AI is built on proprietary first-party signal collection, public-record enrichment, and licensed intent data. We do not scrape, we do not buy purchased-list spam files. Every channel is run through TCPA / CAN-SPAM / GDPR / CCPA filters before send. We also include our proprietary network of highly active, high-intent, top-quality marketing engines and portals — co-branded, cross-branded, plus our TV, podcast, and social media networks — all powering overall success and optimizing toward your KPI.",
  },
  {
    q: "Who's on the hook for compliance?",
    a: "We are. Suppression lists, consent records, opt-out handling, and DNC scrubbing run on our infrastructure. You see receipts in the dashboard. Your in-house counsel can request the policy pack from your account manager.",
  },
  {
    q: "Can I cap my spend?",
    a: "Yes — daily, weekly, monthly, per-niche, and per-campaign caps. Flights can be paused in one click. Wallet auto-top-up rules are opt-in and revocable.",
  },
  {
    q: "What's the 30% pool reserve?",
    a: "When you fund a wallet, 30% is held as a clearing reserve against pending verified actions (typical action verification window is 7 days). The reserve floats; it's not a fee. Unused reserve becomes spendable as actions clear.",
  },
  {
    q: "How does the 15% / 12-month referral work?",
    a: "Bring another advertiser into r0cketship and you earn 15% of their spend for 12 months — paid into the same wallet you advertise from. No cap on referrals. Affiliate dashboard is included in every account.",
  },
  {
    q: "What if I'm a strategic partner and a competitor applies?",
    a: "They can't. Strategic-partner exclusivity is enforced at the industry classification level (NAICS-mapped) and locked while you're in good standing. We don't run auctions inside an industry that already has a strategic partner.",
  },
  {
    q: "Do I own the data?",
    a: "You own everything you bring in. You receive a license to the actions r0cketship delivers on your campaigns, including contact records (where compliant) and event metadata. Aggregate model improvements remain with VRTCLS AI.",
  },
  {
    q: "What happens to my wallet if I pause indefinitely?",
    a: "Funds remain in your account, fully refundable on request minus any committed obligations to in-flight verified actions. There is no expiration on wallet balance.",
  },
];

export function Faq() {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {faqs.map((f) => (
        <details
          key={f.q}
          className="group rounded-xl border p-5"
          style={{ borderColor: COLORS.hairline, background: COLORS.surface2 }}
        >
          <summary
            className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold"
            style={{ color: COLORS.ink }}
          >
            <span>{f.q}</span>
            <span
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-lg font-black transition-transform group-open:rotate-45"
              style={{ background: `${COLORS.accent}1f`, color: COLORS.accent }}
              aria-hidden
            >
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: COLORS.ink2 }}>
            {f.a}
          </p>
        </details>
      ))}
    </div>
  );
}
