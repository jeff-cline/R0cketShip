import { Shell, Eyebrow, H1, H2, P, Hl, EconomicLayers, AdChannels, BasisPoints, MnATable, card, O, INK, MUT, LINE } from "../ui";
import AskButton from "../AskButton";
export const metadata = { title: "R0cketShip — Supporting Data & Citations", robots: { index: false } };
const CITES: [string, string][] = [
  ["U.S. GDP & private-industry share", "BEA (Bureau of Economic Analysis) / FRED — nominal GDP ~$30.5T (2025), 2025 real GDP +2.1%; private industries ~88–89% of GDP; government value-added ~11–12%."],
  ["U.S. advertising — total", "WPP Media — U.S. advertising market ≈ $404.7B (2025)."],
  ["U.S. internet advertising", "IAB / PwC Internet Advertising Revenue Report — $294.6B (2025); social $117.7B (+32.6% YoY), search $114.2B, digital video $78.0B, display $81.6B, commerce/retail media $63.4B."],
  ["Berkshire Hathaway", "Berkshire Hathaway 2025 Annual Report — decentralized model; operating managers retain autonomy; parent focuses on capital allocation."],
  ["Constellation Software", "Constellation Software Q2 2026 results — revenue $3.34B, +17%, growth primarily from acquisitions."],
  ["Palantir", "Palantir — Foundry as a central operating system connecting data, logic and action; the Ontology as a common system across data, analytics and operations."],
  ["M&A precedent", "Adobe/Marketo ≈ $4.75B; Salesforce/Tableau ≈ $15.7B EV; Twilio/Segment ≈ $3.2B; IPG/Acxiom Marketing Solutions ≈ $2.3B (per acquirer disclosures)."],
];
export default function Page() {
  return (
    <Shell title="Supporting Data & Citations">
      <Eyebrow>Supporting Data · Documents · Citations</Eyebrow>
      <H1>The numbers behind the thesis.</H1>
      <P>We don’t claim R0cketShip addresses total GDP. We separate the economy into government vs. the private/commercial economy, then narrow to where businesses actually compete for customers.</P>

      <H2>Three economic layers</H2>
      <EconomicLayers />

      <H2>U.S. advertising channels</H2>
      <P>Of the ~$20T commercial economy, all paid advertising is ≈ <Hl>2.0%</Hl> (~$405B). Digital is ~73% of ad spend and shifting hard in our direction.</P>
      <AdChannels />

      <H2>Basis-point leverage on ~$20T</H2>
      <BasisPoints />

      <H2>What R0cketShip actually attacks</H2>
      <P>Advertising alone is ~$400B/yr, but companies spend across the entire customer-acquisition stack — data → audience → advertising → leads → CRM → sales → conversion → attribution → retention → intelligence. R0cketShip internalizes more of that stack using proprietary first-party/network data. As we spend, our data compounds internally — so we don’t re-buy the same customer’s data next year. That’s the trillion-dollar layer beneath advertising.</P>

      <H2>Precedent: strategic value of actionable data</H2>
      <MnATable />

      <H2>Citations</H2>
      <div style={{ ...card }}>
        {CITES.map(([t, d], i) => <div key={t} style={{ padding: "12px 0", borderTop: i ? `1px solid ${LINE}` : "none" }}><div style={{ color: INK, fontWeight: 700, fontSize: 14 }}>{t}</div><div style={{ color: MUT, fontSize: 13, marginTop: 3, lineHeight: 1.55 }}>{d}</div></div>)}
      </div>
      <P style={{ color: MUT, fontSize: 12.5 }}><b style={{ color: "#ffb454" }}>Note on labels.</b> “Commercial / advertisable economy” (~$20T) is a strategic construction, not an official BEA statistic. Figures are estimates; verify against primary sources before publication. Illustrative scenarios are not historical R0cketShip performance and are not investment advice.</P>
      <div style={{ marginTop: 26, textAlign: "center" }}><AskButton /></div>
    </Shell>
  );
}
