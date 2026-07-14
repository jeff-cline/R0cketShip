import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Become a CrewPerk Partner",
  description: "Reach the cruise crew and passenger flow in your port. Community Builder and Advanced merchant plans.",
  robots: { index: true, follow: true },
};

const ORANGE = "#ff5b2e";
const TEAL = "#0e9aa7";

function RImg({ size = 16 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/rocket.png" width={size} height={size} alt="" aria-hidden className="inline-block shrink-0" style={{ objectFit: "contain" }} />;
}

const TIERS = [
  {
    name: "Community Builder",
    price: "$750",
    setup: "+ $750 one-time setup",
    accent: TEAL,
    featured: false,
    blurb: "Get found by crew and passengers the moment they hit your port.",
    features: ["Verified Yelp-style profile + photo gallery", "Your crew perk featured on your page", "1–5 🚀 crew reviews", "Pin on the live port map", "Click & redemption dashboard", "A branding kit to look your best"],
  },
  {
    name: "Merchant Advanced",
    price: "$3,000",
    setup: "per month · includes direct advertising",
    accent: ORANGE,
    featured: true,
    blurb: "Everything in Community Builder, plus direct advertising that drives crew straight to you.",
    features: ["Everything in Community Builder", "Featured Partner placement", "Direct advertising to crew & passengers", "Rocket Fuel pay-to-boost (bid to rank #1)", "Video & social promotion", "Priority on the map and in search"],
  },
];

export default function PartnerLander() {
  return (
    <main className="min-h-[100dvh] bg-white" style={{ color: "#0a0e17" }}>
      <nav className="sticky top-0 z-40 flex items-center justify-between border-b bg-white/90 px-5 py-3 backdrop-blur sm:px-8" style={{ borderColor: "#e6eaf1" }}>
        <a href="/" className="flex items-center gap-2 text-lg font-extrabold"><RImg size={22} /> Crew<span style={{ color: TEAL }}>Perk</span></a>
        <a href="mailto:jeff.cline@me.com?subject=CrewPerk%20Merchant%20Partner" className="rounded-full px-4 py-2 text-sm font-bold text-white" style={{ background: ORANGE }}>Become a partner</a>
      </nav>

      <header className="px-5 py-14 text-center sm:px-8 sm:py-20" style={{ background: "linear-gradient(180deg,#fff6f2,#ffffff)" }}>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold" style={{ background: "#ffe9e1", color: ORANGE }}><RImg size={14} /> For local businesses</div>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">Put your business in front of the people who run the ships.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg" style={{ color: "#61708a" }}>
          Crew hit your port every week and tell each other where to go. Passengers arrive with hours and money. CrewPerk routes them to verified partners — you.
        </p>
      </header>

      {/* Tiers */}
      <section className="px-5 pb-16 sm:px-8">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {TIERS.map((t) => (
            <div key={t.name} className="flex flex-col rounded-3xl border p-7" style={{ borderColor: t.featured ? t.accent : "#e6eaf1", boxShadow: t.featured ? "0 20px 50px -20px rgba(255,91,46,.4)" : "0 1px 3px rgba(10,14,23,.06)" }}>
              {t.featured && <div className="mb-3 inline-block self-start rounded-full px-3 py-1 text-xs font-extrabold text-white" style={{ background: t.accent }}>MOST POPULAR</div>}
              <div className="text-lg font-extrabold">{t.name}</div>
              <div className="mt-2 flex items-baseline gap-2"><span className="text-4xl font-extrabold">{t.price}</span><span className="text-sm" style={{ color: "#61708a" }}>/mo</span></div>
              <div className="mt-1 text-sm font-semibold" style={{ color: t.accent }}>{t.setup}</div>
              <p className="mt-3 text-sm" style={{ color: "#61708a" }}>{t.blurb}</p>
              <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5"><span className="mt-0.5"><RImg size={15} /></span><span style={{ color: "#2a3550" }}>{f}</span></li>
                ))}
              </ul>
              <a href={`mailto:jeff.cline@me.com?subject=${encodeURIComponent("CrewPerk Partner — " + t.name)}`} className="mt-6 block rounded-full py-3.5 text-center font-bold" style={t.featured ? { background: t.accent, color: "#fff" } : { border: `1.5px solid ${t.accent}`, color: t.accent }}>Get started</a>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs" style={{ color: "#8b97ad" }}>
          Ask about lifetime and one-time coupons. Deposits are non-refundable. Payouts processed on the 21st of the following month.
        </p>
      </section>

      <footer className="border-t px-5 py-10 text-center sm:px-8" style={{ borderColor: "#e6eaf1", background: "#fafbfc" }}>
        <a href="/" className="inline-flex items-center gap-2 text-base font-extrabold"><RImg size={20} /> Crew<span style={{ color: TEAL }}>Perk</span></a>
        <p className="mt-3 text-xs" style={{ color: "#8b97ad" }}>© CrewPerk · A R0cketShip Holdings company</p>
      </footer>
    </main>
  );
}
