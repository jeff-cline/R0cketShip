import type { Tenant } from "@/src/tenant/types";
import { TIERS, TIER_FOOTNOTES } from "./tiers";
import { Tools } from "./Tools";
import { LeadForm } from "./LeadForm";

const TEAL = "#0d7377";
const DEEP = "#0f5257";
const ORANGE = "#ff5b2e";

// worldchangers.ai — the joint Krystalore × R0cketShip landing site. Teal (her
// brand) leads, R0cketShip orange is the accent. Sits on top of the core: leads
// flow to /api/business-lead, god accounts reach the /opportunities board.
export function WorldChangersLander({ tenant }: { tenant: Tenant }) {
  void tenant;
  return (
    <div style={{ background: "#fff", color: "#0b2a2c" }}>
      <Nav />
      <Hero />
      <Values />
      <Pricing />
      <ToolsSection />
      <Contact />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur" style={{ background: "rgba(255,255,255,.82)", borderBottom: "1px solid #e6eaf1" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <a href="/" className="flex items-center gap-2 font-extrabold">
          <span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: `linear-gradient(135deg, ${TEAL}, ${ORANGE})` }}>★</span>
          worldchangers<span style={{ color: ORANGE }}>.ai</span>
        </a>
        <nav className="hidden items-center gap-6 text-sm font-semibold md:flex" style={{ color: "#3a5254" }}>
          <a href="#pricing" className="hover:opacity-70">THRIVE Tiers</a>
          <a href="#tools" className="hover:opacity-70">Tools</a>
          <a href="#contact" className="hover:opacity-70">Contact</a>
          <a href="/login" className="hover:opacity-70" style={{ color: "#8b97ad" }}>Partner login</a>
        </nav>
        <a href="#contact" className="btn btn-primary" style={{ background: TEAL }}>Talk to us</a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${DEEP} 0%, ${TEAL} 55%, #0a3d40 100%)` }}>
      <div className="grid-bg-dark absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-6xl px-6 py-24 text-center">
        <span className="chip" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>Krystalore × R0cketShip</span>
        <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
          The Founder&apos;s Edge —{" "}
          <span style={{ color: "#fff", textShadow: `0 0 22px ${ORANGE}, 0 0 44px color-mix(in srgb, ${ORANGE} 60%, transparent)` }}>Your Secret Weapon</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-white/80">
          People First. Tech-Backed. Change the world without needing a vacation from your life.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <a href="#pricing" className="btn" style={{ background: ORANGE, color: "#fff" }}>See the THRIVE tiers</a>
          <a href="#tools" className="btn" style={{ background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.25)" }}>Try the calculators</a>
        </div>
        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-4 text-white">
          {[
            ["People First", "Coaching from Krystalore"],
            ["Tech-Backed", "Predictive data from R0cketShip"],
            ["6 Tiers", "From $1,500 to Secret Weapon"],
          ].map(([h, s]) => (
            <div key={h}>
              <div className="text-2xl font-extrabold">{h}</div>
              <div className="mt-1 text-xs text-white/60">{s}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Values() {
  const items = [
    { icon: "🤝", title: "People First", body: "Krystalore's leadership coaching keeps you — and your crew — at the center. Growth that fits your life, not the other way around." },
    { icon: "⚡", title: "Tech-Backed", body: "R0cketShip predictive data shows who's in-market before your competitors know they exist. The core does the heavy lifting." },
    { icon: "🌍", title: "Change the World", body: "Scale your impact without burning out. The Founder's Edge is the unfair advantage that lets you thrive, not just survive." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((i) => (
          <div key={i.title} className="card p-7">
            <div className="text-3xl">{i.icon}</div>
            <h3 className="mt-3 text-xl font-extrabold" style={{ color: TEAL }}>{i.title}</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "#4a6264" }}>{i.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="px-6 py-20" style={{ background: "#f4f7f7" }}>
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="label" style={{ color: ORANGE }}>The THRIVE Ladder</span>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight">Start where you are. Explode when you&apos;re ready.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm" style={{ color: "#4a6264" }}>
            Every tier sits on top of the core and includes tech &amp; business consulting — unlimited emails.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TIERS.map((t) => {
            const highlight = t.secretWeapon || t.featured;
            return (
              <div
                key={t.key}
                className="card flex flex-col p-6"
                style={
                  t.secretWeapon
                    ? { background: `linear-gradient(160deg, ${DEEP}, #0a3d40)`, color: "#fff", borderColor: ORANGE, boxShadow: `0 20px 50px -20px ${ORANGE}` }
                    : t.featured
                    ? { borderColor: TEAL, boxShadow: `0 14px 40px -18px ${TEAL}` }
                    : undefined
                }
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl font-extrabold tracking-tight" style={{ color: t.secretWeapon ? "#fff" : TEAL }}>{t.name}</span>
                  {t.secretWeapon && <span className="chip" style={{ background: ORANGE, color: "#fff" }}>Secret Weapon</span>}
                  {t.featured && <span className="chip" style={{ background: "color-mix(in srgb, #0d7377 14%, #fff)", color: TEAL }}>Popular</span>}
                </div>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-extrabold" style={{ color: t.secretWeapon ? "#fff" : "inherit" }}>{t.price}</span>
                  <span className="mb-1 text-sm" style={{ color: t.secretWeapon ? "rgba(255,255,255,.6)" : "#8b97ad" }}>/mo</span>
                </div>
                <p className="mt-1 text-sm font-medium" style={{ color: t.secretWeapon ? "rgba(255,255,255,.75)" : ORANGE }}>{t.tagline}</p>
                <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2" style={{ color: t.secretWeapon ? "rgba(255,255,255,.85)" : "#37474a" }}>
                      <span style={{ color: t.secretWeapon ? ORANGE : TEAL }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href="#contact" className="btn mt-6" style={highlight ? { background: ORANGE, color: "#fff" } : { background: TEAL, color: "#fff" }}>
                  {t.secretWeapon ? "Unlock the Secret Weapon" : `Choose ${t.name}`}
                </a>
              </div>
            );
          })}
        </div>

        <ul className="mx-auto mt-8 max-w-3xl space-y-1 text-center text-xs" style={{ color: "#8b97ad" }}>
          {TIER_FOOTNOTES.map((f) => <li key={f}>* {f}</li>)}
        </ul>
      </div>
    </section>
  );
}

function ToolsSection() {
  return (
    <section id="tools" className="mx-auto max-w-6xl px-6 py-20">
      <div className="text-center">
        <span className="label" style={{ color: ORANGE }}>Interactive tools</span>
        <h2 className="mt-2 text-4xl font-extrabold tracking-tight">Play with the numbers.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm" style={{ color: "#4a6264" }}>
          Model your growth, find your tier, and see what exclusive keyword calls could add. Live, instant, no signup.
        </p>
      </div>
      <div className="mt-10">
        <Tools />
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="px-6 py-20" style={{ background: "#f4f7f7" }}>
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
        <div>
          <span className="label" style={{ color: ORANGE }}>Let&apos;s talk</span>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight">Your secret weapon starts with a conversation.</h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "#4a6264" }}>
            Tell us where you want to go. Krystalore brings the people side, R0cketShip brings the tech, and the core connects it all. We&apos;ll point you to the right tier — or build something custom.
          </p>
          <div className="mt-6 space-y-2 text-sm" style={{ color: "#37474a" }}>
            <p>📍 5869 Av. Isla Verde, Carolina, Puerto Rico</p>
            <p>✉️ <a href="mailto:krystalore@thecrewscoach.com" style={{ color: TEAL }}>krystalore@thecrewscoach.com</a></p>
            <p>✉️ <a href="mailto:jeff.cline@me.com" style={{ color: ORANGE }}>jeff.cline@me.com</a></p>
          </div>
        </div>
        <LeadForm />
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-6 py-12" style={{ background: "#0b2a2c", color: "rgba(255,255,255,.7)" }}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 font-extrabold text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: `linear-gradient(135deg, ${TEAL}, ${ORANGE})` }}>★</span>
            worldchangers.ai
          </div>
          <p className="mt-2 text-sm text-white/50">People First. Tech-Backed.</p>
          <p className="mt-1 text-sm text-white/50">5869 Av. Isla Verde, Carolina, Puerto Rico</p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <a href="https://www.krystalorecrews.com" target="_blank" rel="noreferrer" className="hover:text-white" style={{ color: "#7fd3d6" }}>Krystalore Crews →</a>
          <a href="https://r0cketship.com" target="_blank" rel="noreferrer" className="hover:text-white" style={{ color: "#ff8f6b" }}>R0cketShip.com →</a>
          <a href="/login" className="hover:text-white text-white/40">Partner login</a>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t pt-6 text-xs text-white/35" style={{ borderColor: "rgba(255,255,255,.1)" }}>
        © {"2026"} worldchangers.ai — a Krystalore × R0cketShip joint venture.
      </div>
    </footer>
  );
}
