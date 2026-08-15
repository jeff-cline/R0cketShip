import { COLORS } from "./shared";

export type Source = {
  n: number;
  title: string;
  publisher: string;
  url: string;
  year: string;
};

export const sources: Source[] = [
  {
    n: 1,
    title: "The ROI of Email Marketing (industry research, $36 / $1 average)",
    publisher: "Litmus",
    year: "2024–2025",
    url: "https://www.litmus.com/resources/email-marketing-roi",
  },
  {
    n: 2,
    title: "The economic potential of generative AI: the next productivity frontier ($2.6T–$4.4T annual; 75% of value in marketing/sales, customer ops, engineering, R&D)",
    publisher: "McKinsey & Company",
    year: "2024",
    url: "https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier",
  },
  {
    n: 3,
    title: "The value of getting personalization right — or wrong — is multiplying (5–15% revenue lift, up to 50% lower CAC, 10–30% better marketing ROI)",
    publisher: "McKinsey & Company",
    year: "2023–2024",
    url: "https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights/the-value-of-getting-personalization-right-or-wrong-is-multiplying",
  },
  {
    n: 4,
    title: "B2B cost-per-lead benchmarks by channel and industry (Google $70, LinkedIn $110 averages)",
    publisher: "Sopro / WordStream benchmark synthesis",
    year: "2025",
    url: "https://sopro.io/resources/blog/b2b-cost-per-lead-benchmarks/",
  },
  {
    n: 5,
    title: "2025 Small Business Profile — 36.2M US small businesses, 43.5% of GDP, 9 in 10 net new jobs",
    publisher: "U.S. SBA Office of Advocacy",
    year: "2025",
    url: "https://advocacy.sba.gov/2025/06/30/new-advocacy-report-shows-the-number-of-small-businesses-in-the-u-s-exceeds-36-million/",
  },
  {
    n: 6,
    title: "Marketing Technology (MarTech) Market — $557B (2025), projected to USD 3.28T by 2035",
    publisher: "Precedence Research",
    year: "2025",
    url: "https://www.precedenceresearch.com/marketing-technology-market",
  },
  {
    n: 7,
    title: "Ad spend wasted on invalid traffic worldwide ($72B+ by 2024)",
    publisher: "Statista (industry research)",
    year: "2024",
    url: "https://www.statista.com/statistics/1440980/ad-spend-lost-invalid-traffic-worldwide/",
  },
  {
    n: 8,
    title: "Intent data in B2B — 25–35% higher conversion, 30–40% shorter sales cycles, 35–50% lift in win rate from early outreach",
    publisher: "The Insight Collective (synthesis of TrustRadius, Demand Gen Report, Forrester)",
    year: "2025",
    url: "https://www.theinsightcollective.com/insights/b2b-intent-data-statistics",
  },
  {
    n: 9,
    title: "HubSpot 2025 State of Sales — 91% report stable/improving win rates, 68% see lead quality up YoY, AI-augmented teams pull ahead",
    publisher: "HubSpot",
    year: "2025",
    url: "https://blog.hubspot.com/sales/hubspot-sales-strategy-report",
  },
  {
    n: 10,
    title: "B2B email marketing benchmarks — top-quartile programs hit 50%+ open rates and 10%+ CTR via AI personalization",
    publisher: "Verified.email benchmark report",
    year: "2025–2030 forecast",
    url: "https://verified.email/blog/email-marketing/b2b-statistics-benchmarks-forecast-2026-2030",
  },
  {
    n: 11,
    title: "CAN-SPAM Act of 2003 — Federal commercial-email compliance baseline (15 U.S.C. §§ 7701–7713)",
    publisher: "U.S. Federal Trade Commission",
    year: "current",
    url: "https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business",
  },
  {
    n: 12,
    title: "TCPA — Telephone Consumer Protection Act enforcement & consent requirements (47 U.S.C. § 227)",
    publisher: "U.S. Federal Communications Commission",
    year: "current",
    url: "https://www.fcc.gov/general/telemarketing-and-robocalls",
  },
];

export function SourcesList() {
  return (
    <div className="mx-auto max-w-4xl">
      <h3 className="text-2xl font-black tracking-tight" style={{ color: COLORS.ink, letterSpacing: "-0.01em" }}>
        Sources & citations
      </h3>
      <p className="mt-2 text-sm" style={{ color: COLORS.ink3 }}>
        Every statistic on this page maps to one of the references below. Where ranges are quoted, the page picks the median.
      </p>
      <ol className="mt-6 space-y-3 text-sm">
        {sources.map((s) => (
          <li key={s.n} id={`src-${s.n}`} className="flex gap-3 leading-relaxed">
            <span className="font-black flex-shrink-0" style={{ color: COLORS.accent, minWidth: 28 }}>
              [{s.n}]
            </span>
            <span style={{ color: COLORS.ink2 }}>
              <strong style={{ color: COLORS.ink }}>{s.publisher}</strong> ({s.year}). {s.title}.{" "}
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: COLORS.sky, wordBreak: "break-word" }}
              >
                {s.url}
              </a>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
