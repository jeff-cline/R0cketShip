import RsHub from "@/app/_components/RsHub";
import AskButton from "./AskButton";
export const O = "#F5821F", INK = "#f4f5f7", MUT = "#9aa2b1", CHAR = "#141519", LINE = "#26282f", GREEN = "#3ecf8e", BLUE = "#5aa9ff";
const disp = "var(--font-display),'Plus Jakarta Sans',sans-serif";

export function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(1200px 700px at 50% -10%, #1a1206, #0a0a0b)", color: INK, fontFamily: "var(--font-body),Inter,sans-serif" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${LINE}`, background: "rgba(10,10,11,.72)", backdropFilter: "blur(8px)" }}>
        <a href="/business" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: INK, fontWeight: 800, fontFamily: disp }}>🚀 R0cketShip <span style={{ color: MUT, fontWeight: 600 }}>· {title}</span></a>
        <AskButton small />
      </header>
      <main style={{ maxWidth: 980, margin: "0 auto", padding: "34px 20px 90px" }}>{children}</main>
      <footer style={{ borderTop: `1px solid ${LINE}`, padding: "18px 20px", textAlign: "center", color: MUT, fontSize: 12 }}>
        <a href="/business" style={{ color: O, textDecoration: "none" }}>← Business overview</a> · Confidential — for private &amp; accredited investors · Not an offering
      </footer>
    </div>
  );
}
export const Eyebrow = ({ children }: { children: React.ReactNode }) => <div style={{ color: O, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", fontSize: 12 }}>{children}</div>;
export const H1 = ({ children }: { children: React.ReactNode }) => <h1 style={{ color: INK, fontFamily: disp, fontWeight: 800, fontSize: "clamp(28px,4.6vw,44px)", lineHeight: 1.05, letterSpacing: "-.02em", margin: "12px 0 0", textWrap: "balance" }}>{children}</h1>;
export const H2 = ({ children }: { children: React.ReactNode }) => <h2 style={{ color: INK, fontFamily: disp, fontWeight: 800, fontSize: "clamp(20px,2.6vw,28px)", margin: "40px 0 0", letterSpacing: "-.01em" }}>{children}</h2>;
export const P = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => <p style={{ color: "#c7ccd6", fontSize: 16, lineHeight: 1.7, marginTop: 14, ...style }}>{children}</p>;
export const Lead = ({ children }: { children: React.ReactNode }) => <p style={{ color: INK, fontSize: "clamp(17px,2vw,21px)", lineHeight: 1.55, marginTop: 16, fontWeight: 500 }}>{children}</p>;
export const Hl = ({ children }: { children: React.ReactNode }) => <b style={{ color: O }}>{children}</b>;
export const card: React.CSSProperties = { background: CHAR, border: `1px solid ${LINE}`, borderRadius: 16, padding: 22, marginTop: 18 };

export function Stats({ items }: { items: [string, string][] }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginTop: 20 }}>
    {items.map(([v, l]) => <div key={l} style={{ ...card, marginTop: 0 }}><div style={{ fontFamily: disp, fontSize: 28, fontWeight: 800, color: O }}>{v}</div><div style={{ color: MUT, fontSize: 12.5, marginTop: 2 }}>{l}</div></div>)}
  </div>;
}
export function Cite({ children }: { children: React.ReactNode }) { return <div style={{ color: MUT, fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}>{children}</div>; }

/* ---- economic layers funnel ---- */
export function EconomicLayers() {
  const rows: [string, string, number, string][] = [
    ["Total U.S. economy (GDP)", "~$30.5T", 100, MUT],
    ["Private-sector economy (~88%)", "~$27.0T", 88, BLUE],
    ["Consumer spending (~68%)", "~$20–21T", 68, "#7c9cff"],
    ["Commercial / customer-driven economy", "~$20T", 66, O],
    ["U.S. advertising (~2% of commercial)", "~$405B", 4, GREEN],
  ];
  return <div style={{ ...card }}>
    {rows.map(([l, v, w, c], i) => <div key={l} style={{ marginTop: i ? 12 : 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 5 }}><span style={{ color: "#c7ccd6" }}>{l}</span><b style={{ color: c }}>{v}</b></div>
      <div style={{ height: 14, background: "#0d0f13", borderRadius: 7, overflow: "hidden" }}><div style={{ width: `${w}%`, height: "100%", background: c, opacity: .85, borderRadius: 7 }} /></div>
    </div>)}
    <Cite>R0cketShip addresses the intelligence &amp; customer-acquisition infrastructure <i>around</i> the ~$20T commercial economy — not a percentage of the transactions themselves. Sources: BEA / FRED (GDP, private-industry share); the “commercial/advertisable economy” is a strategic construction, not an official BEA line.</Cite>
  </div>;
}

/* ---- advertising channels bar chart ---- */
export function AdChannels() {
  const rows: [string, number, string][] = [
    ["All advertising", 2.02, "~$405B"], ["Digital — total", 1.47, "$294.6B"], ["Social media*", 0.59, "$117.7B"],
    ["Paid search*", 0.57, "$114.2B"], ["Digital display*", 0.41, "$81.6B"], ["Digital video*", 0.39, "$78.0B"],
    ["Commerce / retail media*", 0.32, "$63.4B"], ["TV / CTV", 0.37, "~$65–80B"], ["Radio / audio", 0.07, "~$12–15B"], ["News / print", 0.065, "~$10–15B"],
  ];
  const max = 2.2;
  return <div style={{ ...card }}>
    <div style={{ fontSize: 12.5, color: MUT, marginBottom: 12 }}>Approx. annual U.S. ad spend as % of the ~$20T commercial economy. <b style={{ color: "#ffb454" }}>*</b> digital subcategories overlap — don’t sum them.</div>
    {rows.map(([l, v, amt], i) => <div key={l} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: i ? 8 : 0 }}>
      <div style={{ width: 150, fontSize: 12.5, color: "#c7ccd6", textAlign: "right" }}>{l}</div>
      <div style={{ flex: 1, height: 16, background: "#0d0f13", borderRadius: 5, overflow: "hidden" }}><div style={{ width: `${(v / max) * 100}%`, height: "100%", background: i === 0 ? O : i === 1 ? BLUE : "#4b6a99", borderRadius: 5 }} /></div>
      <div style={{ width: 96, fontSize: 12, color: MUT }}><b style={{ color: INK }}>{v}%</b> · {amt}</div>
    </div>)}
    <Cite>2025 estimates. WPP Media ~$404.7B total U.S.; IAB / PwC $294.6B internet advertising (social $117.7B, +32.6% YoY; search $114.2B; display $81.6B; video $78.0B; commerce media $63.4B).</Cite>
  </div>;
}

