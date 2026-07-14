import Link from "next/link";

// Small launching rocket-ship that always links back to the homepage. Lives in
// a fixed corner of the dark pages. Bottom-right by default; decks use top-left
// so it never collides with the slide controls.
export function HomeRocket({ corner = "bottom-right" }: { corner?: "bottom-right" | "top-left" }) {
  const pos = corner === "top-left" ? "left-4 top-3" : "bottom-4 right-4";
  return (
    <Link href="/" aria-label="Back to R0cketShip home" className={`home-rocket fixed z-50 ${pos}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/rocket.png" width={34} height={34} alt="Home" className="home-rocket-img inline-block" style={{ objectFit: "contain" }} />
    </Link>
  );
}
