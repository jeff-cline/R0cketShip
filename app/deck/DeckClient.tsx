"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import RsHub from "@/app/_components/RsHub";
import { FilmThumb } from "@/app/_components/FilmModal";

const O = "#F5821F", INK = "#f4f5f7", MUT = "#8b93a1", BLACK = "#0a0a0b", CHAR = "#141519", LINE = "#26282f";
const disp = "var(--font-display), 'Plus Jakarta Sans', -apple-system, Segoe UI, sans-serif";
const serif = "var(--font-serif), 'Fraunces', Georgia, serif";

const Tag = ({ kind }: { kind: "VERIFIED" | "CALCULATED" | "ILLUSTRATIVE" }) => {
  const c = kind === "VERIFIED" ? "#3ecf8e" : kind === "CALCULATED" ? "#5aa9ff" : "#ffb454";
  return <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", color: c, border: `1px solid ${c}44`, borderRadius: 100, padding: "3px 9px", textTransform: "uppercase" }}>{kind === "ILLUSTRATIVE" ? "Illustrative scenario" : kind === "CALCULATED" ? "Calculated from verified facts" : "Verified fact"}</span>;
};
const Eyebrow = ({ children }: { children: React.ReactNode }) => <div style={{ color: O, fontWeight: 800, letterSpacing: ".24em", textTransform: "uppercase", fontSize: 12 }}>{children}</div>;
const H = ({ children, size = 56 }: { children: React.ReactNode; size?: number }) => <h2 style={{ color: INK, fontFamily: disp, fontWeight: 800, fontSize: `clamp(30px, ${size / 10}vw, ${size}px)`, lineHeight: 1.02, letterSpacing: "-.025em", margin: "14px 0 0", textWrap: "balance" as const }}>{children}</h2>;
const P = ({ children }: { children: React.ReactNode }) => <p style={{ color: "#c7ccd6", fontSize: "clamp(15px,1.8vw,19px)", lineHeight: 1.65, marginTop: 18, maxWidth: 660 }}>{children}</p>;
const Hl = ({ children }: { children: React.ReactNode }) => <b style={{ color: O }}>{children}</b>;
const Src = ({ children }: { children: React.ReactNode }) => <div style={{ color: MUT, fontSize: 12, marginTop: 18, maxWidth: 660 }}>{children}</div>;

function useCountUp(target: number, run: boolean, dur = 1100) {
  const [n, setN] = useState(0); const raf = useRef(0);
  useEffect(() => { if (!run) return; const start = performance.now(); const tick = (t: number) => { const p = Math.min(1, (t - start) / dur); setN(target * (1 - Math.pow(1 - p, 3))); if (p < 1) raf.current = requestAnimationFrame(tick); }; raf.current = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf.current); }, [run, target, dur]);
  return n;
}
function BigCount({ target, suffix, run }: { target: number; suffix: string; run: boolean }) {
  const n = useCountUp(target, run);
  const fmt = target >= 1e6 ? (n / 1e6).toFixed(1) + "M" : Math.round(n).toLocaleString();
  return <div style={{ fontFamily: disp, fontWeight: 800, fontSize: "clamp(48px,10vw,120px)", color: O, lineHeight: 1, letterSpacing: "-.03em" }}>{fmt}<span style={{ fontSize: ".4em", color: MUT }}>{suffix}</span></div>;
}

