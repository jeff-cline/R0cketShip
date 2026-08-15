import type { Tenant } from "@/src/tenant/types";
import { marketingContent } from "@/src/marketing/content";
import { INDUSTRIES } from "@/app/corporate-structure/industries";
import { HubContact } from "./HubContact";
import { HubHero } from "./HubHero";

// The r0cketship.com (hub) homepage — a bold orange/black statement page.
// HUB ONLY: rendered exclusively when the tenant domain is r0cketship.com, so no
// white-label is affected. All backend-editable data (offers, footerHtml, hero
// headline/subhead) still flows through marketingContent(tenant) and is re-used
// here, so the back office stays in control of it.

const ACCENT = "#ff5b2e";

function RImg({ size = 16, className = "" }: { size?: number; className?: string }) {
  // Canonical R0cketShip rocket-ship image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/rocket.png" width={size} height={size} alt="" aria-hidden className={`inline-block shrink-0 ${className}`} style={{ objectFit: "contain" }} />;
}

/** Wordmark with the zero rendered in the brand orange. */
function Brand({ className = "" }: { className?: string }) {
  return <span className={className}>R<span style={{ color: ACCENT }}>0</span>cketShip</span>;
}

const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/integrations", label: "Integrations" },
  { href: "/niches", label: "Common niches" },
  { href: "/advertise", label: "Advertise" },
  { href: "/crewperk", label: "Crew Perks" },
  { href: "/investor-portal", label: "Investors" },
  { href: "/radar", label: "Become a Business Development Partner" },
  { href: "/login", label: "Sign in" },
  { href: "/signup", label: "Get $50 free credit" },
];

// Real-life-style testimonials (first name + state). Scrolled, pause on hover.
const TESTIMONIALS = [
  { q: "The predictive data put us in front of buyers before anyone else even knew they were shopping. Game changer.", a: "Marcus", s: "Texas" },
  { q: "We stopped guessing and started closing. Our calendar fills itself now.", a: "Priya", s: "Georgia" },
  { q: "I was skeptical about the AI angle. Two months in, it's the best money we spend every month.", a: "Danielle", s: "Ohio" },
  { q: "Exclusive by ZIP means no more bidding wars. We own our backyard now.", a: "Tony", s: "New Jersey" },
  { q: "The door-knock lists alone pay for the whole platform. My crews waste zero time.", a: "Reggie", s: "Florida" },
  { q: "Felt like joining a movement, not buying software. A rising tide really does lift all boats.", a: "Sarah", s: "Colorado" },
  { q: "Plugged straight into our CRM. Leads show up while we sleep.", a: "Hector", s: "Arizona" },
  { q: "These guys are three steps ahead. If you're not in, you're already behind.", a: "Brittany", s: "Tennessee" },
  { q: "Our close rate nearly doubled. The intent data is the real deal.", a: "Kevin", s: "Michigan" },
  { q: "People first, tech second — you feel it in how they treat partners. We're all in.", a: "Alyssa", s: "Washington" },
];

