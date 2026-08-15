"use client";
import { useState } from "react";
import { logoutAction } from "@/app/logout/actions";
import RadarStage from "./RadarStage";

const O = "#F5821F", INK = "#f4f5f7", MUT = "#9aa2b1", CHAR = "#141519", LINE = "#26282f", GREEN = "#3ecf8e";
const VIDEO = "IDe0jhB00Jw";

function CopyRow({ label, url, accent }: { label: string; url: string; accent: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ background: CHAR, border: `1px solid ${LINE}`, borderRadius: 14, padding: 16 }}>
      <div style={{ color: accent, fontWeight: 800, fontSize: 12.5, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
        <input readOnly value={url} style={{ flex: 1, minWidth: 0, background: "#0e0f12", border: `1px solid ${LINE}`, borderRadius: 9, padding: "10px 12px", color: INK, fontSize: 13.5 }} />
        <button onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1400); }} style={{ background: accent, color: "#0a0a0b", border: 0, borderRadius: 9, padding: "10px 16px", fontWeight: 800, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap" }}>{copied ? "Copied ✓" : "Copy"}</button>
      </div>
    </div>
  );
}

export default function RadarDashboard(props: {
  firstName: string;
  tier: "manager" | "vp";
  track: string;
  salesLink: string;
  oppLink: string;
  recruitLink: string;
  videoWatched: boolean;
  has1099: boolean;
  leadCount: number;
  leads: { name: string; at: string }[];
}) {
  const showSales = props.track === "clients" || props.track === "both";
  const showOpp = props.track === "investors" || props.track === "both";
  const [watched, setWatched] = useState(props.videoWatched);
  const [playing, setPlaying] = useState(false);
  const [has1099, setHas1099] = useState(props.has1099);
  const [uploading, setUploading] = useState(false);
  const [upErr, setUpErr] = useState("");

  async function play() {
    setPlaying(true);
    if (!watched) { setWatched(true); fetch("/api/bd/watched", { method: "POST" }).catch(() => {}); }
  }
  async function upload1099(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUpErr(""); setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      const r = await fetch("/api/bd/upload-1099", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.error) setUpErr(j.error || "Upload failed."); else setHas1099(true);
    } catch { setUpErr("Upload failed."); }
    setUploading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(1100px 700px at 50% -10%, #0d1a14, #0a0a0b)", color: INK, fontFamily: "var(--font-body),Inter,sans-serif", padding: "28px 18px 80px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ color: GREEN, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", fontSize: 11.5 }}>R0cketShip · Command Center</div>
          <form action={logoutAction}><button style={{ background: "transparent", color: MUT, border: `1px solid ${LINE}`, borderRadius: 100, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>Log out</button></form>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "center", marginTop: 8 }}>
          <div style={{ flex: "0 0 auto" }}><RadarStage size={220} /></div>
          <div style={{ flex: "1 1 300px" }}>
            <h1 style={{ color: INK, fontFamily: "var(--font-display),sans-serif", fontWeight: 800, fontSize: "clamp(26px,3.6vw,40px)", margin: 0, lineHeight: 1.05 }}>Welcome, {props.firstName}.</h1>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <span style={{ border: `1px solid ${O}66`, color: O, borderRadius: 100, padding: "5px 13px", fontSize: 12.5, fontWeight: 700 }}>{props.tier === "vp" ? "Vice President" : "Business Development"}</span>
              <span style={{ border: `1px solid ${LINE}`, color: MUT, borderRadius: 100, padding: "5px 13px", fontSize: 12.5 }}>{props.leadCount} investor referral{props.leadCount === 1 ? "" : "s"}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 14, marginTop: 26 }}>
          {showSales && <CopyRow label="Share this link to receive commission on products you are eligible to get commission on" url={props.salesLink} accent={O} />}
          {showOpp && <CopyRow label="Share investor opportunity link (receive referral fee — no commission products)" url={props.oppLink} accent={GREEN} />}
          {props.tier === "vp" && <CopyRow label="Recruit a partner (your downline)" url={props.recruitLink} accent="#5aa9ff" />}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14, marginTop: 14 }}>
          {/* Video */}
          <div style={{ background: CHAR, border: `1px solid ${LINE}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Watch the film {watched && <span style={{ color: GREEN, fontSize: 12.5 }}>· watched ✓</span>}</div>
            <div style={{ marginTop: 10, borderRadius: 12, overflow: "hidden", border: `1px solid ${LINE}`, position: "relative", aspectRatio: "16/9", background: `#000 center/cover no-repeat url(https://img.youtube.com/vi/${VIDEO}/hqdefault.jpg)` }}>
              {playing ? (
                <iframe src={`https://www.youtube.com/embed/${VIDEO}?rel=0&autoplay=1`} title="R0cketShip film" allow="autoplay; encrypted-media; fullscreen" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
              ) : (
                <button onClick={play} aria-label="Play film" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, cursor: "pointer", background: "rgba(0,0,0,.25)", display: "grid", placeItems: "center" }}>
                  <span style={{ width: 58, height: 58, borderRadius: "50%", background: O, display: "grid", placeItems: "center", boxShadow: "0 0 30px rgba(245,130,31,.6)" }}><span style={{ marginLeft: 5, borderStyle: "solid", borderWidth: "11px 0 11px 19px", borderColor: "transparent transparent transparent #0a0a0b" }} /></span>
                </button>
              )}
            </div>
          </div>

          {/* 1099 */}
          <div style={{ background: CHAR, border: `1px solid ${LINE}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Your 1099 {has1099 && <span style={{ color: GREEN, fontSize: 12.5 }}>· on file ✓</span>}</div>
            <p style={{ color: MUT, fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>Upload your 1099 (PDF) so we can pay you. Only R0cketShip can see it.</p>
            {has1099 ? (
              <label style={{ display: "inline-block", marginTop: 6, color: O, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>Replace file<input type="file" accept="application/pdf" onChange={upload1099} style={{ display: "none" }} /></label>
            ) : (
              <label style={{ display: "inline-block", marginTop: 6, background: "#0e0f12", border: `1px dashed ${LINE}`, borderRadius: 10, padding: "12px 16px", color: INK, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>{uploading ? "Uploading…" : "Upload 1099 (PDF)"}<input type="file" accept="application/pdf" onChange={upload1099} disabled={uploading} style={{ display: "none" }} /></label>
            )}
            {upErr && <div style={{ color: "#ff6a4d", fontSize: 12.5, marginTop: 8 }}>{upErr}</div>}
          </div>
        </div>

        {/* Their referred investors — name + timestamp only */}
        <div style={{ background: CHAR, border: `1px solid ${LINE}`, borderRadius: 14, padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>Your investor referrals</div>
          {props.leads.length === 0 ? (
            <p style={{ color: MUT, fontSize: 13.5, marginTop: 8 }}>No referrals yet. Share your Opportunity link to start.</p>
          ) : (
            <div style={{ marginTop: 10 }}>
              {props.leads.map((l, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: i ? `1px solid ${LINE}` : "none", fontSize: 14 }}>
                  <span style={{ fontWeight: 600 }}>{l.name}</span><span style={{ color: MUT, fontSize: 12.5 }}>{l.at}</span>
                </div>
              ))}
            </div>
          )}
          <p style={{ color: MUT, fontSize: 11.5, marginTop: 10 }}>Contact details are held privately by R0cketShip.</p>
        </div>
      </div>
    </div>
  );
}
