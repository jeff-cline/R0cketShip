import { CrewJoin } from "./CrewJoin";
import { MerchantCard } from "./MerchantCard";
import { ALL_PORTS, portSlug } from "./ports";
import { PortSearch } from "./PortSearch";
import { MerchantMap } from "./MerchantMap";
import { merchantsByPort } from "./merchants";
import { AdSlot } from "./AdSlot";
import { TicketsSection } from "./TicketsSection";
import { ticketsByPort } from "./tickets";
import { CrewShare } from "./CrewShare";

// crewperk.com consumer home — clean, white, Yelp-style. The crew version of the
// Puerto Rico Masterminds white-label. Served when host === crewperk.com.
// Merchants are now live from the database (seeded San Juan/Cozumel/Roatán).

const ORANGE = "#ff5b2e";
const TEAL = "#0e9aa7";
const FLAGSHIP_PORT = "San Juan, Puerto Rico";

function RImg({ size = 16, className = "" }: { size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/rocket.png" width={size} height={size} alt="" aria-hidden className={`inline-block shrink-0 ${className}`} style={{ objectFit: "contain" }} />;
}

const CATEGORIES = [
  { label: "Food & Drink", c: "#ef6c4d" },
  { label: "Beaches", c: "#13a8c0" },
  { label: "Excursions", c: "#0e9aa7" },
  { label: "Transport", c: "#7c6cf0" },
  { label: "Wellness", c: "#16a34a" },
  { label: "Nightlife", c: "#d6457d" },
  { label: "Shopping", c: "#d97706" },
  { label: "Events", c: "#ff5b2e" },
];

export async function CrewHome() {
  const merchants = await merchantsByPort(FLAGSHIP_PORT);
  const cards = merchants.map((m) => ({
    name: m.name,
    cat: `${m.category} · ${m.port.split(",")[0]}`,
    rating: Math.round(Number(m.rating)),
    reviews: m.reviewCount,
    perk: m.perk ?? "",
    price: m.priceLevel,
    images: (m.images ?? []) as string[],
    href: `/m/${m.slug}`,
  }));
  const pins = merchants
    .filter((m) => m.lat != null && m.lon != null)
    .map((m) => ({ name: m.name, slug: m.slug, lat: Number(m.lat), lon: Number(m.lon), perk: m.perk }));
  const tickets = await ticketsByPort(FLAGSHIP_PORT);

  return (
    <main className="min-h-[100dvh] bg-white" style={{ color: "#0a0e17" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between border-b bg-white/90 px-5 py-3 backdrop-blur sm:px-8" style={{ borderColor: "#e6eaf1" }}>
        <a href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight"><RImg size={24} /> Crew<span style={{ color: TEAL }}>Perk</span></a>
        <div className="hidden items-center gap-6 text-sm font-semibold md:flex" style={{ color: "#2a3550" }}>
          <a href="#explore" className="hover:opacity-70">Explore</a>
          <a href="#map" className="hover:opacity-70">Map</a>
          <a href="/crewperk/partner" className="hover:opacity-70">For merchants</a>
          <a href="#join" className="rounded-full px-4 py-2 text-white" style={{ background: ORANGE }}>Get crew access</a>
        </div>
        <a href="#join" className="rounded-full px-4 py-2 text-sm font-semibold text-white md:hidden" style={{ background: ORANGE }}>Join</a>
      </nav>

      {/* Hero with geo search */}
      <header className="px-5 py-14 sm:px-8 sm:py-20" style={{ background: "linear-gradient(180deg, #f3fbfc, #ffffff)" }}>
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold" style={{ background: "#e6f7f9", color: TEAL }}>🤫 The secret knock — crew only</div>
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">Perks in every port.</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg" style={{ color: "#61708a" }}>
            Discover the best food, beaches, excursions, and crew rates — rated by the people who actually run the ships.
          </p>
          <PortSearch />
        </div>
      </header>

      {/* Categories */}
      <section id="explore" className="px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap justify-center gap-2.5">
            {CATEGORIES.map((cat) => (
              <a key={cat.label} href="#merchants" className="rounded-full border px-4 py-2 text-sm font-semibold transition hover:shadow-sm" style={{ borderColor: "#e6eaf1", color: "#2a3550" }}>
                <span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ background: cat.c }} />{cat.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsored banner (top live bidder for this port) */}
      <section className="px-5 pb-2 sm:px-8"><div className="mx-auto max-w-6xl"><AdSlot port={FLAGSHIP_PORT} variant="banner" /></div></section>

      {/* Featured merchants */}
      <section id="merchants" className="px-5 pb-14 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">Crew favorites in San Juan</h2>
              <p className="mt-1 text-sm" style={{ color: "#61708a" }}>Verified local partners · rated by crew, for crew</p>
            </div>
            <a href="#join" className="hidden text-sm font-bold sm:block" style={{ color: ORANGE }}>See all →</a>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((m) => <MerchantCard key={m.href} m={m} />)}
          </div>
        </div>
      </section>

      {/* Tickets & experiences */}
      <TicketsSection tickets={tickets} />

      {/* Map */}
      <section id="map" className="px-5 py-14 sm:px-8" style={{ background: "#f7f9fc" }}>
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Everything within walking distance</h2>
          <p className="mt-1 text-sm" style={{ color: "#61708a" }}>Tap a 🚀 to see the perk and open the profile. We'll show where you are.</p>
          <div className="mt-6"><MerchantMap pins={pins} port={FLAGSHIP_PORT} /></div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Tap in. Earn. Redeem. Repeat.</h2>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Unlock over 21 days", d: "Tap “I'm crew” and perks unlock day by day — full access at day 21." },
              { t: "Rate with rockets", d: "Score venues 1–5 🚀, drop a photo, leave a tip — earn points every time." },
              { t: "Scan & refer", d: "Scan crew QR codes and refer cruisers — stack points fast." },
              { t: "Redeem anywhere", d: "Cash points for perks, experiences, and prizes — at every port you collect." },
            ].map((s, i) => (
              <div key={s.t} className="rounded-2xl border bg-white p-5 text-left shadow-sm" style={{ borderColor: "#e6eaf1" }}>
                <div className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white" style={{ background: i % 2 ? TEAL : ORANGE }}>{i + 1}</div>
                <div className="mt-3 font-bold">{s.t}</div>
                <div className="mt-1 text-sm" style={{ color: "#61708a" }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Crew referral rewards */}
      <CrewShare />

      {/* Join + merchants split */}
      <section id="join" className="px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">Your ports, finally working for you.</h2>
            <p className="mt-3 text-lg" style={{ color: "#61708a" }}>
              Crew-only pricing, local experiences, transport discounts, beach access, and recovery offers — at verified partners in every port. Built by crew, for crew.
            </p>
            <div className="mt-5 rounded-xl border p-4" style={{ borderColor: "#e6eaf1", background: "#f7f9fc" }}>
              <div className="text-sm font-bold">Are you a local business? <span style={{ color: TEAL }}>Reach the crew & passenger flow.</span></div>
              <a href="/crewperk/partner" className="mt-2 inline-block text-sm font-bold" style={{ color: ORANGE }}>Become a partner →</a>
            </div>
          </div>
          <CrewJoin />
        </div>
      </section>

      {/* All ports — collapsed accordion, fully crawlable */}
      <section className="border-t px-5 py-12 sm:px-8" style={{ borderColor: "#e6eaf1" }}>
        <div className="mx-auto max-w-6xl">
          <details>
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
              <span className="text-xl font-extrabold">Ports we serve <span style={{ color: "#8b97ad" }}>({ALL_PORTS.length})</span> <span className="text-sm font-semibold" style={{ color: ORANGE }}>▾ tap to expand</span></span>
              <a href="/crewperk/ports" className="text-sm font-bold" style={{ color: ORANGE }}>Opportunity Port Data &amp; Statistics →</a>
            </summary>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5">
              {ALL_PORTS.map((p) => (
                <a key={p} href={`/${portSlug(p)}`} className="text-xs transition hover:underline" style={{ color: "#61708a" }}>{p}</a>
              ))}
            </div>
          </details>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-5 py-10 sm:px-8" style={{ borderColor: "#e6eaf1", background: "#fafbfc" }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <a href="/" className="flex items-center gap-2 text-base font-extrabold"><RImg size={20} /> Crew<span style={{ color: TEAL }}>Perk</span></a>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold" style={{ color: "#61708a" }}>
            <a href="#explore" className="hover:text-black">Explore</a>
            <a href="/crewperk/partner" className="hover:text-black">For merchants</a>
            <a href="https://r0cketship.com/crewperk" className="hover:text-black">Investors / Business</a>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-6xl text-center text-xs" style={{ color: "#8b97ad" }}>
          © CrewPerk · A R0cketShip Holdings company · Not affiliated with any cruise line.
        </p>
      </footer>
    </main>
  );
}
