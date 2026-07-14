"use client";

import { useMemo, useState } from "react";
import { PORTS, REGION_COLOR, REV_PER_PAX, SHORE_SPEND_PAX, opportunity, shoreSpend, rankedPorts, type PortRow, type PortStatus } from "./portData";

const ORANGE = "#ff5b2e";
const fmtM = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(2)}B` : `$${n.toFixed(0)}M`);

const STATUS: Record<PortStatus, { label: string; color: string }> = {
  live: { label: "LIVE", color: "#22c55e" },
  building: { label: "BUILDING", color: "#22d3ee" },
  pipeline: { label: "PIPELINE", color: "#ff5b2e" },
};

function RImg({ size = 16 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/rocket.png" width={size} height={size} alt="" aria-hidden className="inline-block shrink-0" style={{ objectFit: "contain" }} />;
}

export function PortOpportunity() {
  const [sortKey, setSortKey] = useState<"rank" | "pax" | "opp">("rank");
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (sortKey === "pax") return [...PORTS].sort((a, b) => b.pax - a.pax);
    if (sortKey === "opp") return [...PORTS].sort((a, b) => opportunity(b) - opportunity(a));
    return rankedPorts();
  }, [sortKey]);

  const totalOpp = PORTS.reduce((s, p) => s + opportunity(p), 0);
  const totalPax = PORTS.reduce((s, p) => s + p.pax, 0);
  const maxOpp = Math.max(...PORTS.map(opportunity));
  const nextUp = rankedPorts().find((p) => p.status === "pipeline")!;

  return (
    <main className="grid-bg-dark min-h-[100dvh] overflow-hidden" style={{ background: "radial-gradient(120% 60% at 80% -8%, #08243a, #06080d 55%)", color: "#fff" }}>
      <nav className="sticky top-0 z-40 flex items-center justify-between px-5 py-4 backdrop-blur sm:px-8" style={{ background: "rgba(6,8,13,.66)", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <a href="https://crewperk.com" className="flex items-center gap-2 text-lg font-extrabold"><RImg size={24} /> Crew<span style={{ color: "#22d3ee" }}>Perk</span></a>
        <a href="/crewperk" className="rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-white/5" style={{ borderColor: "rgba(255,255,255,.2)" }}>Business case →</a>
      </nav>

      {/* Header */}
      <header className="mx-auto max-w-6xl px-5 pb-8 pt-14 text-center sm:px-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ background: "color-mix(in srgb, #ff5b2e 24%, transparent)", color: "#ffb399" }}>Opportunity · Port Data & Statistics</div>
        <h1 className="font-serif-display flame-text mx-auto max-w-4xl text-4xl font-extrabold leading-[1.04] sm:text-6xl">Every port, ranked by what it's worth.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-white/70">
          {PORTS.length} of the world's busiest cruise ports — ranked by modeled annual revenue opportunity. We're live in Cozumel; Puerto Rico and Roatán are being built; here's where we go next, by the numbers.
        </p>
        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(255,255,255,.12)", background: "rgba(255,255,255,.03)" }}>
            <div className="text-2xl font-extrabold" style={{ color: ORANGE }}>{fmtM(totalOpp)}</div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-white/50">Annual revenue opportunity</div>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(255,255,255,.12)", background: "rgba(255,255,255,.03)" }}>
            <div className="text-2xl font-extrabold text-white">{totalPax.toFixed(0)}M</div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-white/50">Cruise passengers / yr</div>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(255,255,255,.12)", background: "rgba(255,255,255,.03)" }}>
            <div className="text-2xl font-extrabold text-white">{fmtM(totalPax * SHORE_SPEND_PAX)}</div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-white/50">In-port shore spend / yr</div>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: "color-mix(in srgb, #ff5b2e 45%, transparent)", background: "color-mix(in srgb, #ff5b2e 12%, transparent)" }}>
            <div className="text-base font-extrabold" style={{ color: ORANGE }}>Next: {nextUp.name.split(",")[0]}</div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-white/50">Highest-value pipeline port</div>
          </div>
        </div>
      </header>

      {/* Sort controls */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <div className="flex items-center gap-3 text-xs">
          {(Object.keys(STATUS) as PortStatus[]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 font-semibold text-white/60"><span className="h-2 w-2 rounded-full" style={{ background: STATUS[s].color }} />{STATUS[s].label}</span>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className="text-white/40">Sort:</span>
          {([["rank", "Recommended"], ["opp", "Opportunity"], ["pax", "Passengers"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setSortKey(k)} className="rounded-full px-3 py-1.5 transition" style={{ background: sortKey === k ? ORANGE : "rgba(255,255,255,.06)", color: "#fff" }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Ranked rows */}
      <section className="px-5 py-6 pb-24 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-1.5">
          {rows.map((p, idx) => {
            const opp = opportunity(p);
            const isOpen = open === p.name;
            return (
              <div key={p.name} className="rounded-xl border" style={{ borderColor: isOpen ? "rgba(255,91,46,.4)" : "rgba(255,255,255,.08)", background: "rgba(255,255,255,.025)" }}>
                <button onClick={() => setOpen(isOpen ? null : p.name)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left sm:px-4">
                  <span className="w-6 shrink-0 text-center text-sm font-bold text-white/35">{idx + 1}</span>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-extrabold" style={{ background: `${REGION_COLOR[p.region] ?? "#888"}33`, color: REGION_COLOR[p.region] ?? "#fff" }}>{p.region.slice(0, 2).toUpperCase()}</span>
                  <div className="w-40 shrink-0 sm:w-56">
                    <div className="truncate text-sm font-bold text-white">{p.name.split(",")[0]}</div>
                    <div className="truncate text-[11px] text-white/45">{p.country} · {p.pax}M pax</div>
                  </div>
                  <div className="hidden flex-1 sm:block">
                    <div className="h-5 overflow-hidden rounded" style={{ background: "rgba(255,255,255,.06)" }}>
                      <div className="h-full rounded" style={{ width: `${Math.max((opp / maxOpp) * 100, 3)}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${ORANGE} 55%, transparent), ${ORANGE})` }} />
                    </div>
                  </div>
                  <span className="w-16 shrink-0 text-right text-sm font-extrabold" style={{ color: ORANGE }}>{fmtM(opp)}</span>
                  <span className="w-20 shrink-0 text-right text-[10px] font-bold" style={{ color: STATUS[p.status].color }}>{STATUS[p.status].label}</span>
                </button>
                {isOpen && (
                  <div className="border-t px-4 pb-4 pt-3 text-sm" style={{ borderColor: "rgba(255,255,255,.08)" }}>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,.04)" }}><div className="text-lg font-extrabold text-white">{p.pax}M</div><div className="text-[11px] text-white/50">Cruise passengers / yr</div></div>
                      <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,.04)" }}><div className="text-lg font-extrabold text-white">{fmtM(shoreSpend(p))}</div><div className="text-[11px] text-white/50">In-port shore spend / yr (~${SHORE_SPEND_PAX}/visitor)</div></div>
                      <div className="rounded-lg p-3" style={{ background: "rgba(255,91,46,.12)" }}><div className="text-lg font-extrabold" style={{ color: ORANGE }}>{fmtM(opp)}</div><div className="text-[11px] text-white/50">Our modeled revenue (~${REV_PER_PAX}/visitor)</div></div>
                    </div>
                    <p className="mt-3 text-white/55">
                      <b style={{ color: STATUS[p.status].color }}>{STATUS[p.status].label}.</b>{" "}
                      {p.status === "live" ? "Our first market — proving the model now." : p.status === "building" ? "In active build, launching this cycle." : `A ${fmtM(opp)}/yr opportunity on ${p.pax}M passengers — drops onto the same white-label engine with one URL.`}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-8 max-w-4xl text-center text-xs leading-relaxed text-white/35">
          Model: revenue opportunity = annual cruise passengers × ${REV_PER_PAX}/visitor at maturity (~3.4% of the ~${SHORE_SPEND_PAX} Caribbean shore-spend baseline; blend of merchant subscriptions, advertising, affiliate, Rocket Fuel, and loyalty). Passenger volumes: FCCA, port authorities, and the Wikipedia busiest-cruise-ports list (2024–25). Live ship positions available via the free AISStream.io AIS feed; itinerary data via commercial providers. Figures are illustrative and conservative.
        </p>
      </section>
    </main>
  );
}
