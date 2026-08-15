import { Shell, Eyebrow, H1, H2, P, Lead, Hl, card, MnATable, Flywheel, AcquisitionScore, O, INK, MUT, GREEN, BLUE, LINE } from "../ui";
import AskButton from "../AskButton";
export const metadata = { title: "R0cketShip — Business Plan", robots: { index: false } };
const ASSUMPTIONS: [string, string, string][] = [
  ["Permanent capital", "Acquire without needing to sell on a PE timetable", "Long-duration compounding"],
  ["Technology-enabled HoldCo", "Owns operating assets + centralized tech/IP", "More than a conglomerate"],
  ["Decentralized operations", "Managers stay close to customers", "Berkshire-like autonomy"],
  ["Centralized intelligence", "Data/AI/analytics sit above the businesses", "Portfolio-wide advantage"],
  ["Proprietary data flywheel", "Every business creates new first-party signals", "Platform improves as it grows"],
  ["Cross-portfolio network effects", "Insights in one business improve others", "Acq #10 makes #1–9 stronger"],
  ["Customer-acquisition arbitrage", "Buy inefficient CAC, then improve it", "EBITDA without revenue growth alone"],
  ["First-party data moat", "Owned businesses create permissioned data", "Hard to reproduce"],
  ["Closed-loop attribution", "Marketing → lead → sale → revenue → retention", "Better capital allocation"],
  ["Portfolio-level CAC compression", "Shared audiences reduce incremental CAC", "Margin expansion"],
  ["Multiple arbitrage", "Buy at operating multiples, build platform value", "HoldCo value creation"],
  ["Data accretion", "An acquisition adds EBITDA + proprietary signals", "Different acquisition calculus"],
  ["Strategic accretion", "Score by network contribution, not EBITDA alone", "Small co, outsized ecosystem value"],
  ["Compounding acquisition engine", "EBITDA growth funds future acquisitions", "Self-reinforcing capital cycle"],
];
export default function Page() {
  return (
    <Shell title="Business Plan">
      <Eyebrow>The Business Plan</Eyebrow>
      <H1>Data-accretive M&amp;A: two valuation engines, one intelligence layer.</H1>
      <Lead>R0cketShip is a technology-enabled permanent-capital operating platform that acquires businesses, compounds proprietary commercial intelligence across the portfolio, and uses that intelligence to improve the economics of every company it owns.</Lead>
      <P>The right intellectual comparison is <Hl>Berkshire Hathaway’s permanent-capital architecture + Constellation Software’s acquisition discipline + a proprietary commercial-intelligence platform.</Hl> Berkshire allocates capital across autonomous operators; Constellation has built a decentralized machine acquiring vertical-market software (Q2 2026 revenue $3.34B, +17%, mostly from acquisitions). R0cketShip’s distinction: the parent doesn’t merely allocate capital — it contributes a shared technology/data advantage to every operating company.</P>

      <H2>Traditional HoldCo vs. R0cketShip</H2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }} className="rs-two2">
        <div style={{ ...card, marginTop: 0 }}><div style={{ color: MUT, fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>Berkshire-style</div><P>Capital → acquire → generate cash → reinvest → acquire more.</P></div>
        <div style={{ ...card, marginTop: 0, borderColor: `${O}55` }}><div style={{ color: O, fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>R0cketShip</div><P>Capital → acquire → generate <b style={{ color: GREEN }}>cash + data</b> → feed intelligence layer → improve portfolio → more cash + better data → acquire more.</P></div>
      </div>

      <H2>Business-plan assumptions</H2>
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead><tr>{["Concept", "Logic", "Why investors care"].map((h) => <th key={h} style={{ textAlign: "left", color: MUT, fontSize: 11, textTransform: "uppercase", padding: "11px 14px", background: "#0f1013" }}>{h}</th>)}</tr></thead>
          <tbody>{ASSUMPTIONS.map(([a, b, c]) => <tr key={a}><td style={{ padding: "11px 14px", borderTop: `1px solid ${LINE}`, fontWeight: 700, color: INK }}>{a}</td><td style={{ padding: "11px 14px", borderTop: `1px solid ${LINE}`, color: "#c7ccd6" }}>{b}</td><td style={{ padding: "11px 14px", borderTop: `1px solid ${LINE}`, color: MUT }}>{c}</td></tr>)}</tbody>
        </table>
      </div>

      <H2>Data-Accretive M&amp;A</H2>
      <P>A conventional acquirer asks “how much EBITDA am I buying?” R0cketShip asks: how much EBITDA <b style={{ color: INK }}>+ proprietary data + distribution + customer access + intelligence + cross-portfolio synergy</b> am I buying?</P>
      <div style={{ ...card, textAlign: "center", fontFamily: "var(--font-serif),Georgia,serif", fontSize: "clamp(15px,1.9vw,20px)", color: INK, lineHeight: 1.5 }}>Acquisition Value = Standalone Value + Operating Synergies + Data Synergies + Network Effects + <span style={{ color: O }}>Strategic Option Value</span></div>
      <P>Every target carries <b style={{ color: INK }}>two balance sheets</b>: financial assets, and information assets — the second rarely reflected in GAAP. A $10M-revenue / $2M-EBITDA company also brings ~100,000 customers, transaction history, behavioral signals, a new acquisition channel, industry intelligence, cross-sell, and lower CAC across the network.</P>
      <AcquisitionScore />

      <H2>Synthetic vertical integration</H2>
      <P>Rather than owning manufacturing → distribution → retail, R0cketShip vertically integrates the <Hl>customer economics</Hl>: Data → Intelligence → Audience → Media → Lead → CRM → Conversion → Transaction → Retention → Data. Each transaction’s output becomes the next transaction’s input — and we own the operating companies generating the activity, not just the software.</P>

      <H2>Three valuation lenses</H2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 16 }}>
        {[["1 · HoldCo lens", "Operating subsidiaries on EBITDA / FCF", BLUE], ["2 · Technology-platform lens", "Recurring tech/IP & platform economics on software/data comps", O], ["3 · Strategic-network lens", "Incremental portfolio economics from data, cross-company intelligence & CAC compression", GREEN]].map(([t, d, c]) => <div key={t} style={{ ...card, marginTop: 0 }}><div style={{ color: c as string, fontWeight: 800, fontSize: 13 }}>{t}</div><div style={{ color: "#c7ccd6", fontSize: 13.5, marginTop: 6 }}>{d}</div></div>)}
      </div>
      <P style={{}}><b style={{ color: "#ffb454" }}>Discipline:</b> we never value the same cash flow twice. The defensible argument is that we acquire cash-flow assets at operating-company valuations and use proprietary technology &amp; data to grow their margins, growth and strategic value.</P>

      <H2>Precedent: markets pay for actionable data</H2>
      <MnATable />
      <P style={{ color: MUT, fontSize: 13 }}>These don’t set a multiple for R0cketShip — they show markets repeatedly assign substantial enterprise value to the infrastructure that organizes, connects, analyzes and activates commercial data.</P>

      <H2>The compounding flywheel</H2>
      <Flywheel />
      <div style={{ ...card, marginTop: 30, textAlign: "center", borderColor: `${O}55` }}>
        <div style={{ fontFamily: "var(--font-display),sans-serif", fontSize: "clamp(18px,2.4vw,24px)", fontWeight: 800, color: INK }}>Every acquisition is designed to be simultaneously <span style={{ color: O }}>financially accretive, data accretive, and network accretive.</span></div>
        <div style={{ marginTop: 16 }}><AskButton /></div>
      </div>
      <style>{`@media (max-width:720px){.rs-two2{grid-template-columns:1fr !important}}`}</style>
    </Shell>
  );
}