function TwoCurves() {
  const gdp = [100, 109.8, 117.2, 123.5, 129.7], ad = [100, 110.2, 124.7, 141.9, 155.6], yrs = [2021, 2022, 2023, 2024, 2025];
  const W = 560, Hh = 300, pad = 40, max = 165;
  const x = (i: number) => pad + (i / 4) * (W - pad * 2), y = (v: number) => Hh - pad - ((v - 90) / (max - 90)) * (Hh - pad * 2);
  const path = (a: number[]) => a.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <svg viewBox={`0 0 ${W} ${Hh}`} style={{ width: "100%" }}>
        {[100, 120, 140, 160].map((g) => <g key={g}><line x1={pad} x2={W - pad} y1={y(g)} y2={y(g)} stroke={LINE} /><text x={pad - 8} y={y(g) + 4} fill={MUT} fontSize="11" textAnchor="end">{g}</text></g>)}
        {yrs.map((yr, i) => <text key={yr} x={x(i)} y={Hh - 14} fill={MUT} fontSize="11" textAnchor="middle">{yr}</text>)}
        <path d={path(gdp)} fill="none" stroke="#5aa9ff" strokeWidth="3" strokeLinecap="round" style={{ strokeDasharray: 1200, strokeDashoffset: 1200, animation: "rsDraw 1.6s ease forwards" }} />
        <path d={path(ad)} fill="none" stroke={O} strokeWidth="3.5" strokeLinecap="round" style={{ strokeDasharray: 1200, strokeDashoffset: 1200, animation: "rsDraw 1.6s ease .3s forwards" }} />
        <circle cx={x(4)} cy={y(129.7)} r="4" fill="#5aa9ff" /><circle cx={x(4)} cy={y(155.6)} r="4.5" fill={O} />
        <text x={x(4) - 6} y={y(129.7) - 8} fill="#5aa9ff" fontSize="12" fontWeight="700" textAnchor="end">GDP 129.7</text>
        <text x={x(4) - 6} y={y(155.6) - 8} fill={O} fontSize="12" fontWeight="800" textAnchor="end">Ad spend 155.6</text>
        <style>{`@keyframes rsDraw{to{stroke-dashoffset:0}}`}</style>
      </svg>
      <div style={{ display: "flex", gap: 18, marginTop: 8, fontSize: 12.5 }}><span style={{ color: "#5aa9ff" }}>● U.S. nominal GDP</span><span style={{ color: O }}>● U.S. digital advertising</span><span style={{ color: MUT }}>Indexed, 2021 = 100</span></div>
    </div>
  );
}
function Flywheel() {
  const steps = ["Acquire company", "Gain touchpoints", "Generate signals", "Enrich intelligence", "Improve prediction", "Lower acquisition cost", "Raise LTV & EBITDA", "Raise enterprise value", "Expand acquisition capacity"];
  const R = 41;
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 480, aspectRatio: "1/1", margin: "0 auto" }}>
      <div style={{ position: "absolute", inset: 0, animation: "rsSpin 60s linear infinite" }}>
        {steps.map((s, i) => { const a = (i / steps.length) * 2 * Math.PI - Math.PI / 2, x = 50 + R * Math.cos(a), y = 50 + R * Math.sin(a);
          return <div key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", width: 116, textAlign: "center", animation: "rsSpinR 60s linear infinite" }}>
            <div style={{ width: 26, height: 26, margin: "0 auto 5px", borderRadius: "50%", background: O, color: "#000", fontWeight: 800, display: "grid", placeItems: "center", fontSize: 13 }}>{i + 1}</div>
            <div style={{ fontSize: 11.5, color: "#c7ccd6", lineHeight: 1.25 }}>{s}</div></div>; })}
      </div>
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 130, height: 130, borderRadius: "50%", border: `2px solid ${O}44`, display: "grid", placeItems: "center" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 30 }}>🚀</div><div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", color: O, textTransform: "uppercase" }}>The flywheel</div></div></div>
      <style>{`@keyframes rsSpin{to{transform:rotate(360deg)}}@keyframes rsSpinR{to{transform:rotate(-360deg)}}`}</style>
    </div>
  );
}
function Calculator() {
  const [rev, setRev] = useState(250), [spend, setSpend] = useState(50), [eff, setEff] = useState(15), [mult, setMult] = useState(8);
  const fmt = (n: number) => "$" + (n >= 1000 ? (n / 1000).toFixed(2) + "B" : n.toFixed(1) + "M");
  const savings = spend * (eff / 100), evCreated = savings * mult;
  const Slider = ({ label, v, set, min, max, step, suffix }: { label: string; v: number; set: (n: number) => void; min: number; max: number; step: number; suffix: string }) => (
    <label style={{ display: "block", marginBottom: 14 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: MUT }}><span>{label}</span><b style={{ color: INK }}>{v}{suffix}</b></div><input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(+e.target.value)} style={{ width: "100%", accentColor: O }} /></label>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26, width: "100%", maxWidth: 740 }} className="rs-calc">
      <div><Slider label="Combined portfolio revenue" v={rev} set={setRev} min={10} max={2000} step={10} suffix="M" /><Slider label="Annual acquisition spend" v={spend} set={setSpend} min={5} max={400} step={5} suffix="M" /><Slider label="Acquisition efficiency gain" v={eff} set={setEff} min={0} max={30} step={1} suffix="%" /><Slider label="Valuation multiple" v={mult} set={setMult} min={4} max={20} step={1} suffix="×" /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
        {[["Annual acquisition savings", fmt(savings)], ["Incremental EBITDA", fmt(savings)], ["Accretive portfolio value", fmt(evCreated)]].map(([l, v], i) => (
          <div key={l} style={{ background: CHAR, border: `1px solid ${LINE}`, borderRadius: 14, padding: "16px 18px" }}><div style={{ fontSize: 12, color: MUT }}>{l}</div><div style={{ fontSize: i === 2 ? 36 : 28, fontWeight: 800, color: i === 2 ? O : INK, fontFamily: disp }}>{v}</div></div>
        ))}
        <div><Tag kind="ILLUSTRATIVE" /></div>
      </div>
    </div>
  );
}
function Moat() {
  const rings = ["Acquisition pipeline", "Capital", "Brands & distribution", "Technology", "Cross-industry insight", "Predictive models", "Interaction history", "First-party signals", "Customer relationships"];
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 440, aspectRatio: "1/1", margin: "0 auto" }}>
      {rings.map((r, i) => { const size = 100 - i * 10; return (
        <div key={i} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: `${size}%`, height: `${size}%`, borderRadius: "50%", border: `1px solid ${O}55`, background: i === rings.length - 1 ? "#F5821F18" : "transparent", display: "grid", placeItems: i === rings.length - 1 ? "center" : "start" }}>
          {i === rings.length - 1 ? <div style={{ textAlign: "center", fontSize: 11.5, color: O, fontWeight: 700 }}>Customer<br />relationships</div> : <div style={{ fontSize: 10, color: MUT, marginTop: 3, marginLeft: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>{r}</div>}
        </div>); })}
    </div>
  );
}

