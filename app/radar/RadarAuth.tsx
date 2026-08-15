"use client";
import { useActionState, useState } from "react";
import { radarSignupAction, radarLoginAction } from "./actions";
import RadarStage from "./RadarStage";

const O = "#F5821F", INK = "#f4f5f7", MUT = "#9aa2b1", CHAR = "#141519", LINE = "#26282f";
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "12px 14px", border: `1px solid ${LINE}`, borderRadius: 10, fontSize: 15, color: INK, background: "#0e0f12", outline: "none" };

const TRACKS: { key: string; label: string; sub: string }[] = [
  { key: "clients", label: "Clients", sub: "Product & service sales — earn % commission" },
  { key: "investors", label: "Investors", sub: "Refer investor opportunities — earn a referral fee" },
  { key: "both", label: "Both", sub: "Work clients and investors from one account" },
];

export default function RadarAuth({ sponsor }: { sponsor?: string }) {
  const [tab, setTab] = useState<"signup" | "login">("signup");
  const [track, setTrack] = useState("both");
  const [signupState, signupAction, signupPending] = useActionState(radarSignupAction, {} as { error?: string });
  const [loginState, loginAction, loginPending] = useActionState(radarLoginAction, {} as { error?: string });

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(1100px 700px at 50% -10%, #0d1a14, #0a0a0b)", color: INK, fontFamily: "var(--font-body),Inter,sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 18px" }}>
      <div style={{ width: "100%", maxWidth: 1080, display: "flex", flexWrap: "wrap", gap: "clamp(20px,4vw,56px)", alignItems: "center", justifyContent: "center" }}>
        <div style={{ flex: "1 1 340px", maxWidth: 440, textAlign: "center" }}>
          <RadarStage size={360} />
          <div style={{ color: "#3ecf8e", fontWeight: 800, letterSpacing: ".22em", textTransform: "uppercase", fontSize: 11.5, marginTop: 10 }}>R0cketShip · Command Center</div>
          <h1 style={{ color: INK, fontFamily: "var(--font-display),sans-serif", fontWeight: 800, fontSize: "clamp(26px,3.4vw,38px)", margin: "8px 0 0", lineHeight: 1.08 }}>Partner Radar</h1>
          <p style={{ color: MUT, fontSize: 15, marginTop: 8, maxWidth: 380, marginInline: "auto" }}>One login. Two ways to earn — sell across the network, and refer investors into the opportunity.</p>
        </div>

        <div style={{ flex: "1 1 380px", maxWidth: 460, width: "100%" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {(["signup", "login"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "11px 0", borderRadius: 100, border: `1px solid ${tab === t ? O : LINE}`, background: tab === t ? O : "transparent", color: tab === t ? "#0a0a0b" : INK, fontWeight: 800, fontSize: 14.5, cursor: "pointer" }}>
                {t === "signup" ? "Create account" : "Log in"}
              </button>
            ))}
          </div>

          {tab === "signup" ? (
            <form action={signupAction} style={{ background: CHAR, border: `1px solid ${LINE}`, borderRadius: 16, padding: 22 }}>
              {sponsor ? <input type="hidden" name="sponsor" value={sponsor} /> : null}
              <input type="hidden" name="track" value={track} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input name="firstName" placeholder="First name *" style={inp} />
                <input name="lastName" placeholder="Last name *" style={inp} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, marginTop: 10 }}>
                <input name="city" placeholder="City" style={inp} />
                <input name="state" placeholder="State" style={{ ...inp, width: 90 }} />
                <input name="zip" placeholder="Zip" style={{ ...inp, width: 100 }} />
              </div>
              <input name="email" type="email" placeholder="Email *" style={{ ...inp, marginTop: 10 }} />
              <input name="password" type="password" placeholder="Password (8+ characters) *" style={{ ...inp, marginTop: 10 }} />

              <div style={{ color: MUT, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", margin: "16px 0 8px" }}>I want to work with…</div>
              <div style={{ display: "grid", gap: 8 }}>
                {TRACKS.map((tr) => (
                  <label key={tr.key} style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", border: `1px solid ${track === tr.key ? O : LINE}`, borderRadius: 12, padding: "11px 13px", background: track === tr.key ? "rgba(245,130,31,.08)" : "transparent" }}>
                    <input type="radio" name="track_r" checked={track === tr.key} onChange={() => setTrack(tr.key)} style={{ marginTop: 3, accentColor: O }} />
                    <span><span style={{ fontWeight: 800 }}>{tr.label}</span><span style={{ display: "block", color: MUT, fontSize: 12.5 }}>{tr.sub}</span></span>
                  </label>
                ))}
              </div>

              {signupState?.error && <div style={{ color: "#ff6a4d", fontSize: 13, marginTop: 12 }}>{signupState.error}</div>}
              <button type="submit" disabled={signupPending} style={{ width: "100%", marginTop: 16, background: O, color: "#0a0a0b", border: 0, borderRadius: 100, padding: "14px 0", fontSize: 15.5, fontWeight: 800, cursor: signupPending ? "default" : "pointer", opacity: signupPending ? 0.7 : 1 }}>{signupPending ? "Creating…" : "Create my account →"}</button>
            </form>
          ) : (
            <form action={loginAction} style={{ background: CHAR, border: `1px solid ${LINE}`, borderRadius: 16, padding: 22 }}>
              <input name="email" type="email" placeholder="Email" style={inp} />
              <input name="password" type="password" placeholder="Password" style={{ ...inp, marginTop: 10 }} />
              {loginState?.error && <div style={{ color: "#ff6a4d", fontSize: 13, marginTop: 12 }}>{loginState.error}</div>}
              <button type="submit" disabled={loginPending} style={{ width: "100%", marginTop: 16, background: O, color: "#0a0a0b", border: 0, borderRadius: 100, padding: "14px 0", fontSize: 15.5, fontWeight: 800, cursor: loginPending ? "default" : "pointer", opacity: loginPending ? 0.7 : 1 }}>{loginPending ? "Signing in…" : "Log in →"}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
