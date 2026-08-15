import { Shell, Eyebrow, H1, H2, P, Lead, Hl, Stats, card, Flywheel, AcquisitionScore, O, INK, MUT, GREEN, BLUE } from "../ui";
import AskButton from "../AskButton";
export const metadata = { title: "R0cketShip — Executive Overview", robots: { index: false } };
export default function Page() {
  return (
    <Shell title="Executive Overview">
      <Eyebrow>Executive Overview</Eyebrow>
      <H1>A technology-enabled permanent-capital compounder built around data-accretive M&amp;A.</H1>
      <Lead>R0cketShip acquires cash-flow businesses, compounds proprietary commercial intelligence across the portfolio, and uses that intelligence to improve the economics of every company it owns — creating two valuation engines at once: operating cash flow, and a higher-multiple technology, data &amp; network layer.</Lead>
      <Stats items={[["Live", "operating companies in-portfolio"], ["Active", "revenue-generating JVs & contracts"], ["$100M+", "acquisition targets identified"], ["$12M", "EBITDA attached to those targets"]]} />
      <H2>The capital goes straight to work</H2>
      <P>The technology is built. The platforms are built. So new capital funds <Hl>the acquisition of EBITDA, unique data, and unique people</Hl> — not R&amp;D. We buy at traditional private-equity multiples and generate EBITDA the traditional way — but every acquisition is <Hl>accretive to the entire network</Hl>: its data unlocks new, shareable revenue streams across our JVs and portfolio companies. That’s a true <b style={{ color: INK }}>1 + 1 + 1 = 5</b> opportunity.</P>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 20 }} className="rs-two2">
        <div style={{ ...card, marginTop: 0 }}><div style={{ color: BLUE, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 12 }}>Engine 1 · Operating value</div><P>Cash-flow &amp; asset value of the operating companies — valued on EBITDA / FCF, Berkshire-style.</P></div>
        <div style={{ ...card, marginTop: 0 }}><div style={{ color: O, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 12 }}>Engine 2 · Intelligence value</div><P>The potentially higher-multiple value of the technology, data &amp; network layer that sits above the portfolio.</P></div>
      </div>
      <H2>The compounding flywheel</H2>
      <P>Capital → acquire business → generate <Hl>cash + data</Hl> → feed the intelligence layer → improve portfolio performance → generate more cash + better data → acquire more businesses. Materially different from a traditional roll-up.</P>
      <Flywheel />
      <H2>Every acquisition is scored on total ecosystem accretion</H2>
      <P>We optimize for <Hl>Total Ecosystem Accretion</Hl>, not standalone financial accretion — a more sophisticated discipline than “we buy at 5× EBITDA.”</P>
      <AcquisitionScore />
      <div style={{ ...card, marginTop: 34, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display),sans-serif", fontSize: 22, fontWeight: 800, color: INK }}>Ready to go deeper?</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 14 }}>
          <a href="/business/one-page" style={{ background: "transparent", color: INK, border: `1px solid ${MUT}`, borderRadius: 100, padding: "12px 22px", textDecoration: "none", fontWeight: 700 }}>One-page →</a>
          <a href="/business/business-plan" style={{ background: "transparent", color: INK, border: `1px solid ${MUT}`, borderRadius: 100, padding: "12px 22px", textDecoration: "none", fontWeight: 700 }}>Business plan →</a>
          <a href="/business/data" style={{ background: "transparent", color: INK, border: `1px solid ${MUT}`, borderRadius: 100, padding: "12px 22px", textDecoration: "none", fontWeight: 700 }}>Data & citations →</a>
        </div>
        <div style={{ marginTop: 14 }}><AskButton /></div>
      </div>
      <style>{`@media (max-width:720px){.rs-two2{grid-template-columns:1fr !important}}`}</style>
    </Shell>
  );
}
