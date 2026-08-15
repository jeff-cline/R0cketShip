"use client";
import { useState } from "react";
const O = "#F5821F", INK = "#f4f5f7", MUT = "#8b93a1", CHAR = "#141519", LINE = "#26282f";
const TYPES = ["Friend", "Family office", "Private equity fund", "Venture fund", "Private money", "Institutional money", "Accredited investor", "I do not know"];
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "12px 14px", border: `1px solid ${LINE}`, borderRadius: 10, fontSize: 15, color: INK, background: "#0e0f12", outline: "none", marginTop: 10 };

export default function OpportunityClient({ slug, refName }: { slug?: string; refName?: string }) {
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", investorType: "" });
  const s = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (busy) return; setErr("");
    if (!f.firstName.trim() || !f.email.trim()) { setErr("First name and email are required."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/opportunity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, slug: slug ?? null }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.error) { setErr(j.error || "Something went wrong. Try again."); setBusy(false); return; }
      setDone(true);
    } catch { setErr("Network error — try again."); setBusy(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(1000px 600px at 50% -10%, #1a1206, #0a0a0b)", color: INK, fontFamily: "var(--font-body),Inter,sans-serif", display: "grid", placeItems: "center", padding: "30px 18px", overflow: "hidden" }}>
      <style>{`@keyframes rsRise{from{transform:translateY(46vh);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes rsLaunch{to{transform:translateY(-80vh) rotate(-8deg);opacity:0}}`}</style>
      {!done ? (
        <div style={{ width: "100%", maxWidth: 460 }}>
          <div style={{ textAlign: "center", animation: "rsRise 1.1s cubic-bezier(.2,.8,.2,1) both" }}>
            <div style={{ fontSize: 52 }}>🚀</div>
            <div style={{ color: O, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", fontSize: 11.5, marginTop: 6 }}>Private access</div>
            <h1 style={{ color: "#f4f5f7", fontFamily: "var(--font-display),sans-serif", fontSize: 26, fontWeight: 800, margin: "6px 0 2px" }}>The R0cketShip Opportunity</h1>
            <p style={{ color: MUT, fontSize: 13.5 }}>Verify to unlock the film, the interactive deck, and the executive summary.</p>
            {refName && <div style={{ marginTop: 10, display: "inline-block", color: "#3ecf8e", fontSize: 12.5, fontWeight: 700, border: "1px solid #3ecf8e44", borderRadius: 100, padding: "5px 13px" }}>Personally shared by {refName}</div>}
          </div>
          <form onSubmit={submit} style={{ background: CHAR, border: `1px solid ${LINE}`, borderRadius: 16, padding: 22, marginTop: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input placeholder="First name *" value={f.firstName} onChange={s("firstName")} style={inp} />
              <input placeholder="Last name" value={f.lastName} onChange={s("lastName")} style={inp} />
            </div>
            <input placeholder="Email *" type="email" value={f.email} onChange={s("email")} style={inp} />
            <input placeholder="Phone" value={f.phone} onChange={s("phone")} style={inp} />
            <select value={f.investorType} onChange={s("investorType")} style={{ ...inp, appearance: "auto" }}>
              <option value="">Are you an accredited investor?</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {err && <div style={{ color: "#ff6a4d", fontSize: 13, marginTop: 10 }}>{err}</div>}
            <button type="submit" disabled={busy} style={{ width: "100%", marginTop: 14, background: O, color: "#000", border: 0, borderRadius: 100, padding: "13px 0", fontSize: 15.5, fontWeight: 800, cursor: busy ? "default" : "pointer" }}>{busy ? "Verifying…" : "Unlock the presentation →"}</button>
            <div style={{ marginTop: 14, borderTop: `1px solid ${LINE}`, paddingTop: 12, color: MUT, fontSize: 11, lineHeight: 1.6 }}>
              <b style={{ color: "#c7ccd6" }}>Terms & Conditions.</b> This is not an offering or a solicitation. This material is intended solely for private investors and accredited investors. It is provided for demonstration and informational purposes only, contains illustrative scenarios, and does not constitute investment advice or a guarantee of performance.
            </div>
          </form>
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: 620, textAlign: "center" }}>
          <div style={{ fontSize: 54, animation: "rsLaunch 1.4s ease-in .3s forwards" }}>🚀</div>
          <div style={{ color: "#3ecf8e", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", fontSize: 12 }}>Access granted</div>
          <h1 style={{ color: "#f4f5f7", fontFamily: "var(--font-display),sans-serif", fontSize: 28, fontWeight: 800, margin: "6px 0 4px" }}>Welcome aboard.</h1>
          <p style={{ color: MUT, fontSize: 14 }}>Thanks{f.firstName ? `, ${f.firstName}` : ""} — the founder has been notified. Explore all three formats:</p>
          <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
            {[["🎬 Watch the film", "The cinematic investor film", "/presentation"], ["🖥 Explore the interactive deck", "Walk the full thesis, scene by scene", "/deck"], ["📄 Download the executive summary", "The one-page thesis & source citations", "/deck?print=1"]].map(([t, d, href]) => (
              <a key={t} href={href} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: INK, background: CHAR, border: `1px solid ${LINE}`, borderRadius: 14, padding: "16px 18px", textAlign: "left" }}>
                <div><div style={{ fontWeight: 800 }}>{t}</div><div style={{ color: MUT, fontSize: 12.5 }}>{d}</div></div><span style={{ color: O, fontWeight: 800 }}>→</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
