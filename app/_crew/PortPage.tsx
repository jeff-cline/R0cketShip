import { merchantsByPort } from "./merchants";
import { ticketsByPort } from "./tickets";
import { MerchantCard } from "./MerchantCard";
import { MerchantMap } from "./MerchantMap";
import { TicketsSection } from "./TicketsSection";
import { ConsumerSignup } from "./ConsumerSignup";
import { AdSlot } from "./AdSlot";
import { PortFooter } from "./PortFooter";

const BLUE = "#0284c7";
const SKY = "#0ea5e9";

function RImg({ size = 16 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/rocket.png" width={size} height={size} alt="" aria-hidden className="inline-block shrink-0" style={{ objectFit: "contain" }} />;
}

// cruise.plus/<Port-Slug> — the consumer (retail) page for one port, off the same
// merchant/ticket data the crew app uses.
export async function PortPage({ portName }: { portName: string }) {
  const merchants = await merchantsByPort(portName);
  const tickets = await ticketsByPort(portName);
  const city = portName.split(",")[0];
  const cards = merchants.map((m) => ({
    name: m.name, cat: `${m.category} · ${city}`, rating: Math.round(Number(m.rating)),
    reviews: m.reviewCount, perk: m.perk ?? "", price: m.priceLevel, images: (m.images ?? []) as string[], href: `/m/${m.slug}`,
  }));
  const pins = merchants.filter((m) => m.lat != null && m.lon != null).map((m) => ({ name: m.name, slug: m.slug, lat: Number(m.lat), lon: Number(m.lon), perk: m.perk }));

  return (
    <main className="min-h-[100dvh] bg-white" style={{ color: "#0a0e17" }}>
      <nav className="sticky top-0 z-40 flex items-center justify-between border-b bg-white/90 px-5 py-3 backdrop-blur sm:px-8" style={{ borderColor: "#e2e8f0" }}>
        <a href="/" className="flex items-center gap-2 text-lg font-extrabold"><RImg size={24} /> Cruise<span style={{ color: BLUE }}>.Plus</span></a>
        <div className="hidden items-center gap-6 text-sm font-semibold md:flex" style={{ color: "#334155" }}>
          <a href="/#ports" className="hover:opacity-70">All ports</a>
          <a href="https://crewperk.com" className="hover:opacity-70">Crew</a>
          <a href="#offers" className="rounded-full px-4 py-2 text-white" style={{ background: BLUE }}>Get discounts</a>
        </div>
      </nav>

      <header className="px-5 py-12 sm:px-8 sm:py-16" style={{ background: `linear-gradient(180deg, #eff8fe, #ffffff)` }}>
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold" style={{ background: "#e0f2fe", color: BLUE }}>📍 {portName}</div>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">Your day in {city}, sorted.</h1>
            <p className="mt-4 max-w-xl text-lg" style={{ color: "#64748b" }}>Hand-picked food, beaches, excursions, and experiences — with exclusive discounts when you activate.</p>
          </div>
          <div id="offers"><ConsumerSignup port={portName} /></div>
        </div>
      </header>

      <section className="px-5 pt-6 sm:px-8"><div className="mx-auto max-w-6xl"><AdSlot port={portName} variant="banner" /></div></section>

      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Top spots in {city}</h2>
          {cards.length === 0 ? (
            <div className="mt-5 rounded-2xl border p-8 text-center" style={{ borderColor: "#e2e8f0", color: "#64748b" }}>We&apos;re lining up partners in {city} now. Add your email above to be first to know.</div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{cards.map((m) => <MerchantCard key={m.href} m={m} />)}</div>
          )}
        </div>
      </section>

      {tickets.length > 0 && <TicketsSection tickets={tickets} title={`Experiences in ${city}`} />}

      {pins.length > 0 && (
        <section className="px-5 py-12 sm:px-8" style={{ background: "#f8fafc" }}>
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-extrabold sm:text-3xl">On the map</h2>
            <div className="mt-6"><MerchantMap pins={pins} port={portName} /></div>
          </div>
        </section>
      )}

      <PortFooter />
    </main>
  );
}
