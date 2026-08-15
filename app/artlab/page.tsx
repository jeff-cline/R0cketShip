import type { Metadata } from "next";
import RsHub from "@/app/_components/RsHub";

export const metadata: Metadata = {
  title: "R0cketShip — #ARTLAB · A rising tide lifts all boats",
  description: "A room full of smart people focused in the same direction — a proprietary network of businesses changing the world.",
};
const O = "#F5821F";

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(1200px 700px at 50% -10%, #1a1206, #0a0a0b)", color: "#f4f5f7", fontFamily: "var(--font-body), Inter, -apple-system, sans-serif", padding: "42px 20px 80px" }}>
      <div style={{ maxWidth: 840, margin: "0 auto", textAlign: "center" }}>
        <RsHub big />
        <div style={{ marginTop: 30, color: O, fontWeight: 800, letterSpacing: ".26em", fontSize: 13 }}>#ARTLAB</div>
        <h1 style={{ color: "#f4f5f7", fontFamily: "var(--font-display), 'Plus Jakarta Sans', sans-serif", fontSize: "clamp(30px,6vw,54px)", fontWeight: 800, margin: "10px 0 0", letterSpacing: "-.025em", textWrap: "balance" }}>A rising tide lifts all boats.</h1>
        <p style={{ color: "#c7ccd6", fontSize: "clamp(15px,2vw,19px)", lineHeight: 1.72, margin: "18px auto 0", maxWidth: 700 }}>
          Put a room full of smart people, focused in the same direction, all committed to changing the world — and you get a proprietary network of businesses working in alignment to make a positive impact on their businesses, their employees, their customers, and their communities. Equipping industries for drastic disruption, with the intention of positive change for good. <b style={{ color: "#f4f5f7" }}>Quuik.com</b> is just one of dozens of businesses that power the core of what is to be the future of the global economy.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 28 }}>
          <a href="/deck" style={{ background: O, color: "#000", fontWeight: 800, textDecoration: "none", borderRadius: 100, padding: "14px 30px" }}>View Deck →</a>
          <a href="/presentation" style={{ background: "transparent", color: "#f4f5f7", fontWeight: 700, textDecoration: "none", border: "1px solid #26282f", borderRadius: 100, padding: "14px 30px" }}>▶ View Video</a>
        </div>
      </div>
    </div>
  );
}
