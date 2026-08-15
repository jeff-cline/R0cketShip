"use client";
import { useEffect, useState } from "react";
import { COMPANIES } from "./rshub-data";
/* R0cketShip capture-and-return engine. From the OUTSIDE (TV, radio, hardware, proprietary data,
   digital assets/marketing, social) → into our portfolio companies → captured by Quuik/siimpler →
   resolved by Predictive Data + the MEDIGAP AI GPT engine → sent BACK OUT as predictions. */
const O = "#F5821F", INK = "#f4f5f7", MUT = "#9aa2b1", LINE = "#2a2c34", DARK = "#5b6272";
const fav = (d: string) => `https://www.google.com/s2/favicons?domain=${d}&sz=64`;
const P = (deg: number, r: number) => { const a = deg * Math.PI / 180; return { x: 50 + r * Math.sin(a), y: 50 - r * Math.cos(a) }; };

const CHANNELS = [
  { label: "TV", icon: "📺" }, { label: "Radio", icon: "📻" }, { label: "Hardware", icon: "📡" },
  { label: "Proprietary data", icon: "🎯" }, { label: "Digital assets", icon: "🌐" },
  { label: "Digital marketing", icon: "📢" }, { label: "Social media", icon: "📱" },
];
const CAPTURE = [{ label: "Quuik", d: "quuik.com", sub: "Top of funnel", deg: 315 }, { label: "siimpler", d: "siimpler.com", sub: "Top of funnel", deg: 45 }];
const INTEL = [{ label: "Predictive Data", d: "predictivedata.org", sub: "Data layer", deg: 218, bigDeg: 223, ai: false }, { label: "MEDIGAP AI", d: "medigap.ai", sub: "GPT engine", deg: 142, bigDeg: 137, ai: true }];

type Co = { title: string; d: string; url: string; image?: string | null };

