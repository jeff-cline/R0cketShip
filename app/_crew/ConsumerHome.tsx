import { ConsumerSignup } from "./ConsumerSignup";
import { PortFooter } from "./PortFooter";
import { portSlug } from "./ports";
import { rankedPorts, REGION_COLOR } from "./portData";

const BLUE = "#0284c7";
const SKY = "#0ea5e9";

function RImg({ size = 16 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/rocket.png" width={size} height={size} alt="" aria-hidden className="inline-block shrink-0" style={{ objectFit: "contain" }} />;
}

const STATUS_LABEL: Record<string, { t: string; c: string } | undefined> = {
  live: { t: "Live", c: "#16a34a" },
  building: { t: "Opening soon", c: SKY },
};

// cruise.plus — the consumer master. One home for every port; users sign up for
// updates + offers, then jump into their port page (cruise.plus/<Port-Slug>).
export function ConsumerHome() {
  const featured = rankedPorts().slice(0, 12);

  return (
    <main className="min-h-[100dvh] bg-white" style={{ color: "#0a0e17" }}>
      <nav className="sticky top-0 z-40 flex items-center justify-between border-b bg-white/90 px-5 py-3 backdrop-blur sm:px-8" style={{ borderColor: "#e2e8f0" }}>
        <a href="/" className="flex items-center gap-2 text-lg font-extrabold"><RImg size={24} /> Cruise<span style={{ color: BLUE }}>.Plus</span></a>
        <div className="hidden items-center gap-6 text-sm font-semibold md:flex" style={{ color: "#334155" }}>
          <a href="#ports" className="hover:opacity-70">Ports</a>
          <a href="#how" className="hover:opacity-70">How it works</a>
          <a href="https://crewperk.com" className="hover:opacity-70">Crew</a>
          <a href="#offers" className="rounded-full px-4 py-2 text-white" style={{ background: BLUE }}>Get discounts</a>
        </div>
        <a href="#offers" className="rounded-full px-4 py-2 text-sm font-semibold text-white md:hidden" style={{ background: BLUE }}>Offers</a>
      </nav>

      <header className="px-5 py-14 sm:px-8 sm:py-20" style={{ background: "linear-gradient(180deg,#eff8fe,#ffffff)" }}>
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold" style={{ background: "#e0f2fe", color: BLUE }}>🛳️ Every cruise port, one app</div>
            <h1 className="text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-6xl">Every port. Every deal.<br />One pass.</h1>
            <p className="mt-4 max-w-xl text-lg" style={{ color: "#64748b" }}>
              The best food, beaches, excursions, and experiences at every cruise port — with exclusive discounts you activate the moment you dock.
            </p>
            <a href="#ports" className="mt-6 inline-block rounded-full px-6 py-3 font-bold text-white" style={{ background: BLUE }}>Find your port →</a>
          </div>
          <div id="offers"><ConsumerSignup /></div>
        </div>
      </header>

      {/* Featured ports */}
      <section id="ports" className="px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Popular ports</h2>
          <p className="mt-1 text-sm" style={{ color: "#64748b" }}>Tap your port for local deals — full list in the footer.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => {
              const s = STATUS_LABEL[p.status];
              return (
                <a key={p.name} href={`/${portSlug(p.name)}`} className="group flex flex-col rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: "#e2e8f0" }}>
                  <div className="flex items-center justify-between">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: REGION_COLOR[p.region] ?? "#94a3b8" }} />
                    {s && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: s.c }}>{s.t}</span>}
                  </div>
                  <div className="mt-2 text-lg font-extrabold">{p.name.split(",")[0]}</div>
                  <div className="text-xs" style={{ color: "#94a3b8" }}>{p.country} · {p.pax}M visitors/yr</div>
                  <span className="mt-3 text-sm font-bold transition-transform group-hover:translate-x-0.5" style={{ color: BLUE }}>See deals →</span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-5 py-14 sm:px-8" style={{ background: "#f8fafc" }}>
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Save in three taps</h2>
          <div className="mt-9 grid gap-5 sm:grid-cols-3">
            {[
              { t: "Pick your port", d: "We auto-detect where you are — or choose from every cruise port worldwide." },
              { t: "Activate offers", d: "Sign up free to unlock crew-vetted discounts on food, beaches, and excursions." },
              { t: "Show & save", d: "Flash your pass at the venue — instant savings, every port you visit." },
            ].map((s, i) => (
              <div key={s.t} className="rounded-2xl border bg-white p-5 text-left shadow-sm" style={{ borderColor: "#e2e8f0" }}>
                <div className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white" style={{ background: i === 1 ? SKY : BLUE }}>{i + 1}</div>
                <div className="mt-3 font-bold">{s.t}</div>
                <div className="mt-1 text-sm" style={{ color: "#64748b" }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PortFooter />
    </main>
  );
}
