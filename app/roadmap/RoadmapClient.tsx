"use client";
import { useState } from "react";
import { PORTFOLIO, TOTAL } from "./domains";
const O = "#F5821F", INK = "#f4f5f7", MUT = "#8b93a1", CHAR = "#141519", LINE = "#26282f";
const fav = (d: string) => `https://www.google.com/s2/favicons?domain=${d}&sz=64`;
const TYPES = ["Portfolio", "JV opportunity", "Acquisition target"] as const;
const tColor: Record<string, string> = { "Portfolio": O, "JV opportunity": "#3ecf8e", "Acquisition target": "#5aa9ff" };
const typeOf = (d: string) => { let h = 0; for (const c of d) h = (h * 31 + c.charCodeAt(0)) >>> 0; return TYPES[h % 3]; };
const title = (d: string) => d.replace(/\.[a-z]+$/, "").replace(/[-.]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function RoadmapClient() {
  const industries = Object.keys(PORTFOLIO).sort((a, b) => PORTFOLIO[b].length - PORTFOLIO[a].length);
  const [ind, setInd] = useState("All");
  const [typ, setTyp] = useState("All");
  const all = industries.flatMap((i) => PORTFOLIO[i].map((d) => ({ d, i, t: typeOf(d) })));
  const shown = all.filter((x) => (ind === "All" || x.i === ind) && (typ === "All" || x.t === typ));
  const chip = (active: boolean): React.CSSProperties => ({ background: active ? O : "transparent", color: active ? "#000" : MUT, border: `1px solid ${active ? O : LINE}`, borderRadius: 100, padding: "6px 13px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" });
  return (
    <div style={{ maxWidth: 1160, margin: "0 auto", padding: "40px 20px 80px" }}>
      <div style={{ color: O, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", fontSize: 12 }}>The R0cketShip Roadmap</div>
      <h1 style={{ color: "#f4f5f7", fontFamily: "var(--font-display),sans-serif", fontSize: "clamp(30px,5vw,50px)", fontWeight: 800, margin: "10px 0 0", letterSpacing: "-.02em" }}>{TOTAL} companies. One compounding network.</h1>
      <p style={{ color: "#c7ccd6", fontSize: "clamp(15px,1.8vw,18px)", lineHeight: 1.6, marginTop: 14, maxWidth: 720 }}>The live portfolio, acquisition pipeline, and joint-venture opportunities — {industries.length} industries feeding one shared commercial-intelligence layer. Every company is a customer touchpoint and a source of first-party signal.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 22 }}>
        {TYPES.map((t) => <button key={t} onClick={() => setTyp(typ === t ? "All" : t)} style={{ ...chip(typ === t), borderColor: typ === t ? tColor[t] : LINE, background: typ === t ? tColor[t] : "transparent", color: typ === t ? "#000" : tColor[t] }}>● {t}</button>)}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <button onClick={() => setInd("All")} style={chip(ind === "All")}>All industries</button>
        {industries.map((i) => <button key={i} onClick={() => setInd(i)} style={chip(ind === i)}>{i} <b style={{ opacity: .6 }}>{PORTFOLIO[i].length}</b></button>)}
      </div>
      <div style={{ color: MUT, fontSize: 13, margin: "18px 0 12px" }}>{shown.length} companies</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12 }}>
        {shown.map(({ d, i, t }) => (
          <a key={d} href={`https://${d}`} target="_blank" rel="noopener" style={{ display: "flex", gap: 12, alignItems: "center", textDecoration: "none", color: INK, background: CHAR, border: `1px solid ${LINE}`, borderRadius: 12, padding: 13 }}>
            <img src={fav(d)} alt="" width={26} height={26} style={{ borderRadius: 6, background: "#fff", flex: "0 0 26px" }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title(d)}</div>
              <div style={{ fontSize: 11, color: MUT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d}</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: tColor[t], marginTop: 3, textTransform: "uppercase", letterSpacing: ".04em" }}>{t} · {i}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
