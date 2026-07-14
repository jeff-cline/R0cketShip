"use client";

import { useState } from "react";

// CrewPerk — the crew-only "secret knock" marketing lander. Captures early-access
// leads into the God Business-Leads CRM (source: "crew"). The full white-label
// crew engine (logins, points, QR, ports, datamoon tagging) is built page-by-page
// after this lander ships.

const ACCENT = "#ff5b2e";   // rocket orange
const TEAL = "#22d3ee";     // crew / ocean accent

function RImg({ size = 16, className = "" }: { size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/rocket.png" width={size} height={size} alt="" aria-hidden className={`inline-block shrink-0 ${className}`} style={{ objectFit: "contain" }} />;
}

const PERKS = [
  ["Crew-only pricing", "Rates the public never sees — just for the people who run the ships."],
  ["Local experiences", "Curated things to do in your few hours ashore, ranked by other crew."],
  ["Transportation discounts", "Get to the beach, the bar, and back to the ship without overpaying."],
  ["Food & drink specials", "Free appetizers, 2-for-1s, and crew tabs at verified local spots."],
  ["Beach access", "Day passes and crew-only access at partner beaches and clubs."],
  ["Adventure excursions", "Dive, hike, zip, and ride — at crew prices, bookable in minutes."],
  ["Wellness & recovery", "Gyms, spas, massage, and recovery offers for life at sea."],
  ["Crew networking events", "Meet crew from other ships in every port — our events, your people."],
  ["Verified local partners", "Every merchant is vetted by crew, for crew. No tourist traps."],
];

type Fields = { name: string; email: string; ship: string; port: string };

export function CrewPerkLander() {
  const [f, setF] = useState<Fields>({ name: "", email: "", ship: "", port: "" });
  const [done, setDone] = useState(false);
  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch("/api/business-lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "crew", name: f.name, email: f.email, company: f.ship, message: `Current/next port: ${f.port}`, meta: { ship: f.ship, port: f.port, crew: true } }),
    }).catch(() => {});
    setDone(true);
  };

  return (
    <main className="grid-bg-dark relative min-h-[100dvh] overflow-hidden" style={{ background: "radial-gradient(120% 60% at 80% -8%, #08243a, #06080d 55%)", color: "#fff" }}>
      <nav className="sticky top-0 z-40 flex items-center justify-between px-5 py-4 backdrop-blur sm:px-8" style={{ background: "rgba(6,8,13,.66)", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <a href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight"><RImg size={26} /> Crew<span style={{ color: TEAL }}>Perk</span></a>
        <a href="#access" className="rounded-full px-4 py-2 text-sm font-bold text-white" style={{ background: ACCENT }}>Get crew access</a>
      </nav>

      {/* Hero */}
      <header className="mx-auto max-w-4xl px-5 pb-12 pt-16 text-center sm:px-8 sm:pt-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold" style={{ background: "color-mix(in srgb, #22d3ee 22%, transparent)", color: "#cffafe" }}>
          🤫 The secret knock — crew only
        </div>
        <h1 className="font-serif-display flame-text mx-auto max-w-3xl text-5xl font-extrabold leading-[1.02] sm:text-7xl">CrewPerk</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/75 sm:text-2xl">
          You run the ship. <span className="font-semibold text-white">Now every port runs for you.</span> Crew-only pricing, local experiences, and perks at verified partners — in every port you hit.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-base text-white/55">
          Not the cruise line. Not for tourists. Built by crew, for crew — starting in Puerto Rico, every port next.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <a href="#access" className="rounded-full px-8 py-4 text-lg font-bold text-white transition active:translate-y-px" style={{ background: ACCENT, boxShadow: "0 10px 30px -8px rgba(255,91,46,.6)" }}>Get crew access</a>
          <a href="#how" className="rounded-full border px-7 py-4 font-bold text-white transition hover:bg-white/5" style={{ borderColor: "rgba(255,255,255,.28)" }}>How it works</a>
        </div>
      </header>

      {/* Perks */}
      <section className="px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif-display text-center text-3xl font-extrabold sm:text-4xl">Everything you need ashore</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PERKS.map(([t, d]) => (
              <div key={t} className="rounded-2xl border p-5" style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)" }}>
                <div className="flex items-center gap-2 text-lg font-bold text-white"><RImg size={18} /> {t}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works / gamified */}
      <section id="how" className="px-5 py-14 sm:px-8" style={{ background: "#000" }}>
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif-display text-center text-3xl font-extrabold sm:text-4xl">Tap in. Earn. Redeem. Repeat.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Unlock over 21 days", d: "Tap “I'm crew” and your perks unlock day by day — full access at day 21. Some perks start on day one." },
              { t: "Rate with rockets", d: "Score venues 1–5 🚀, drop a photo and a comment, and earn points every time you do." },
              { t: "Scan & refer", d: "Scan another crew member's QR — they join, you both win. Refer a cruiser their first time for a big point drop." },
              { t: "Redeem at every port", d: "Cash points for offers, experiences, and prizes — unlock more as you collect more ports." },
            ].map((s, i) => (
              <div key={s.t} className="rounded-2xl border p-5" style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)" }}>
                <div className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white" style={{ background: i % 2 ? TEAL : ACCENT, color: i % 2 ? "#06080d" : "#fff" }}>{i + 1}</div>
                <div className="mt-3 font-bold text-white">{s.t}</div>
                <div className="mt-1 text-sm leading-relaxed text-white/60">{s.d}</div>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-white/45">
            Points are real — every point is worth a penny toward perks. The more you review, refer, and explore, the more you bank.
          </p>
        </div>
      </section>

      {/* Access form */}
      <section id="access" className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-md rounded-2xl border p-6 sm:p-8" style={{ borderColor: "color-mix(in srgb, #22d3ee 40%, transparent)", background: "linear-gradient(180deg, rgba(34,211,238,.06), rgba(255,255,255,.03))" }}>
          {done ? (
            <div className="text-center">
              <RImg size={44} className="mx-auto" />
              <h3 className="mt-4 text-2xl font-extrabold text-white">You're on the list.</h3>
              <p className="mt-2 text-white/65">We'll send your CrewPerk access as we light up your ports. Welcome to the secret knock. 🤫</p>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest" style={{ color: TEAL }}><RImg size={15} /> Crew early access</div>
              <h3 className="mt-2 text-2xl font-extrabold text-white">Are you crew? Get in.</h3>
              <p className="mt-1 text-sm text-white/55">Free for crew. We'll text/email your access as ports go live.</p>
              <div className="mt-4 grid gap-3">
                <input required value={f.name} onChange={set("name")} placeholder="Name" className="rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30" style={{ borderColor: "rgba(255,255,255,.14)" }} />
                <input required type="email" value={f.email} onChange={set("email")} placeholder="Email" className="rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30" style={{ borderColor: "rgba(255,255,255,.14)" }} />
                <input value={f.ship} onChange={set("ship")} placeholder="Your ship (optional)" className="rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30" style={{ borderColor: "rgba(255,255,255,.14)" }} />
                <input value={f.port} onChange={set("port")} placeholder="Current / next port (optional)" className="rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30" style={{ borderColor: "rgba(255,255,255,.14)" }} />
              </div>
              <button type="submit" className="mt-5 w-full rounded-xl py-3 font-bold text-white transition active:translate-y-px" style={{ background: ACCENT }}>Get crew access →</button>
              <p className="mt-2 text-center text-xs text-white/35">We're not affiliated with any cruise line. Your info stays with us.</p>
            </form>
          )}
        </div>
      </section>

      {/* Investors / Business — the case study lives here */}
      <section id="business" className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl p-8 text-center sm:p-12" style={{ background: ACCENT, color: "#0a0e17" }}>
          <div className="text-sm font-extrabold uppercase tracking-[0.2em]">Investors / Business</div>
          <h2 className="font-serif-display mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">The business behind the secret knock.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base font-medium text-black/80 sm:text-lg">
            A multi-sided platform on the fastest-growing, least-digitized corner of travel — a <b>$271B experiences market only 33% booked online</b>. Four revenue engines, <b>~300K loyal crew</b>, <b>37M+ passengers</b>, and proprietary data at every port. This industry is a geek away from being Uberized — and here we come.
          </p>
          <div className="mt-8 flex flex-col flex-wrap items-center justify-center gap-3 sm:flex-row">
            <a href="/crewperk/CrewPerk-Business-Case.pdf" target="_blank" rel="noopener noreferrer" className="rounded-full px-7 py-4 text-base font-bold text-white" style={{ background: "#0a0e17" }}>Download the Business Case ↓</a>
            <a href="/crewperk/ports" className="rounded-full px-7 py-4 text-base font-bold text-white" style={{ background: "#0a0e17" }}>Port Opportunity Data →</a>
            <a href="/crewperk/CrewPerk-One-Pager.pdf" target="_blank" rel="noopener noreferrer" className="rounded-full border-2 px-7 py-4 text-base font-bold" style={{ borderColor: "rgba(0,0,0,.85)", color: "#0a0e17" }}>One-Pager (PDF) ↓</a>
            <a href="mailto:jeff.cline@me.com?subject=CrewPerk%20%E2%80%94%20Investor%20Inquiry" className="rounded-full border-2 px-7 py-4 text-base font-bold" style={{ borderColor: "rgba(0,0,0,.85)", color: "#0a0e17" }}>Connect with Founder</a>
          </div>
          <p className="mt-5 text-xs font-semibold text-black/55">Confidential · A R0cketShip Holdings company · Jeff Cline</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 pb-16 pt-10 text-center sm:px-8" style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <p className="font-serif-display flame-text mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3 text-2xl font-extrabold leading-tight sm:text-3xl">
          The secret knock for cruise crew. <RImg size={30} />
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-white/55">
          <a href="/" className="hover:text-white">R0cketShip</a>
          <a href="/corporate-structure" className="hover:text-white">Corporate structure</a>
          <a href="/investor-portal" className="hover:text-white">Investors</a>
        </div>
        <p className="mt-6 text-xs text-white/30">© CrewPerk · A R0cketShip Holdings company · Jeff Cline</p>
      </footer>
    </main>
  );
}
