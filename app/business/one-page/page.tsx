import { Shell, Eyebrow, H1, H2, P, Lead, Hl, Stats, EconomicLayers, BasisPoints, IntelligenceDividend, O, INK, MUT } from "../ui";
import AskButton from "../AskButton";
export const metadata = { title: "R0cketShip — One-Page", robots: { index: false } };
export default function Page() {
  return (
    <Shell title="One-Page">
      <Eyebrow>The One-Page</Eyebrow>
      <H1>R0cketShip in one page.</H1>
      <Lead>Own the customer relationship. Own the intelligence between businesses. Compound the value across a permanent-capital portfolio.</Lead>
      <Stats items={[["~$20T", "U.S. commercial economy (our field)"], ["~$405B", "annual U.S. ad spend to disintermediate"], ["$100M+", "targets · $12M EBITDA attached"], ["1+1+1", "= 5 · network accretion"]]} />
      <H2>The economic field</H2>
      <P>We don’t use total GDP. We narrow to the private, commercial, customer-driven economy — the ~<Hl>$20T</Hl> where businesses compete for customers.</P>
      <EconomicLayers />
      <H2>The leverage</H2>
      <P>R0cketShip isn’t trying to capture a slice of $20T in transactions — it builds the intelligence &amp; customer-acquisition infrastructure <i>around</i> them. Every basis point of economic value influenced is enormous:</P>
      <BasisPoints />
      <H2>The disintermediation</H2>
      <P>Businesses pay ~<Hl>$400B/year</Hl> to platforms, data brokers, lead sellers and agencies to acquire customers. Owned inside one ecosystem, that spend shifts from cost toward <Hl>operating profit</Hl> — and the data we build never has to be re-bought. That’s why joining the ecosystem lifts your profit over time.</P>
      <H2>The network dividend</H2>
      <IntelligenceDividend />
      <div style={{ marginTop: 30, textAlign: "center" }}><AskButton /></div>
    </Shell>
  );
}