/* ---- basis-point leverage ---- */
export function BasisPoints() {
  const rows = [["0.01% (1 bp)", "$2B"], ["0.10%", "$20B"], ["1.00%", "$200B"]];
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginTop: 18 }}>
    {rows.map(([p, v]) => <div key={p} style={{ ...card, marginTop: 0, textAlign: "center" }}><div style={{ color: MUT, fontSize: 13 }}>{p} of $20T influenced</div><div style={{ fontFamily: disp, fontSize: 30, fontWeight: 800, color: O }}>{v}</div></div>)}
  </div>;
}

/* ---- portfolio intelligence dividend ---- */
export function IntelligenceDividend() {
  return <div style={{ ...card, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
    <div style={{ flex: "1 1 260px" }}>
      <div style={{ fontWeight: 800, color: INK, fontSize: 17 }}>Portfolio Intelligence Dividend™</div>
      <P>Own 10 companies (~$150M EBITDA). Acquire company #11 at <b style={{ color: INK }}>$10M EBITDA</b>. If its data lifts the other ten by just <b style={{ color: GREEN }}>2%</b>, that’s <b style={{ color: GREEN }}>+$3M</b> — so #11 contributes <Hl>$13M</Hl>, not $10M. Company #12 improves eleven. #20 improves nineteen.</P>
    </div>
    <div style={{ flex: "0 1 220px", textAlign: "center" }}>
      <div style={{ display: "flex", height: 150, alignItems: "flex-end", gap: 14, justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}><div style={{ width: 54, height: 100, background: BLUE, borderRadius: "6px 6px 0 0" }} /><div style={{ fontSize: 11, color: MUT, marginTop: 6 }}>$10M direct</div></div>
        <div style={{ textAlign: "center" }}><div style={{ width: 54, height: 130, background: `linear-gradient(${GREEN} 23%, ${BLUE} 23%)`, borderRadius: "6px 6px 0 0" }} /><div style={{ fontSize: 11, color: GREEN, marginTop: 6 }}>$13M total</div></div>
      </div>
    </div>
  </div>;
}

/* ---- M&A precedent table ---- */
export function MnATable() {
  const rows = [["Adobe → Marketo", "$4.75B", "Marketing automation / engagement"], ["Twilio → Segment", "$3.2B", "Customer-data infrastructure (CDP)"], ["IPG → Acxiom Mktg Solutions", "$2.3B", "Consumer / marketing data"], ["Salesforce → Tableau", "$15.7B EV", "Analytics / data visualization"]];
  return <div style={{ ...card, padding: 0, overflow: "hidden" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead><tr>{["Transaction", "Value", "Strategic asset"].map((h) => <th key={h} style={{ textAlign: "left", color: MUT, fontSize: 11, textTransform: "uppercase", padding: "12px 16px", background: "#0f1013" }}>{h}</th>)}</tr></thead>
      <tbody>{rows.map(([a, v, s]) => <tr key={a}><td style={{ padding: "12px 16px", borderTop: `1px solid ${LINE}`, fontWeight: 700 }}>{a}</td><td style={{ padding: "12px 16px", borderTop: `1px solid ${LINE}`, color: O, fontWeight: 800, whiteSpace: "nowrap" }}>{v}</td><td style={{ padding: "12px 16px", borderTop: `1px solid ${LINE}`, color: "#c7ccd6" }}>{s}</td></tr>)}</tbody>
    </table>
  </div>;
}

/* ---- acquisition score (6 accretion dimensions) ---- */
export function AcquisitionScore() {
  const dims: [string, string][] = [["Financial accretion", "EBITDA / FCF"], ["Data accretion", "Unique proprietary signals"], ["Distribution accretion", "Customers / audience / access"], ["Intelligence accretion", "Better prediction"], ["Network accretion", "Lift to the existing portfolio"], ["Strategic accretion", "New markets / options"]];
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 18 }}>
    {dims.map(([t, d], i) => <div key={t} style={{ ...card, marginTop: 0 }}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><span style={{ width: 22, height: 22, borderRadius: 6, background: O, color: "#000", fontWeight: 800, display: "grid", placeItems: "center", fontSize: 12 }}>{i + 1}</span><b>{t}</b></div><div style={{ color: MUT, fontSize: 13, marginTop: 6 }}>{d}</div></div>)}
  </div>;
}

/* ---- compounding flywheel ---- */
export function Flywheel() {
  const steps = ["Acquire operating company", "+ Revenue · EBITDA · customers · data", "Connect to the intelligence layer", "More proprietary signals", "Better prediction & attribution", "Lower CAC · higher conversion · higher LTV", "Higher portfolio EBITDA", "Higher enterprise value", "Greater acquisition capacity"];
  const R = 41;
  return <div style={{ position: "relative", width: "100%", maxWidth: 480, aspectRatio: "1/1", margin: "18px auto 0" }}>
    <div style={{ position: "absolute", inset: 0, animation: "rsSpin 70s linear infinite" }}>
      {steps.map((s, i) => { const a = (i / steps.length) * 2 * Math.PI - Math.PI / 2, x = 50 + R * Math.cos(a), y = 50 + R * Math.sin(a);
        return <div key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", width: 120, textAlign: "center", animation: "rsSpinR 70s linear infinite" }}>
          <div style={{ width: 24, height: 24, margin: "0 auto 4px", borderRadius: "50%", background: O, color: "#000", fontWeight: 800, display: "grid", placeItems: "center", fontSize: 12 }}>{i + 1}</div>
          <div style={{ fontSize: 11, color: "#c7ccd6", lineHeight: 1.25 }}>{s}</div></div>; })}
    </div>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 128, height: 128, borderRadius: "50%", border: `2px solid ${O}44`, display: "grid", placeItems: "center", textAlign: "center" }}><div><div style={{ fontSize: 28 }}>🚀</div><div style={{ fontSize: 10.5, fontWeight: 800, color: O, textTransform: "uppercase", letterSpacing: ".1em" }}>Compounding<br />flywheel</div></div></div>
    <style>{`@keyframes rsSpin{to{transform:rotate(360deg)}}@keyframes rsSpinR{to{transform:rotate(-360deg)}}`}</style>
  </div>;
}
export { RsHub };