export default function RsHub({ big, bigBoxes }: { big?: boolean; bigBoxes?: boolean }) {
  const [cos, setCos] = useState<Co[]>(COMPANIES as Co[]);
  useEffect(() => {
    let alive = true;
    fetch("https://quuik.com/api/quuik/network").then((r) => r.json()).then((j) => {
      const list: Co[] = (j.entries || []).filter((e: { image?: string }) => e.image).map((e: { title: string; keyword: string; url: string; image: string }) => ({ title: e.title, d: e.keyword, url: e.url, image: e.image }));
      if (alive && list.length >= 12) setCos(list.slice(0, 30));
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const rCh = 44, rP = 33, rC = bigBoxes ? 30 : 21, rI = bigBoxes ? 30 : 11;
  const port = cos.map((c, i) => ({ ...c, ...P((i / cos.length) * 360, rP) }));
  const chan = CHANNELS.map((c, i) => ({ ...c, ...P((i / CHANNELS.length) * 360, rCh) }));
  const box = big ? 32 : 26;
  const bf = bigBoxes ? 1.7 : 1; // the 4 signature boxes (Quuik/siimpler/Predictive Data/MEDIGAP AI) scaled up + pushed to the corners

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: big ? 600 : bigBoxes ? 560 : 460, aspectRatio: "1/1", margin: "0 auto" }}>
      <style>{`@keyframes rsSpin{to{transform:rotate(360deg)}}@keyframes rsSpinR{to{transform:rotate(-360deg)}}@keyframes rsPulse{0%,100%{transform:translate(-50%,-50%) scale(1);box-shadow:0 0 0 0 rgba(245,130,31,.5)}50%{transform:translate(-50%,-50%) scale(1.05);box-shadow:0 0 66px 18px rgba(245,130,31,.32)}}@keyframes rsInFlow{to{stroke-dashoffset:-18}}@keyframes rsOutFlow{to{stroke-dashoffset:18}}`}</style>

      <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
        {[rCh, rP, rC, rI].map((r) => <circle key={r} cx="50" cy="50" r={r} fill="none" stroke={LINE} strokeWidth="0.4" />)}
        <g><circle cx="50" cy="50" r={rP} fill="none" stroke={O} strokeWidth="0.5" strokeDasharray="0.8 4" opacity="0.65" /><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="34s" repeatCount="indefinite" /></g>
        <g><circle cx="50" cy="50" r={rCh} fill="none" stroke="#ffcda3" strokeWidth="0.4" strokeDasharray="0.6 6" opacity="0.35" /><animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="52s" repeatCount="indefinite" /></g>
        {/* channels flow inward */}
        {chan.map((c, i) => <line key={"ch" + i} x1={c.x} y1={c.y} x2={P((i / CHANNELS.length) * 360, rP).x} y2={P((i / CHANNELS.length) * 360, rP).y} stroke={O} strokeWidth="0.34" strokeDasharray="0.8 2.6" opacity="0.4" style={{ animation: "rsInFlow 2.4s linear infinite" }} />)}
        {/* portfolio spokes — in AND out */}
        <g><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="70s" repeatCount="indefinite" />
          {port.map((p, i) => <line key={i} x1="50" y1="50" x2={p.x} y2={p.y} stroke={i % 2 ? O : DARK} strokeWidth="0.32" strokeDasharray="0.8 2.4" opacity="0.4" style={{ animation: `${i % 2 ? "rsOutFlow" : "rsInFlow"} 2s linear infinite` }} />)}
        </g>
        {/* dark dots straight into the rocket from capture + intelligence */}
        {[...CAPTURE.map((c) => P(c.deg, rC)), ...INTEL.map((n) => P(bigBoxes ? n.bigDeg : n.deg, rI))].map((p, i) => <line key={"n" + i} x1={p.x} y1={p.y} x2="50" y2="50" stroke={DARK} strokeWidth="0.6" strokeDasharray="1 2.2" opacity="0.7" style={{ animation: "rsInFlow 1.4s linear infinite" }} />)}
      </svg>

      {/* OUTER — channels (data from the outside world) */}
      {chan.map((c) => (
        <div key={c.label} style={{ position: "absolute", left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%,-50%)", textAlign: "center", width: 82 }}>
          <div style={{ width: 30, height: 30, margin: "0 auto", borderRadius: 9, background: "#16171b", border: `1px solid ${LINE}`, display: "grid", placeItems: "center", fontSize: 16 }}>{c.icon}</div>
          <div style={{ fontSize: 9.5, color: MUT, marginTop: 3, fontWeight: 600, lineHeight: 1.1 }}>{c.label}</div>
        </div>
      ))}

      {/* PORTFOLIO — unique royalty-free photo boxes */}
      <div style={{ position: "absolute", inset: 0, animation: "rsSpin 70s linear infinite" }}>
        {port.map((c) => (
          <a key={c.d} href={c.url} target="_blank" rel="noopener" title={c.title} style={{ position: "absolute", left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%,-50%)", width: box, height: box, borderRadius: 8, background: "#0d1017", border: `1px solid ${LINE}`, overflow: "hidden", display: "block", animation: "rsSpinR 70s linear infinite" }}>
            {c.image ? <img src={c.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <span style={{ display: "grid", placeItems: "center", width: "100%", height: "100%", background: "#fff" }}><img src={fav(c.d)} alt="" width={16} height={16} /></span>}
          </a>
        ))}
      </div>

      {/* CAPTURE — Quuik / siimpler */}
      {CAPTURE.map((c) => { const p = P(c.deg, rC); return (
        <a key={c.label} href={`https://${c.d}`} target="_blank" rel="noopener" style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%,-50%)", zIndex: 3, display: "flex", alignItems: "center", gap: 6 * bf, background: "#0d1017", border: `${bigBoxes ? 2.5 : 2}px solid ${O}`, borderRadius: 10 * bf, padding: `${5 * bf}px ${9 * bf}px ${5 * bf}px ${5 * bf}px`, textDecoration: "none", boxShadow: `0 0 ${16 * bf}px rgba(245,130,31,.25)` }}>
          <span style={{ width: 20 * bf, height: 20 * bf, borderRadius: 6 * bf, background: "#fff", display: "grid", placeItems: "center", overflow: "hidden", flex: "0 0 auto" }}><img src={fav(c.d)} alt="" width={14 * bf} height={14 * bf} /></span>
          <span style={{ lineHeight: 1.05 }}><span style={{ display: "block", color: INK, fontWeight: 800, fontSize: 11.5 * bf }}>{c.label}</span><span style={{ display: "block", color: O, fontSize: 8.5 * bf, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em" }}>{c.sub}</span></span>
        </a>
      ); })}

      {/* INTELLIGENCE — Predictive Data + MEDIGAP AI */}
      {INTEL.map((n) => { const p = P(bigBoxes ? n.bigDeg : n.deg, rI); return (
        <a key={n.label} href={`https://${n.d}`} target="_blank" rel="noopener" style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%,-50%)", zIndex: 5, display: "flex", alignItems: "center", gap: 6 * bf, background: "#0d1017", border: `${bigBoxes ? 2.5 : 2}px solid ${O}`, borderRadius: 10 * bf, padding: `${5 * bf}px ${9 * bf}px ${5 * bf}px ${5 * bf}px`, textDecoration: "none", boxShadow: `0 0 ${16 * bf}px rgba(245,130,31,.3)` }}>
          {n.ai
            ? <span style={{ width: 20 * bf, height: 20 * bf, borderRadius: 6 * bf, background: "linear-gradient(135deg,#8b5cf6,#3b82f6 55%,#06b6d4)", display: "grid", placeItems: "center", fontSize: 12 * bf, flex: "0 0 auto" }}>🧠</span>
            : <span style={{ width: 20 * bf, height: 20 * bf, borderRadius: 6 * bf, background: "#fff", display: "grid", placeItems: "center", overflow: "hidden", flex: "0 0 auto" }}><img src={fav(n.d)} alt="" width={13 * bf} height={13 * bf} /></span>}
          <span style={{ lineHeight: 1.05 }}><span style={{ display: "block", color: INK, fontWeight: 800, fontSize: 11 * bf }}>{n.label}</span><span style={{ display: "block", color: O, fontSize: 8.5 * bf, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em" }}>{n.sub}</span></span>
        </a>
      ); })}

      {/* CORE */}
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: big ? 88 : 74, height: big ? 88 : 74, borderRadius: "50%", background: "radial-gradient(circle at 50% 35%, #ff9a4d, #F5821F 55%, #c9600f)", display: "grid", placeItems: "center", fontSize: big ? 40 : 34, animation: "rsPulse 3.6s ease-in-out infinite", zIndex: 6 }}>🚀</div>

      <div style={{ position: "absolute", left: "50%", bottom: -10, transform: "translateX(-50%)", fontSize: 11, color: MUT, whiteSpace: "nowrap" }}><b style={{ color: O }}>{cos.length}</b> portfolio &amp; JV companies · and growing</div>
    </div>
  );
}
