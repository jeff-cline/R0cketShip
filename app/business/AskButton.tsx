"use client";
import { useState } from "react";
const O = "#F5821F", INK = "#f4f5f7", MUT = "#9aa2b1", CHAR = "#141519", LINE = "#26282f";
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "12px 14px", border: `1px solid ${LINE}`, borderRadius: 10, fontSize: 15, color: INK, background: "#0e0f12", outline: "none", marginTop: 10 };

export default function AskButton({ small, block }: { small?: boolean; block?: boolean }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", company: "", email: "", phone: "" });
  const s = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [done, setDone] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (busy) return; setErr("");
    if (!f.name.trim() || !f.email.trim()) { setErr("Name and email are required."); return; }
    setBusy(true);
    try { const r = await fetch("https://medigap.plus/api/rocketship/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); const j = await r.json().catch(() => ({})); if (!r.ok || j.error) { setErr(j.error || "Try again."); setBusy(false); return; } setDone(true); } catch { setErr("Network error."); setBusy(false); }
  }
  const btn: React.CSSProperties = small
    ? { background: O, color: "#000", border: 0, borderRadius: 100, padding: "8px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer" }
    : { display: block ? "block" : "inline-block", width: block ? "100%" : "auto", boxSizing: "border-box", background: O, color: "#000", border: 0, borderRadius: 12, padding: "16px 22px", fontWeight: 800, fontSize: 16, cursor: "pointer", textAlign: "left" };
  return (
    <>
      <button onClick={() => setOpen(true)} style={btn}>{small ? "The Ask →" : "🎟️ The Ask →"}</button>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 90, display: "grid", placeItems: "center", padding: 18 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: CHAR, border: `1px solid ${LINE}`, borderRadius: 18, padding: 26, maxWidth: 460, width: "100%", color: INK }}>
            {!done ? (
              <>
                <div style={{ fontSize: 34, textAlign: "center" }}>🚀</div>
                <h2 style={{ fontFamily: "var(--font-display),sans-serif", fontSize: 22, fontWeight: 800, textAlign: "center", margin: "6px 0 2px" }}>You’re ready to take a ride.</h2>
                <p style={{ color: MUT, fontSize: 13.5, textAlign: "center", margin: 0 }}>If you’ve made it this far — give us your information and the appropriate team member will reach back out to you.</p>
                <form onSubmit={submit} style={{ marginTop: 14 }}>
                  <input placeholder="Full name *" value={f.name} onChange={s("name")} style={inp} />
                  <input placeholder="Company name" value={f.company} onChange={s("company")} style={inp} />
                  <input placeholder="Email *" type="email" value={f.email} onChange={s("email")} style={inp} />
                  <input placeholder="Phone number" value={f.phone} onChange={s("phone")} style={inp} />
                  {err && <div style={{ color: "#ff6a4d", fontSize: 13, marginTop: 10 }}>{err}</div>}
                  <button type="submit" disabled={busy} style={{ width: "100%", marginTop: 14, background: O, color: "#000", border: 0, borderRadius: 100, padding: "13px 0", fontSize: 15.5, fontWeight: 800, cursor: "pointer" }}>{busy ? "Sending…" : "Have the team reach out →"}</button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: 40 }}>🚀</div>
                <h2 style={{ fontFamily: "var(--font-display),sans-serif", fontSize: 22, fontWeight: 800, margin: "6px 0 2px", color: "#3ecf8e" }}>You’re on the manifest.</h2>
                <p style={{ color: MUT, fontSize: 14 }}>Thanks{f.name ? `, ${f.name.split(" ")[0]}` : ""} — the right team member will reach out shortly.</p>
                <button onClick={() => setOpen(false)} style={{ marginTop: 12, background: O, color: "#000", border: 0, borderRadius: 100, padding: "11px 22px", fontWeight: 800, cursor: "pointer" }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