export function HubLander({ tenant }: { tenant: Tenant }) {
  const c = marketingContent(tenant);
  const featuredNiches = INDUSTRIES.slice(0, 9);

  return (
    <main className="grid-bg-dark overflow-hidden" style={{ background: "radial-gradient(120% 60% at 80% -8%, #1a1322, #06080d 55%)", color: "#fff" }}>
      {/* Minimal hub nav — the standard nav links live in the footer now. */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-5 py-4 backdrop-blur sm:px-8" style={{ background: "rgba(6,8,13,.66)", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <a href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight"><RImg size={26} /> <Brand /></a>
        <a href="/corporate-structure" className="rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-white/5" style={{ borderColor: "rgba(255,255,255,.2)" }}>
          Corporate structure →
        </a>
      </nav>

      {/* HERO — interactive video hero (client component).
          The film is the tenant's heroVideo, uploaded via /admin/branding and
          stored by the core upload API (public/uploads, out of git). */}
      <HubHero videoSrc={c.heroVideo} />

      {/* UBERIZED quote band */}
      <section className="px-5 py-20 text-center sm:px-8" style={{ background: "#000" }}>
        <div className="mx-auto max-w-4xl">
          <div className="text-4xl">🔥</div>
          <blockquote className="font-serif-display flame-text mx-auto mt-4 max-w-3xl text-4xl font-extrabold leading-[1.08] sm:text-6xl">
            &ldquo;Every industry is a geek away from being Uberized.&rdquo;
          </blockquote>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold text-white" style={{ background: "color-mix(in srgb, #ff5b2e 22%, transparent)" }}>
            — Jeff Cline
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/55">
            If you&apos;re not growing, you&apos;re dying. If you&apos;re not already in the process, you&apos;re already behind — and now you know it.
          </p>
        </div>
      </section>

      {/* Manifesto / ARTLAB */}
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          {[
            { t: "A rising tide lifts all boats", d: "Working together, everyone in the network rises. We win when our partners win — by design, not by accident." },
            { t: "#ARTLAB mentality", d: "Relentless invention. We treat every vertical as a lab: test, learn, automate, and scale what works across the whole platform." },
            { t: "People on fire, powered by AI", d: "The best and brightest, armed with proprietary tech and unique data. AI is the multiplier — people are the point." },
          ].map((b) => (
            <div key={b.t} className="rounded-2xl border p-6" style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)" }}>
              <div className="flex items-center gap-2 text-lg font-extrabold text-white"><RImg size={18} /> {b.t}</div>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scrolling testimonials */}
      <section className="py-14">
        <h2 className="px-5 text-center text-sm font-bold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>Operators already rising with us</h2>
        <div className="marquee mt-8">
          <div className="marquee-track gap-4">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div key={i} className="w-[320px] shrink-0 rounded-2xl border p-5" style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)" }}>
                <div className="text-sm leading-relaxed text-white/90">&ldquo;{t.q}&rdquo;</div>
                <div className="mt-3 flex items-center gap-2 text-sm font-semibold" style={{ color: ACCENT }}><RImg size={14} /> {t.a} · {t.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Separator between testimonials and niches */}
      <section className="px-5 py-12 text-center sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-serif-display flame-text text-3xl font-extrabold sm:text-4xl">Forty niches live today.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/55">
            These are the top forty of what we believe will one day be <span className="font-semibold text-white">1,800 operating entities</span> — every one of them a geek away from being Uberized.
          </p>
        </div>
      </section>

      {/* Scrolling niches */}
      <section className="pb-4">
        <div className="marquee">
          <div className="marquee-track fast gap-3 px-2">
            {[...INDUSTRIES, ...INDUSTRIES].map((n, i) => (
              <a key={i} href={n.href ?? `/corporate-structure/${n.slug}`} className="flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-white/80 transition hover:text-white" style={{ borderColor: "rgba(255,255,255,.14)", background: "rgba(255,255,255,.03)" }}>
                <RImg size={14} /> {n.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Featured niches */}
      <section className="px-5 pb-20 pt-10 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>Featured niches</h3>
            <a href="/corporate-structure" className="text-sm font-bold" style={{ color: ACCENT }}>See all →</a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredNiches.map((n) => (
              <a key={n.slug} href={n.href ?? `/corporate-structure/${n.slug}`} className="group flex flex-col rounded-2xl border p-5 transition-all hover:-translate-y-0.5" style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(255,255,255,.025)" }}>
                <div className="flex items-center gap-2 text-lg font-extrabold text-white"><RImg size={16} /> {n.name}</div>
                <div className="mt-1.5 flex-1 text-sm leading-relaxed text-white/55">{n.tagline}</div>
                <span className="mt-3 text-sm font-bold transition-transform group-hover:translate-x-0.5" style={{ color: ACCENT }}>View →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FEATURED: backend-editable content, re-styled ───── */}

      {/* Stats */}
      <section className="px-5 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-12 gap-y-6 rounded-3xl border px-8 py-8" style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)" }}>
          {c.stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold" style={{ color: ACCENT }}>{s.value}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-white/50">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif-display text-center text-3xl font-extrabold sm:text-4xl">Your unfair advantage</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.features.map((f) => (
              <div key={f.title} className="rounded-2xl border p-6" style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)" }}>
                <RImg size={22} />
                <div className="mt-3 font-bold text-white">{f.title}</div>
                <div className="mt-1 text-sm leading-relaxed text-white/60">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif-display text-center text-3xl font-extrabold sm:text-4xl">How it works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {c.steps.map((s, i) => (
              <div key={s.title}>
                <div className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white" style={{ background: ACCENT }}>{i + 1}</div>
                <div className="mt-3 font-semibold text-white">{s.title}</div>
                <div className="mt-1 text-sm leading-relaxed text-white/55">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing (editable offers) */}
      <section className="px-5 pb-20 sm:px-8" style={{ background: "#000" }}>
        <div className="mx-auto max-w-6xl pt-20">
          <h2 className="font-serif-display text-center text-3xl font-extrabold sm:text-4xl">Quick-start with predictive data</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-white/55">Exclusive by ZIP. Pick your lane and launch.</p>
          <div className="mt-12 grid items-stretch gap-5 md:grid-cols-3">
            {c.offers.map((o, i) => {
              const featured = i === 1;
              const feats = (o.features ?? []).filter((f) => f && f.trim());
              return (
                <div key={o.id} className="flex flex-col rounded-3xl p-8" style={featured ? { background: ACCENT, color: "#0a0e17" } : { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.12)" }}>
                  {featured && <div className="mb-3 inline-block self-start rounded-full bg-black/85 px-3 py-1 text-xs font-extrabold text-white">MOST POPULAR</div>}
                  <div className="text-lg font-extrabold">{o.title}</div>
                  <div className="mt-3 text-4xl font-extrabold tracking-tight">{o.price}</div>
                  <div className={`mt-3 text-sm ${featured ? "text-black/75" : "text-white/65"}`}>{o.description}</div>
                  {feats.length > 0 && (
                    <ul className="mt-6 flex flex-col gap-3">
                      {feats.map((f, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm leading-snug">
                          <span className="mt-0.5"><RImg size={15} /></span>
                          <span className={featured ? "text-black/85" : "text-white/85"}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <a href="/signup" className="mt-auto block rounded-full py-3.5 text-center font-bold" style={{ marginTop: feats.length ? "1.75rem" : "auto", ...(featured ? { background: "#0a0e17", color: "#fff" } : { border: `1.5px solid ${ACCENT}`, color: ACCENT }) }}>Get started</a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-5 py-24 text-center sm:px-8">
        <RImg size={56} className="drop-shadow-[0_6px_24px_rgba(255,91,46,.5)]" />
        <h2 className="font-serif-display flame-text mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
          Holy crap — the future is now,<br />and you can be part of it.
        </h2>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <a href="/advertise" className="rounded-full px-7 py-3.5 font-bold text-white" style={{ background: ACCENT, boxShadow: "0 10px 30px -8px rgba(255,91,46,.6)" }}>Advertise with us</a>
          <a href="/e-partnership" className="rounded-full border px-7 py-3.5 font-bold text-white hover:bg-white/5" style={{ borderColor: "rgba(255,255,255,.28)" }}>Joint venture with us</a>
        </div>
        <p className="mt-8 text-sm text-white/40">Built by <span className="font-semibold text-white/70">Jeff Cline</span> · <Brand className="text-white/70" /> Holdings</p>
      </section>

      {/* FOOTER */}
      <footer className="px-5 pb-12 pt-14 sm:px-8" style={{ background: "#06080d", borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <a href="/" className="flex items-center gap-2 text-lg font-extrabold"><RImg size={24} /> <Brand /></a>
            <p className="mt-3 text-sm leading-relaxed text-white/50">Technology-powered, multi-service company platform. People first. People on fire. 🔥</p>
            <a href="/corporate-structure" className="mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-white/5" style={{ borderColor: "rgba(255,255,255,.2)" }}>
              <RImg /> Corporate structure
            </a>
            <p className="mt-4 text-xs text-white/35">Jeff Cline · R0cketShip Holdings</p>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Explore</div>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-white/55">
              {NAV_LINKS.map((l) => (
                <li key={l.href}><a href={l.href} className="flex items-center gap-2 transition-colors hover:text-white"><RImg /> {l.label}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Contact</div>
            <div className="mt-4"><HubContact /></div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>More</div>
            {/* Backend-editable footer content, preserved verbatim. */}
            <div className="mt-4 text-sm leading-relaxed text-white/45 [&_a]:underline [&_a:hover]:text-white" dangerouslySetInnerHTML={{ __html: c.footerHtml }} />
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-6xl border-t pt-12 text-center" style={{ borderColor: "rgba(255,255,255,.08)" }}>
          <p className="font-serif-display flame-text mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3 text-2xl font-extrabold leading-tight sm:text-4xl">
            &ldquo;Every industry is a geek away from being Uberized.&rdquo; — R0cketShip <RImg size={34} />
          </p>
          <p className="mt-6 text-xs text-white/30">© R0cketShip Holdings · Jeff Cline</p>
        </div>
      </footer>
    </main>
  );
}