type Scene = { render: (active: boolean) => React.ReactNode };
const SCENES: Scene[] = [
  { render: () => (
    <div style={{ textAlign: "center" }}>
      <RsHub big />
      <div style={{ marginTop: 22, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", fontSize: 11.5, color: MUT }}>
        <span><b style={{ color: "#c7ccd6" }}>Channels in</b></span><span>→</span><span><b style={{ color: "#c7ccd6" }}>Portfolio</b></span><span>→</span><span><b style={{ color: "#c7ccd6" }}>Capture</b></span><span>→</span><span><b style={{ color: O }}>Intelligence</b></span><span>→</span><span>🚀 back out to companies</span>
      </div>
      <div style={{ marginTop: 16 }}><Eyebrow>R0cketShip Holdings</Eyebrow></div>
      <H size={46}>A commercial-intelligence holding company.</H>
      <P>Signal flows in from our <Hl>portfolio &amp; JV companies</Hl> and the outside world, is captured by our engagement brands, resolved by <Hl>Predictive Data</Hl> and the <Hl>MEDIGAP AI GPT engine</Hl>, then sent <Hl>back out as predictions</Hl> that lift sales — without new spend.</P>
    </div>
  ) },
  { render: () => (
    <div>
      <Eyebrow>Scene 1 · The macro signal</Eyebrow>
      <H>The economy grew. <Hl>Customer acquisition grew faster.</Hl></H>
      <div style={{ marginTop: 22 }}><TwoCurves /></div>
      <div style={{ marginTop: 14 }}><Tag kind="VERIFIED" /></div>
      <Src>U.S. nominal GDP +~29.7% (2021→2025); U.S. digital advertising +~55.6%. Customer intelligence is compounding into one of the most valuable economic assets. Sources: BEA / FRED · IAB / PwC (verify before publication).</Src>
    </div>
  ) },
  { render: () => (
    <div style={{ maxWidth: 740 }}>
      <Eyebrow>Scene 2 · The $294.6B river</Eyebrow>
      <H>The modern enterprise <Hl>rents</Hl> its customer intelligence.</H>
      <P>~<Hl>$294.6B</Hl> flows each year from businesses into search, social, retail media, video, data, adtech and martech — buying access to intelligence and distribution they never keep.</P>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18, maxWidth: 640 }}>{["Search", "Social", "Retail media", "Video", "Data brokers", "AdTech", "MarTech", "Attribution"].map((s) => <span key={s} style={{ background: CHAR, border: `1px solid ${LINE}`, borderRadius: 100, padding: "7px 14px", color: MUT, fontSize: 13 }}>{s} →</span>)}</div>
      <P><b style={{ color: INK }}>What if more of that intelligence lived inside the ecosystem?</b></P>
    </div>
  ) },
  { render: (a) => (
    <div style={{ textAlign: "center" }}>
      <Eyebrow>Scene 3 · Many entry points</Eyebrow>
      <H>Every acquisition <Hl>expands the intelligence network.</Hl></H>
      <div style={{ marginTop: 24 }}><BigCount target={50} suffix=" companies" run={a} /></div>
      <P>1 → 5 → 10 → 25 → 50 portfolio and partner companies. One company creates revenue. <Hl>A network creates intelligence.</Hl></P>
    </div>
  ) },
  { render: () => (
    <div style={{ textAlign: "center" }}>
      <Eyebrow>Scene 4 · Unique data</Eyebrow>
      <H>The value isn’t the database. <Hl>It’s unique data.</Hl></H>
      <div style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "center", flexWrap: "wrap", marginTop: 18 }}>
        <div style={{ flex: "1 1 340px", maxWidth: 460 }}><RsHub /></div>
        <div style={{ flex: "0 1 330px", textAlign: "left", background: CHAR, border: `1px solid ${LINE}`, borderRadius: 16, padding: 22 }}>
          <div style={{ color: O, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", fontSize: 12 }}>Unique data creates</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: INK, marginTop: 8, lineHeight: 1.2 }}>Actionable High-Intent Targeting <span style={{ color: O }}>(HITS)</span></div>
          <ul style={{ color: "#c7ccd6", lineHeight: 1.9, marginTop: 12, paddingLeft: 18, fontSize: 14.5 }}>
            <li>Reduces <b style={{ color: INK }}>CPA</b> &amp; operational strain</li>
            <li><b style={{ color: "#3ecf8e" }}>+</b> Increases profit</li>
            <li><b style={{ color: "#3ecf8e" }}>+</b> Adds accretive value to the network &amp; portfolio companies</li>
          </ul>
        </div>
      </div>
    </div>
  ) },
  { render: (a) => (
    <div style={{ textAlign: "center" }}>
      <Eyebrow>Scene 5 · Data compounding</Eyebrow>
      <H>Every transaction makes the network <Hl>smarter.</Hl></H>
      <div style={{ marginTop: 24 }}><BigCount target={50e6} suffix=" signals" run={a} /></div>
      <P>One interaction becomes thousands, then millions. More signals → better models → better prediction → more relevant engagement → more transactions → more signals.</P>
    </div>
  ) },
  { render: () => (
    <div style={{ textAlign: "center" }}>
      <Eyebrow>Scene 6 · The commercial-intelligence flywheel</Eyebrow>
      <H>Acquire. Capture. Predict. <Hl>Compound.</Hl></H>
      <div style={{ marginTop: 18 }}><Flywheel /></div>
    </div>
  ) },
  { render: () => (
    <div>
      <Eyebrow>Scene 7 · Portfolio economics</Eyebrow>
      <H>Data efficiency can become <Hl>accretive value.</Hl></H>
      <P>An illustrative strategic model — not historical performance. Move the inputs.</P>
      <div style={{ marginTop: 16 }}><Calculator /></div>
    </div>
  ) },
  { render: () => (
    <div style={{ maxWidth: 780 }}>
      <Eyebrow>Scene 8 · The EBITDA bridge</Eyebrow>
      <H>From existing EBITDA to <Hl>R0cketShip-enhanced EBITDA.</Hl></H>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 26, height: 200 }}>
        {[["Existing", 60, MUT], ["+ Efficiency", 12, O], ["+ Cross-sell", 10, O], ["+ Conversion", 9, O], ["+ Retention", 8, O], ["+ Shared tech", 7, O], ["Enhanced", 106, "#3ecf8e"]].map(([l, h, c], i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}><div style={{ height: (h as number) / 106 * 180, background: c as string, borderRadius: "6px 6px 0 0", opacity: i === 0 || i === 6 ? 1 : .82 }} /><div style={{ fontSize: 10.5, color: MUT, marginTop: 6 }}>{l as string}</div></div>
        ))}
      </div>
      <P>Enhanced EBITDA × market multiple = enterprise value. <Tag kind="ILLUSTRATIVE" /></P>
    </div>
  ) },
  { render: () => (
    <div style={{ maxWidth: 860, textAlign: "center", margin: "0 auto" }}>
      <Eyebrow>Scene 9 · From competitor to acquirer</Eyebrow>
      <H>The ultimate advantage isn’t cheaper advertising. <Hl>It’s greater acquisition capacity.</Hl></H>
      <P>Structurally better customer economics → higher margins, higher enterprise value, and the capital to consolidate an industry. The enabled company stops competing and starts <Hl>acquiring</Hl>.</P>
    </div>
  ) },
  { render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 840 }} className="rs-two">
      <div style={{ background: "#1a1210", border: `1px solid ${LINE}`, borderRadius: 16, padding: 24 }}><div style={{ color: "#ff6a4d", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", fontSize: 12 }}>The rented economy</div><ul style={{ color: MUT, lineHeight: 2, marginTop: 12, paddingLeft: 18, fontSize: 14.5 }}><li>Pay the platform</li><li>Rent the audience</li><li>Generate one transaction</li><li>Lose the intelligence</li><li>Repeat — from scratch</li></ul></div>
      <div style={{ background: "#0f1a14", border: `1px solid #3ecf8e33`, borderRadius: 16, padding: 24 }}><div style={{ color: "#3ecf8e", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", fontSize: 12 }}>The owned-intelligence economy</div><ul style={{ color: "#c7ccd6", lineHeight: 2, marginTop: 12, paddingLeft: 18, fontSize: 14.5 }}><li>Own the relationship</li><li>Generate the signal</li><li>Improve the model</li><li>Reuse the intelligence</li><li>Compound the knowledge</li></ul></div>
      <div style={{ gridColumn: "1 / -1", textAlign: "center" }}><H size={40}>Stop renting every customer <Hl>from scratch.</Hl></H></div>
    </div>
  ) },
  { render: () => (
    <div style={{ textAlign: "center" }}>
      <Eyebrow>Scene 10 · The moat</Eyebrow>
      <H>Competitors can buy software. <Hl>They can’t recreate the network.</Hl></H>
      <div style={{ marginTop: 22 }}><Moat /></div>
      <p style={{ color: "#c7ccd6", fontSize: 16, lineHeight: 1.6, margin: "18px auto 0", maxWidth: 620 }}>In fact, they do come — and they <b style={{ color: O }}>pay us SaaS fees</b>, creating more shareholder value.</p>
    </div>
  ) },
  { render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(24px,4vw,52px)", alignItems: "center", justifyContent: "center", maxWidth: 1060, margin: "0 auto", textAlign: "left" }}>
      <div style={{ flex: "1 1 440px", maxWidth: 560, minWidth: 300 }}>
        <Eyebrow>Scene 11 · Activated network</Eyebrow>
        <H size={44}>Joint ventures &amp; strategic partners — <Hl>already live.</Hl></H>
        <p style={{ color: "#c7ccd6", fontSize: 16, lineHeight: 1.5, marginTop: 12 }}>Providing disruptive impact across every active industry.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>{["Quuik", "siimpler", "el.ag", "medigap.ai", "predictivedata.org", "R0cketShip Holdings"].map((b) => <span key={b} style={{ background: CHAR, border: `1px solid ${O}55`, color: INK, borderRadius: 100, padding: "8px 16px", fontWeight: 700, fontSize: 14 }}>{b}</span>)}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>{["Healthcare", "Insurance", "Real Estate", "Finance & Capital", "Media & Data", "Education", "Consumer", "Travel"].map((c) => <span key={c} style={{ border: `1px solid ${LINE}`, color: MUT, borderRadius: 100, padding: "6px 13px", fontSize: 12.5 }}>{c}</span>)}</div>
        <div style={{ marginTop: 22, fontFamily: disp, fontWeight: 800, fontSize: "clamp(20px,3vw,30px)", color: INK }}>Target: <span style={{ color: O }}>400 joint ventures, businesses &amp; strategic partners.</span></div>
      </div>
      <div style={{ flex: "1 1 380px", maxWidth: 520, minWidth: 280, display: "flex", flexDirection: "column", alignItems: "stretch", gap: 16 }}>
        <FilmThumb videoId="IDe0jhB00Jw" label="Watch the film" />
        <button onClick={() => window.dispatchEvent(new CustomEvent("rsGoScene", { detail: 0 }))} style={{ alignSelf: "center", background: "transparent", color: INK, fontWeight: 700, fontSize: 14.5, border: `1px solid ${LINE}`, borderRadius: 100, padding: "12px 24px", cursor: "pointer" }}>← Back to the interactive deck</button>
      </div>
    </div>
  ) },
  { render: () => (
    <div style={{ maxWidth: 800, textAlign: "center", margin: "0 auto" }}>
      <Eyebrow>Scene 12 · The R0cketShip equation</Eyebrow>
      <div style={{ fontFamily: serif, fontSize: "clamp(19px,2.5vw,28px)", lineHeight: 1.5, marginTop: 24, color: INK }}>More companies × more interactions × more proprietary signals × better prediction × lower acquisition cost × higher LTV <span style={{ color: O }}>= higher EBITDA.</span><div style={{ marginTop: 10 }}>Higher EBITDA × multiple <span style={{ color: O }}>= greater enterprise value.</span></div><div style={{ marginTop: 10 }}>Greater enterprise value + capital <span style={{ color: O }}>= more acquisitions.</span></div><div style={{ color: MUT, fontSize: 15, marginTop: 14 }}>↺ loop back to more companies.</div></div>
    </div>
  ) },
  { render: () => (
    <div style={{ textAlign: "center", maxWidth: 820, margin: "0 auto" }}>
      <div style={{ color: MUT, letterSpacing: ".2em", textTransform: "uppercase", fontSize: 12 }}>The trillion-dollar question</div>
      <H size={44}>What percentage of customer-acquisition value could eventually be <Hl>retained inside an owned commercial ecosystem?</Hl></H>
      <P>We do not offer an unsupported answer. We offer the architecture to find out.</P>
    </div>
  ) },
  { render: () => (
    <div style={{ textAlign: "center", maxWidth: 860, margin: "0 auto" }}>
      <div style={{ fontSize: 40 }}>🚀</div>
      <H size={48}>The world built platforms that monetize businesses.</H>
      <div style={{ fontFamily: disp, fontWeight: 800, fontSize: "clamp(22px,3.4vw,40px)", color: O, marginTop: 14, lineHeight: 1.08 }}>R0cketShip builds businesses that monetize the intelligence between them.</div>
      <P>Own the relationship. Own the intelligence. Compound the value.</P>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}><a href="/opportunity" style={{ background: O, color: "#000", fontWeight: 800, textDecoration: "none", borderRadius: 100, padding: "14px 28px" }}>Request access →</a><a href="/roadmap" style={{ background: "transparent", color: INK, fontWeight: 700, textDecoration: "none", border: `1px solid ${LINE}`, borderRadius: 100, padding: "14px 28px" }}>See the portfolio</a></div>
    </div>
  ) },
];

