"use client";
import RsHub from "@/app/_components/RsHub";
import { FilmTextButton } from "@/app/_components/FilmModal";
import JoinButton from "./JoinButton";

const O = "#F5821F", INK = "#f4f5f7", MUT = "#9aa2b1", LINE = "#26282f";
const VIDEO = "IDe0jhB00Jw";

const btnPrimary: React.CSSProperties = { background: O, color: "#0a0a0b", fontWeight: 800, fontSize: 16, border: "none", borderRadius: 100, padding: "15px 26px", cursor: "pointer", textDecoration: "none", display: "inline-block" };
const btnGhost: React.CSSProperties = { background: "transparent", color: INK, fontWeight: 700, fontSize: 15, border: `1px solid ${LINE}`, borderRadius: 100, padding: "14px 24px", cursor: "pointer", textDecoration: "none", display: "inline-block" };

export default function LaunchClient() {
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(1200px 760px at 30% -10%, #1a1206, #0a0a0b)", color: INK, fontFamily: "var(--font-body),Inter,sans-serif", display: "flex", alignItems: "center", padding: "48px 20px 90px" }}>
      <div style={{ width: "100%", maxWidth: 1240, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "clamp(24px,5vw,64px)", alignItems: "center", justifyContent: "center" }}>

        {/* LEFT — the moving hub, signature boxes enlarged */}
        <div style={{ flex: "1 1 460px", maxWidth: 600, minWidth: 300 }}>
          <RsHub bigBoxes />
        </div>

        {/* RIGHT — the quote + calls to action */}
        <div style={{ flex: "1 1 380px", maxWidth: 520, minWidth: 280 }}>
          <div style={{ color: O, fontWeight: 800, letterSpacing: ".22em", textTransform: "uppercase", fontSize: 12 }}>R0cketShip · Join the movement</div>
          <blockquote style={{ margin: "18px 0 0", fontFamily: "var(--font-serif),Fraunces,Georgia,serif", fontWeight: 600, fontSize: "clamp(28px,4.4vw,46px)", lineHeight: 1.14, letterSpacing: "-.01em", color: INK }}>
            &ldquo;Every industry is a geek away from being <span style={{ color: O }}>uberized</span>.&rdquo;
          </blockquote>
          <div style={{ marginTop: 16, color: MUT, fontSize: 16, fontWeight: 700 }}>— Jeff Cline</div>

          <p style={{ color: "#c7ccd6", fontSize: 16, lineHeight: 1.65, marginTop: 22, maxWidth: 460 }}>
            A rising tide lifts all boats. Put pride and ego behind you, leverage the data, and make solid business decisions — together.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
            <JoinButton style={btnPrimary} />
            <FilmTextButton videoId={VIDEO} label="▶ Watch the film" style={btnGhost} />
            <a href="/deck" style={btnGhost}>View the deck →</a>
          </div>
        </div>

      </div>
    </div>
  );
}
