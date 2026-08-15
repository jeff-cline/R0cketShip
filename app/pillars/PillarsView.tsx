"use client";
/**
 * /pillars — how the ecosystem actually works.
 *
 * The corporate-structure page is the map. This is the argument: seven
 * capability pillars, the divisions that live inside them, and the loop that
 * makes each one stronger every time another business or another user joins.
 *
 * Divisions appear in more than one pillar on purpose. A division drawing on a
 * single pillar is not yet part of the ecosystem — the overlap is the thesis.
 */
import { useState } from "react";
import Link from "next/link";
import { PILLARS, THESIS, RISING_TIDE, FLYWHEEL, SERVICES_MAP, type Pillar } from "./pillars-content";
import { INDUSTRIES } from "../corporate-structure/industries";

const ACCENT = "#ff5b2e";
const HEADING_FIX = `
  .pil h1, .pil h2, .pil h3, .pil h4 { color: #fff; }
`;

function Rocket({ size = 22 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/rocket.png" width={size} height={size} alt="" aria-hidden className="inline-block shrink-0" style={{ objectFit: "contain" }} />;
}

const NAME: Record<string, string> = Object.fromEntries(INDUSTRIES.map((i) => [i.slug, i.name]));
const TAG: Record<string, string> = Object.fromEntries(INDUSTRIES.map((i) => [i.slug, i.tagline]));

/** A division chip that links back into the corporate structure. */
function DivisionChip({ slug, color }: { slug: string; color: string }) {
  const name = NAME[slug];
  if (!name) return null;
  return (
    <Link href={`/corporate-structure/${slug}`} title={TAG[slug]}
      className="rounded-lg border px-2.5 py-1.5 text-[12.5px] font-semibold text-white/70 transition-all hover:-translate-y-px hover:text-white"
      style={{ borderColor: "rgba(255,255,255,.12)", background: "rgba(255,255,255,.03)" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; }}>
      {name}
    </Link>
  );
}

function PillarCard({ p, open, onToggle }: { p: Pillar; open: boolean; onToggle: () => void }) {
  return (
    <div id={p.id} className="scroll-mt-24 overflow-hidden rounded-2xl border transition-all"
      style={{ borderColor: open ? `color-mix(in srgb, ${p.color} 55%, transparent)` : "rgba(255,255,255,.1)",
               background: open ? `linear-gradient(150deg, color-mix(in srgb, ${p.color} 10%, transparent), rgba(0,0,0,.25) 60%)` : "rgba(255,255,255,.025)" }}>
      <button type="button" onClick={onToggle} className="w-full p-6 text-left">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl"
              style={{ background: `color-mix(in srgb, ${p.color} 18%, transparent)`, border: `1px solid color-mix(in srgb, ${p.color} 40%, transparent)` }}>
              {p.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold" style={{ color: p.color }}>{p.n}</span>
                <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/35">Pillar</span>
              </div>
              <h3 className="mt-0.5 text-2xl font-extrabold leading-tight">{p.name}</h3>
              <p className="mt-1.5 max-w-2xl text-[15px] font-semibold leading-snug" style={{ color: p.color }}>{p.claim}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-2xl font-extrabold text-white">{p.divisions.length}</div>
              <div className="text-[10.5px] uppercase tracking-wide text-white/35">divisions</div>
            </div>
            <span className="text-xl text-white/35">{open ? "−" : "+"}</span>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t px-6 pb-6" style={{ borderColor: "rgba(255,255,255,.08)" }}>
          <p className="mt-5 max-w-4xl text-[15px] leading-relaxed text-white/60">{p.what}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {p.drives.map((d) => {
              const t = THESIS.find((x) => x.k === d);
              return (
                <span key={d} className="rounded-full px-3 py-1.5 text-[11.5px] font-bold"
                  style={{ background: `color-mix(in srgb, ${p.color} 16%, transparent)`, color: p.color }}>
                  ↓ {t?.title ?? d}
                </span>
              );
            })}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-white/40">Products & capabilities</div>
              <div className="mt-2.5 space-y-2">
                {p.products.map((pr) => {
                  const inner = (
                    <>
                      <div className="text-[13.5px] font-bold text-white">{pr.name}{pr.href && <span style={{ color: p.color }}> →</span>}</div>
                      <div className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">{pr.note}</div>
                    </>
                  );
                  const cls = "block rounded-xl border p-3.5 transition-all";
                  const st = { borderColor: "rgba(255,255,255,.1)", background: "rgba(255,255,255,.02)" };
                  return pr.href ? (
                    pr.href.startsWith("/")
                      ? <Link key={pr.name} href={pr.href} className={`${cls} hover:-translate-y-px`} style={st}>{inner}</Link>
                      : <a key={pr.name} href={pr.href} target="_blank" rel="noopener" className={`${cls} hover:-translate-y-px`} style={st}>{inner}</a>
                  ) : <div key={pr.name} className={cls} style={st}>{inner}</div>;
                })}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-white/40">Powered by</div>
              <div className="mt-2.5 space-y-1.5">
                {p.services.map((code) => (
                  <div key={code} className="flex gap-3 rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,.1)" }}>
                    <span className="font-mono text-[11px] font-extrabold" style={{ color: p.color }}>{code}</span>
                    <span className="text-[12.5px] leading-snug text-white/55">{SERVICES_MAP[code]?.role}</span>
                  </div>
                ))}
              </div>
              {p.proof && (
                <div className="mt-3 rounded-xl border px-3.5 py-2.5"
                  style={{ borderColor: `color-mix(in srgb, ${p.color} 40%, transparent)`, background: `color-mix(in srgb, ${p.color} 8%, transparent)` }}>
                  <div className="text-[10.5px] font-extrabold uppercase tracking-widest" style={{ color: p.color }}>Running today</div>
                  <div className="mt-0.5 text-[12.5px] text-white/65">{p.proof}</div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/40">Divisions in this pillar</span>
              <span className="text-[11px] text-white/25">{p.divisions.length} · from the corporate structure</span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {p.divisions.map((s) => <DivisionChip key={s} slug={s} color={p.color} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PillarsView() {
  const [open, setOpen] = useState<string | null>(PILLARS[0]!.id);

  // How many pillars each division touches — the overlap made visible.
  const reach = INDUSTRIES.map((i) => ({
    slug: i.slug, name: i.name,
    count: PILLARS.filter((p) => p.divisions.includes(i.slug)).length,
  })).filter((x) => x.count > 0).sort((a, b) => b.count - a.count);

  return (
    <main className="pil min-h-[100dvh] text-white" style={{ background: "radial-gradient(120% 70% at 80% -10%, #161d2e, #0a0e17 55%)" }}>
      <style>{HEADING_FIX}</style>

      {/* ── logo, tide line, pillars across the top ── */}
      <header className="mx-auto max-w-6xl px-5 pt-16 text-center sm:px-8 sm:pt-24">
        <h1 className="flex flex-wrap items-center justify-center gap-3 text-5xl font-extrabold tracking-tight sm:text-7xl">
          <Rocket size={52} /> R0cketShip
        </h1>
        <div className="mx-auto mt-6 max-w-3xl">
          <div className="text-2xl font-extrabold sm:text-3xl" style={{ color: ACCENT }}>{RISING_TIDE.line}</div>
          <p className="mt-4 text-[16.5px] leading-relaxed text-white/60">{RISING_TIDE.sub}</p>
        </div>
      </header>

      {/* pillars, across the top */}
      <nav className="sticky top-0 z-40 mt-10 border-y backdrop-blur"
        style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(10,14,23,.88)" }}>
        <div className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-5 py-3 sm:px-8">
          {PILLARS.map((p) => (
            <a key={p.id} href={`#${p.id}`} onClick={() => setOpen(p.id)}
              className="flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 transition-all hover:-translate-y-px"
              style={{ borderColor: open === p.id ? p.color : "rgba(255,255,255,.12)",
                       background: open === p.id ? `color-mix(in srgb, ${p.color} 14%, transparent)` : "rgba(255,255,255,.03)" }}>
              <span className="text-base">{p.icon}</span>
              <span className="whitespace-nowrap text-[13px] font-bold text-white">{p.name}</span>
              <span className="font-mono text-[10px] text-white/30">{p.divisions.length}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* ── the thesis ── */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>The brand thesis</div>
        <h2 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl">
          Increased profitability, from four directions at once.
        </h2>
        <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {THESIS.map((t) => (
            <div key={t.k} className="rounded-2xl border p-5" style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(255,255,255,.025)" }}>
              <div className="font-mono text-[11px] font-extrabold" style={{ color: ACCENT }}>{t.k}</div>
              <div className="mt-1.5 text-[16px] font-extrabold leading-tight">{t.title}</div>
              <p className="mt-2 text-[13px] leading-relaxed text-white/55">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── the pillars ── */}
      <section className="mx-auto max-w-6xl px-5 pb-6 sm:px-8">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>The pillars</div>
        <h2 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl">
          Seven capabilities. Forty-six divisions. One machine.
        </h2>
        <p className="mt-3 max-w-3xl text-[15.5px] leading-relaxed text-white/55">
          These are not industries — they are the things R0cketShip leads with. Divisions sit
          inside them, and appear in more than one on purpose. A division drawing on a single
          pillar is not yet part of the ecosystem.
        </p>
        <div className="mt-7 space-y-3">
          {PILLARS.map((p) => (
            <PillarCard key={p.id} p={p} open={open === p.id} onToggle={() => setOpen(open === p.id ? null : p.id)} />
          ))}
        </div>
      </section>

      {/* ── the flywheel ── */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>Why it compounds</div>
        <h2 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl">
          The loop that makes the tide rise.
        </h2>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FLYWHEEL.map((f, i) => (
            <div key={f.k} className="relative rounded-2xl border p-5" style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(255,255,255,.025)" }}>
              <div className="font-mono text-[11px] font-extrabold" style={{ color: ACCENT }}>{String(i + 1).padStart(2, "0")}</div>
              <div className="mt-1 text-[15px] font-extrabold">{f.k}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{f.v}</p>
              {i < FLYWHEEL.length - 1 && (
                <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-lg lg:block" style={{ color: "rgba(255,91,46,.5)" }}>→</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border p-5" style={{ borderColor: "rgba(255,91,46,.4)", background: "rgba(255,91,46,.07)" }}>
          <p className="text-[15px] leading-relaxed text-white/75">
            <b className="text-white">Each turn of the loop leaves the ecosystem one division stronger.</b>{" "}
            That is the whole argument for owning forty-six businesses instead of one. Not
            diversification — compounding.
          </p>
        </div>
      </section>

      {/* ── overlap ── */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>The overlap</div>
        <h2 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl">
          How many pillars each division draws on.
        </h2>
        <p className="mt-3 max-w-3xl text-[15.5px] leading-relaxed text-white/55">
          The more pillars a division touches, the more of the ecosystem it inherits — and the
          more it contributes back. Divisions on one pillar are the ones with the most room left.
        </p>
        <div className="mt-6 flex flex-wrap gap-1.5">
          {reach.map((r) => (
            <Link key={r.slug} href={`/corporate-structure/${r.slug}`}
              className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-semibold text-white/70 transition-all hover:-translate-y-px hover:text-white"
              style={{ borderColor: r.count >= 3 ? "rgba(255,91,46,.5)" : "rgba(255,255,255,.12)",
                       background: r.count >= 3 ? "rgba(255,91,46,.1)" : "rgba(255,255,255,.03)" }}>
              {r.name}
              <span className="font-mono text-[10.5px]" style={{ color: r.count >= 3 ? ACCENT : "rgba(255,255,255,.3)" }}>×{r.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── close ── */}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="rounded-3xl border p-10 text-center" style={{ borderColor: "rgba(255,91,46,.35)", background: "linear-gradient(150deg, rgba(255,91,46,.12), transparent 65%)" }}>
          <h2 className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl">
            A fully producing ecosystem, where every pillar, every business and every user
            reinforces the rest.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-white/60">
            Lower acquisition cost. Less operational strain. Less spend that never touched a sale.
            And data that tells you what happens next.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/corporate-structure" className="rounded-xl px-6 py-3 font-bold text-white" style={{ background: `linear-gradient(120deg, ${ACCENT}, #ff8a4b)` }}>
              See the corporate structure
            </Link>
            <Link href="/corporate-structure/AEOS" className="rounded-xl border px-6 py-3 font-bold" style={{ borderColor: "rgba(225,75,138,.55)", background: "rgba(225,75,138,.12)", color: "#ff9ec4" }}>
              🎬 AEOS — the entertainment pillar
            </Link>
            <a href="tel:9728006670" className="rounded-xl border px-6 py-3 font-bold text-white/80" style={{ borderColor: "rgba(255,255,255,.2)" }}>
              Talk to Jeff — 972-800-6670
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
