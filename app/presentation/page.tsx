import type { Metadata } from "next";
import RsHub from "@/app/_components/RsHub";
export const metadata: Metadata = {
  title: { absolute: "R0cketShip Advantage" },
  description: "The R0cketShip Advantage — own the relationship, own the intelligence, compound the value.",
  openGraph: {
    title: "R0cketShip Advantage",
    description: "Own the relationship. Own the intelligence. Compound the value.",
    url: "https://r0cketship.com/presentation",
    images: [{ url: "/og-rocket.png", width: 1200, height: 630, alt: "R0cketShip" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "R0cketShip Advantage",
    description: "Own the relationship. Own the intelligence. Compound the value.",
    images: ["/og-rocket.png"],
  },
};
const O = "#F5821F";
const YT = "IDe0jhB00Jw"; // R0cketShip film
export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(1200px 700px at 50% -10%, #1a1206, #0a0a0b)", color: "#f4f5f7", fontFamily: "var(--font-body),Inter,sans-serif", padding: "40px 20px 80px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
        <div style={{ color: O, fontWeight: 800, letterSpacing: ".22em", textTransform: "uppercase", fontSize: 12 }}>The R0cketShip Film</div>
        <h1 style={{ color: "#f4f5f7", fontFamily: "var(--font-display),sans-serif", fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, margin: "10px 0 22px", letterSpacing: "-.02em" }}>Own the relationship. Own the intelligence. Compound the value.</h1>
        {YT ? (
          <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 16, overflow: "hidden", border: "1px solid #26282f" }}>
            <iframe src={`https://www.youtube.com/embed/${YT}?rel=0`} title="R0cketShip" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
          </div>
        ) : (
          <div style={{ borderRadius: 16, border: "1px solid #26282f", background: "#0f1013", padding: "40px 20px" }}>
            <RsHub />
            <p style={{ color: "#8b93a1", marginTop: 18 }}>🎬 The film is in production. In the meantime, walk the interactive presentation.</p>
          </div>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 26 }}>
          <a href="/deck" style={{ background: O, color: "#000", fontWeight: 800, textDecoration: "none", borderRadius: 100, padding: "14px 28px" }}>View the interactive deck →</a>
          <a href="/opportunity" style={{ background: "transparent", color: "#f4f5f7", fontWeight: 700, textDecoration: "none", border: "1px solid #26282f", borderRadius: 100, padding: "14px 28px" }}>Request investor access</a>
        </div>
      </div>
    </div>
  );
}
