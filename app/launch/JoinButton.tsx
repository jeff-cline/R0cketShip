"use client";
import { useState } from "react";

const O = "#F5821F", INK = "#f4f5f7", MUT = "#9aa2b1", CHAR = "#141519", LINE = "#26282f";
const ENDPOINT = "https://medigap.plus/api/rocketship/movement";
const NEXT = "https://quuik.com/join";

const field: React.CSSProperties = { width: "100%", background: "#0d1017", border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", color: INK, fontSize: 15, outline: "none" };

export default function JoinButton({ style }: { style?: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [f, setF] = useState({ firstName: "", lastName: "", city: "", state: "", zip: "", businessName: "", location: "", phone: "", comments: "" });
  const [agreed, setAgreed] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!f.firstName.trim() || !f.lastName.trim()) { setErr("Please enter your first and last name."); return; }
    if (!agreed) { setErr("Please check “Yes, I agree” to continue."); return; }
    setBusy(true);
    try {
      await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, agreed: true }) });
    } catch { /* fire-and-forward — still send them onward */ }
    window.location.href = NEXT;
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={style}>Join The Movement →</button>
      {open && (
        <div onClick={() => !busy && setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(5,6,8,.9)", display: "grid", placeItems: "center", padding: 20, overflowY: "auto", backdropFilter: "blur(5px)" }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ width: "100%", maxWidth: 560, background: "#101116", border: `1px solid ${LINE}`, borderRadius: 20, padding: "28px 26px", margin: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <div style={{ color: O, fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", fontSize: 12 }}>Join The Movement</div>
                <h3 style={{ color: INK, fontWeight: 800, fontSize: 24, margin: "6px 0 0", lineHeight: 1.15 }}>A rising tide lifts all boats.</h3>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: MUT, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>
            <p style={{ color: "#c7ccd6", fontSize: 14.5, lineHeight: 1.6, marginTop: 10 }}>Tell us about your business and we&apos;ll be in touch about bringing it into the network.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
              <input style={field} placeholder="First name *" value={f.firstName} onChange={set("firstName")} />
              <input style={field} placeholder="Last name *" value={f.lastName} onChange={set("lastName")} />
              <input style={field} placeholder="City" value={f.city} onChange={set("city")} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input style={field} placeholder="State" value={f.state} onChange={set("state")} />
                <input style={field} placeholder="Zip" value={f.zip} onChange={set("zip")} />
              </div>
              <input style={{ ...field, gridColumn: "1 / -1" }} placeholder="Name of business" value={f.businessName} onChange={set("businessName")} />
              <input style={field} placeholder="Location" value={f.location} onChange={set("location")} />
              <input style={field} placeholder="Phone number" value={f.phone} onChange={set("phone")} />
              <textarea style={{ ...field, gridColumn: "1 / -1", minHeight: 84, resize: "vertical", fontFamily: "inherit" }} placeholder="Why you&apos;d be a great business within our network" value={f.comments} onChange={set("comments")} />
            </div>

            <label style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 16, cursor: "pointer", background: CHAR, border: `1px solid ${agreed ? O : LINE}`, borderRadius: 12, padding: 14 }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18, accentColor: O, flex: "0 0 auto" }} />
              <span style={{ color: "#c7ccd6", fontSize: 13.5, lineHeight: 1.6 }}>
                <b style={{ color: INK }}>Yes, I agree.</b> A rising tide lifts all boats, and working together is a strategic advantage. Being able to put aside pride and ego and leverage data to make solid business decisions is something I&apos;m open to.
              </span>
            </label>

            {err && <div style={{ color: "#ff6b6b", fontSize: 13.5, marginTop: 12 }}>{err}</div>}

            <button type="submit" disabled={busy} style={{ width: "100%", marginTop: 16, background: O, color: "#0a0a0b", fontWeight: 800, fontSize: 16, border: "none", borderRadius: 100, padding: "15px 20px", cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}>{busy ? "Sending…" : "Join The Movement →"}</button>
            <div style={{ color: MUT, fontSize: 11.5, marginTop: 10, textAlign: "center" }}>On submit you&apos;ll continue to quuik.com/join.</div>
          </form>
        </div>
      )}
    </>
  );
}