export default function DeckClient() {
  const [i, setI] = useState(0);
  const go = useCallback((d: number) => setI((p) => Math.max(0, Math.min(SCENES.length - 1, p + d))), []);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "ArrowRight" || e.key === " ") go(1); if (e.key === "ArrowLeft") go(-1); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [go]);
  useEffect(() => { const g = (e: Event) => { const d = (e as CustomEvent).detail; if (typeof d === "number") setI(d); }; window.addEventListener("rsGoScene", g); return () => window.removeEventListener("rsGoScene", g); }, []);
  return (
    <div style={{ height: "100dvh", minHeight: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: `radial-gradient(1200px 700px at 50% -20%, #1a1206, ${BLACK})`, color: INK, fontFamily: "var(--font-body), Inter, -apple-system, sans-serif" }}>
      <div style={{ height: 3, background: LINE, flex: "0 0 auto" }}><div style={{ height: "100%", background: O, width: `${((i + 1) / SCENES.length) * 100}%`, transition: "width .3s" }} /></div>
      <header style={{ flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px" }}>
        <a href="/artlab" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: INK, fontWeight: 800, fontFamily: disp }}>🚀 R0cketShip</a>
        <a href="/presentation" style={{ display: "inline-flex", alignItems: "center", gap: 7, border: `1px solid ${LINE}`, color: INK, borderRadius: 100, padding: "7px 14px", fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>▶ Watch the film</a>
      </header>
      <main style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "22px 22px 40px" }}>
        <div style={{ width: "100%", maxWidth: 1000, display: "flex", justifyContent: "center" }}>{SCENES[i].render(true)}</div>
      </main>
      <div style={{ position: "relative", flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "12px 18px", borderTop: `1px solid ${LINE}` }}>
        <button onClick={() => go(-1)} disabled={i === 0} style={navBtn(i === 0)}>‹</button>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", maxWidth: 320, justifyContent: "center" }}>{SCENES.map((_, k) => <button key={k} onClick={() => setI(k)} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 100, border: "none", background: k === i ? O : "#3a3d46", cursor: "pointer", padding: 0, transition: "width .2s" }} />)}</div>
        <button onClick={() => go(1)} disabled={i === SCENES.length - 1} style={navBtn(i === SCENES.length - 1)}>›</button>
        <span style={{ position: "absolute", right: 18, color: MUT, fontSize: 12 }} className="rs-count">{i + 1} / {SCENES.length}</span>
      </div>
      <style>{`@media (max-width:760px){ .rs-calc{grid-template-columns:1fr !important} .rs-two{grid-template-columns:1fr !important} .rs-count{display:none} }`}</style>
    </div>
  );
}
function navBtn(dis: boolean): React.CSSProperties { return { background: CHAR, border: `1px solid ${LINE}`, color: dis ? "#3a3d46" : INK, borderRadius: 100, width: 46, height: 46, fontSize: 22, cursor: dis ? "default" : "pointer", opacity: dis ? .5 : 1 }; }
