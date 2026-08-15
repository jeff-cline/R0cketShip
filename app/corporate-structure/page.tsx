import type { Metadata } from "next";
import Link from "next/link";
import { INDUSTRIES, SERVICES, type Industry } from "./industries";
import { HomeRocket } from "@/app/_components/HomeRocket";

export const metadata: Metadata = {
  title: "Corporate Structure — R0cketShip Holdings",
  description: "The R0cketShip Holdings ecosystem: a holding company, six shared-services companies, and 40 operating divisions on one master tech stack.",
  robots: { index: false, follow: false },
};

const ACCENT = "#ff5b2e";

function Rocket({ size = 22 }: { size?: number }) {
  // Canonical R0cketShip rocket-ship image (public/rocket.png).
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/rocket.png" width={size} height={size} alt="" aria-hidden className="inline-block shrink-0" style={{ objectFit: "contain" }} />;
}

function DivisionCard({ d }: { d: Industry }) {
  const href = d.href ?? `/corporate-structure/${d.slug}`;
  return (
    <Link
      href={href}
      className="group relative flex flex-col rounded-2xl border p-5 transition-all hover:-translate-y-0.5"
      style={{ borderColor: "rgba(255,255,255,.10)", background: "rgba(255,255,255,.025)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-white/35">{d.group}</span>
        <Rocket size={14} />
      </div>
      <div className="mt-2 text-lg font-extrabold leading-tight text-white">{d.name}</div>
      <div className="mt-1.5 flex-1 text-sm leading-relaxed text-white/55">{d.tagline}</div>
      <div className="mt-4 flex items-center gap-1.5 text-xs font-bold transition-colors" style={{ color: ACCENT }}>
        View proposal
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </div>
    </Link>
  );
}

export default function CorporateStructure() {
  return (
    <main className="grid-bg-dark min-h-[100dvh] overflow-hidden" style={{ background: "radial-gradient(120% 70% at 80% -10%, #161d2e, #0a0e17 55%)" }}>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">

        {/* Holding company */}
        <header className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-white" style={{ background: "color-mix(in srgb, #ff5b2e 26%, transparent)" }}>
            <Rocket size={15} /> Ecosystem Map · 2025 / 2026
          </div>
          <h1 className="font-serif-display flame-text mx-auto flex flex-wrap items-center justify-center gap-3 text-5xl font-extrabold tracking-tight sm:text-7xl">
            <Rocket size={52} /> R0cketShip Holdings
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/65 sm:text-xl">
            One holding company owns the IP, domains, and master tech stack. Six shared-services companies
            run the engine. Forty operating divisions scale it into every market — joint ventures, roll-ups,
            and new-cos on a single platform.
          </p>
        </header>

        {/* Shared services */}
        <section className="mt-16">
          <div className="mb-5 flex items-center gap-3">
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Management &amp; Shared Services</span>
            <span className="h-px flex-1" style={{ background: "rgba(255,255,255,.10)" }} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <div key={s.code} className="rounded-2xl border p-5" style={{ borderColor: "rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)" }}>
                <div className="flex items-center gap-2">
                  <Rocket size={15} />
                  <span className="text-sm font-extrabold tracking-wide text-white">{s.code}</span>
                  <span className="text-xs text-white/40">{s.name}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{s.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Operating divisions */}
        <section className="mt-16">
          <div className="mb-5 flex items-center gap-3">
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Operating Divisions · Revenue Generating</span>
            <span className="h-px flex-1" style={{ background: "rgba(255,255,255,.10)" }} />
            <span className="text-xs font-semibold text-white/40">{INDUSTRIES.length} verticals</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {INDUSTRIES.map((d) => <DivisionCard key={d.slug} d={d} />)}
          </div>
        </section>

        {/* Footer band */}
        <footer className="mt-20 border-t pt-12 text-center" style={{ borderColor: "rgba(255,255,255,.10)" }}>
          <p className="font-serif-display flame-text mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3 text-2xl font-extrabold leading-tight sm:text-4xl">
            &ldquo;Every industry is a geek away from being Uberized.&rdquo; — R0cketShip <Rocket size={34} />
          </p>
          <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-white/45">
            One master tech stack · Unlimited vertical scale
          </p>
        </footer>
      </div>

      <HomeRocket />
    </main>
  );
}
