"use client";
import { useEffect, useState } from "react";
import RsHub from "@/app/_components/RsHub";
import AskButton from "./AskButton";
const O = "#F5821F", INK = "#f4f5f7", MUT = "#9aa2b1", CHAR = "#141519", LINE = "#26282f";
const TYPES = ["Friend", "Family office", "Private equity fund", "Venture fund", "Private money", "Institutional money", "Accredited investor", "I do not know"];
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "12px 14px", border: `1px solid ${LINE}`, borderRadius: 10, fontSize: 15, color: INK, background: "#0e0f12", outline: "none", marginTop: 10 };
const BUTTONS: [string, string, string][] = [
  ["📋", "Executive overview", "/business/executive-overview"],
  ["📄", "One-page", "/business/one-page"],
  ["📈", "Business plan", "/business/business-plan"],
  ["📚", "Supporting data & citations", "/business/data"],
];

export default function BusinessClient() {
  const [unlocked, setUnlocked] = useState(false);
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", investorType: "" });
  const s = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  useEffect(() => { try { if (sessionStorage.getItem("rs_biz") === "1") setUnlocked(true); } catch {} }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (busy) return; setErr("");
    if (!f.firstName.trim() || !f.email.trim()) { setErr("First name and email are required."); return; }
    setBusy(true);
    try { const r = await fetch("https://medigap.plus/api/rocketship/opportunity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); const j = await r.json().catch(() => ({})); if (!r.ok || j.error) { setErr(j.error || "Try again."); setBusy(false); return; } try { sessionStorage.setItem("rs_biz", "1"); } catch {} setUnlocked(true); } catch { setErr("Network error."); setBusy(false); }
  }

  if (!unlocked) return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(1000px 600px at 50% -10%, #1a1206, #0a0a0b)", color: INK, fontFamily: "var(--font-body),Inter,sans-serif", display: "grid", placeItems: "center", padding: "30px 18px", overflow: "hidden" }}>
      <style>{`@keyframes rsRise{from{transform:translateY(46vh);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", animation: "rsRise 1.1s cubic-bezier(.2,.8,.2,1) both" }}>
          <div style={{ fontSize: 52 }}>🚀</div>
          <div style={{ color: O, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", fontSize: 11.5, marginTop: 6 }}>Private access</div>
          <h1 style={{ color: INK, fontFamily: "var(--font-display),sans-serif", fontSize: 26, fontWeight: 800, margin: "6px 0 2px" }}>The R0cketShip Business Thesis</h1>
          <p style={{ color: MUT, fontSize: 13.5 }}>Verify to unlock the overview, one-pager, business plan, data &amp; citations.</p>
        </div>
        <form onSubmit={submit} style={{ background: CHAR, border: `1px solid ${LINE}`, borderRadius: 16, padding: 22, marginTop: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input placeholder="First name *" value={f.firstName} onChange={s("firstName")} style={inp} />
            <input placeholder="Last name" value={f.lastName} onChange={s("lastName")} style={inp} />
          </div>
          <input placeholder="Email *" type="email" value={f.email} onChange={s("email")} style={inp} />
          <input placeholder="Phone" value={f.phone} onChange={s("phone")} style={inp} />
          <select value={f.investorType} onChange={s("investorType")} style={{ ...inp, appearance: "auto" }}>
            <option value="">Are you an accredited investor?</option>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {err && <div style={{ color: "#ff6a4d", fontSize: 13, marginTop: 10 }}>{err}</div>}
          <button type="submit" disabled={busy} style={{ width: "100%", marginTop: 14, background: O, color: "#000", border: 0, borderRadius: 100, padding: "13px 0", fontSize: 15.5, fontWeight: 800, cursor: "pointer" }}>{busy ? "Verifying…" : "Unlock the thesis →"}</button>
          <div style={{ marginTop: 14, borderTop: `1px solid ${LINE}`, paddingTop: 12, color: MUT, fontSize: 11, lineHeight: 1.6 }}><b style={{ color: "#c7ccd6" }}>Terms & Conditions.</b> This is not an offering or a solicitation. Intended solely for private and accredited investors. Provided for demonstration and informational purposes only; contains illustrative scenarios; not investment advice or a guarantee of performance.</div>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(1200px 700px at 50% -10%, #1a1206, #0a0a0b)", color: INK, fontFamily: "var(--font-body),Inter,sans-serif", padding: "36px 20px 80px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 34, alignItems: "center" }} className="rs-biz">
        <div><RsHub big /></div>
        <div>
          <div style={{ color: O, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", fontSize: 12 }}>R0cketShip Holdings</div>
          <h1 style={{ color: INK, fontFamily: "var(--font-display),sans-serif", fontSize: "clamp(26px,3.4vw,40px)", fontWeight: 800, margin: "10px 0 0", letterSpacing: "-.02em", lineHeight: 1.05 }}>A technology-enabled permanent-capital compounder.</h1>
          <p style={{ color: "#c7ccd6", fontSize: 16, lineHeight: 1.6, marginTop: 12 }}>We acquire cash-flow businesses, compound proprietary commercial intelligence across the portfolio, and use it to improve the economics of every company we own — <b style={{ color: O }}>financially, data-, and network-accretive</b>, all at once.</p>
          <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
            {BUTTONS.map(([ic, t, href]) => <a key={t} href={href} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: INK, background: CHAR, border: `1px solid ${LINE}`, borderRadius: 12, padding: "15px 18px", fontWeight: 700 }}><span>{ic} &nbsp; {t}</span><span style={{ color: O, fontWeight: 800 }}>→</span></a>)}
            <AskButton block />
          </div>
        </div>
      </div>
      <style>{`@media (max-width:820px){.rs-biz{grid-template-columns:1fr !important}}`}</style>
    </div>
  );
}
