"use client";
/**
 * The two documents a capital conversation actually needs: a one-page
 * investment case for a private-equity or strategic reader, and the full
 * business plan behind it.
 *
 * Both sit behind the same gate as the deck and read from the same computed
 * model, so a change to the ramp assumptions moves every number on both pages
 * at once. Nothing here is typed twice.
 */
import { useEffect, useState } from "react";
import { RampChart, YearTable, ExitLadder, CapTableChart, TrendChart, StackBars } from "./Charts";
import {
  YEARS, QUARTERS, EXIT, ROUNDS, CAP_TABLE, COMMERCE, MODEL_INPUTS,
  FIRST_PROFITABLE_QUARTER, BREAKEVEN, PEAK_FUNDING, usd,
} from "./finance";
import { COMPUTE, MOAT, WHITE_SPACE, CLOSING_LINE, BUSINESS } from "./aeos-content";

const GATE_KEY = "aeos-unlocked";
const HEADING_FIX = `
  .aeos h1, .aeos h2, .aeos h3, .aeos h4 { color: #fff; }
`;

function useGate() {
  const [state, setState] = useState<"loading" | "in" | "out">("loading");
  useEffect(() => {
    try { setState(localStorage.getItem(GATE_KEY) === "1" ? "in" : "out"); } catch { setState("out"); }
  }, []);
  return state;
}

function Locked() {
  return (
    <main className="aeos grid min-h-[100dvh] place-items-center px-5 text-center" style={{ background: "#0a0e17" }}>
      <style>{HEADING_FIX}</style>
      <div>
        <h1 className="text-2xl font-extrabold">This document is gated.</h1>
        <p className="mt-2 text-white/50">Open the deck first and enter your access code.</p>
        <a href="/corporate-structure/AEOS" className="mt-5 inline-block rounded-xl px-6 py-3 font-bold text-white"
          style={{ background: "linear-gradient(120deg,#ff5b2e,#ff8a4b)" }}>Go to AEOS</a>
      </div>
    </main>
  );
}

function Shell({ tag, title, sub, color, children }:
  { tag: string; title: string; sub: string; color: string; children: React.ReactNode }) {
  return (
    <main className="aeos min-h-[100dvh] text-white" style={{ background: "radial-gradient(120% 70% at 80% -10%, #141b2b, #0a0e17 55%)" }}>
      <style>{HEADING_FIX}</style>
      <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        <a href="/corporate-structure/AEOS" className="text-[12.5px] font-bold" style={{ color }}>← Back to AEOS</a>
        <div className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.2em]" style={{ color }}>{tag}</div>
        <h1 className="mt-2 text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-[17px] leading-relaxed text-white/60">{sub}</p>
        {children}
        <div className="mt-14 border-t pt-6 text-[11px] leading-relaxed text-white/25" style={{ borderColor: "rgba(255,255,255,.1)" }}>
          Confidential. Prepared for named recipients only. The financial model is a projection
          built from stated assumptions — a royalty ramp of {usd(MODEL_INPUTS.q1)} in the first
          quarter, doubling for four quarters, then {MODEL_INPUTS.steadyGrowth * 100}% per quarter,
          at a {MODEL_INPUTS.margin * 100}% contribution margin against {usd(MODEL_INPUTS.opexAnnual, { compact: true })} of
          annual platform operating cost. It is not a forecast, a guarantee, or an offer of
          securities. Multiples are illustrative comparables, not indications of interest.
        </div>
      </div>
    </main>
  );
}

function Stat({ big, label, color, sub }: { big: string; label: string; color: string; sub?: string }) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: "rgba(255,255,255,.11)", background: "rgba(255,255,255,.025)" }}>
      <div className="text-3xl font-extrabold leading-none" style={{ color }}>{big}</div>
      <div className="mt-1.5 text-[12.5px] font-bold text-white/75">{label}</div>
      {sub && <div className="mt-0.5 text-[11.5px] leading-snug text-white/40">{sub}</div>}
    </div>
  );
}

function Block({ kicker, title, color, children }: { kicker: string; title: string; color: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ color }}>{kicker}</div>
      <h2 className="mt-1.5 text-2xl font-extrabold sm:text-3xl">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════ one-pager ══ */

export function OnePager() {
  const gate = useGate();
  const BLUE = "#2f9df4";
  if (gate === "loading") return <div style={{ minHeight: "100dvh", background: "#0a0e17" }} />;
  if (gate === "out") return <Locked />;
  const y5 = YEARS[4]!;

  return (
    <Shell color={BLUE} tag="Investment opportunity · private equity & strategic"
      title="A content business with an infrastructure cost curve."
      sub="Entertainment assets have never had operating leverage — the second title costs what the first one did. AEOS breaks that, and the model below is what it produces.">

      <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat color={BLUE} big={usd(y5.revenue, { compact: true })} label="Year-five royalty revenue" sub="Perpetual SaaS royalty, compounding" />
        <Stat color="#39c07c" big={usd(y5.ebitda, { compact: true })} label="Year-five EBITDA" sub={`${(y5.margin * 100).toFixed(0)}% margin at scale`} />
        <Stat color={BLUE} big={usd(PEAK_FUNDING, { compact: true })} label="Peak capital requirement" sub="The deepest the cumulative line ever goes" />
        <Stat color="#39c07c" big={FIRST_PROFITABLE_QUARTER?.label ?? "—"} label="First profitable quarter" sub={`Cumulative breakeven ${BREAKEVEN?.label ?? "—"}`} />
      </div>

      <Block kicker="The shape" title="Five doublings, then compounding." color={BLUE}>
        <div className="rounded-2xl border p-6" style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(0,0,0,.28)" }}>
          <RampChart color={BLUE} />
          <p className="mt-3 text-[12.5px] leading-relaxed text-white/45">
            Royalty revenue opens at {usd(MODEL_INPUTS.q1)} in the first quarter and doubles for four
            consecutive quarters, then settles into {MODEL_INPUTS.steadyGrowth * 100}% quarterly
            compounding. Platform operating cost is held flat at {usd(MODEL_INPUTS.opexAnnual, { compact: true })} a
            year — the line that does not scale with revenue, which is the entire point.
          </p>
        </div>
        <div className="mt-4"><YearTable color={BLUE} /></div>
      </Block>

      <Block kicker="The moat" title="What compounds, and what anyone could copy." color={BLUE}>
        <div className="grid gap-3 sm:grid-cols-2">
          {MOAT.filter((m) => m.real).map((m) => (
            <div key={m.name} className="rounded-xl border p-4" style={{ borderColor: "rgba(57,192,124,.3)", background: "rgba(57,192,124,.06)" }}>
              <div className="text-[14px] font-bold">{m.name}</div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-white/55">{m.why}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-white/45">
          <b className="text-white/70">Excluded from the case:</b>{" "}
          {MOAT.filter((m) => !m.real).map((m) => m.name.toLowerCase()).join(", ")}. Each is copyable
          inside a quarter, so none of it is counted.
        </p>
      </Block>

      <Block kicker="Already running" title="The stack is not a diagram." color={BLUE}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat color={BLUE} big={COMPUTE.headline} label={COMPUTE.headlineUnit} sub="Across three model providers, today" />
          <Stat color={BLUE} big={COMPUTE.budget} label="Annual compute run rate" sub="Before generative video and render" />
          <Stat color={BLUE} big="40+" label="R0cketShip operating divisions" sub="Distribution the platform inherits on day one" />
        </div>
      </Block>

      <Block kicker="The exit" title="What it is worth if the model holds." color={BLUE}>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-2xl border p-6" style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(0,0,0,.28)" }}>
            <ExitLadder color={BLUE} />
          </div>
          <div>
            <div className="space-y-2.5">
              {EXIT.buyers.map((b) => (
                <div key={b.who} className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,.1)" }}>
                  <div className="text-[13.5px] font-bold">{b.who}</div>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">{b.why}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-white/35">{EXIT.note}</p>
          </div>
        </div>
      </Block>

      <Block kicker="Ownership" title="Cap table across the rounds." color={BLUE}>
        <div className="rounded-2xl border p-6" style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(0,0,0,.28)" }}>
          <CapTableChart color={BLUE} />
        </div>
      </Block>

      <div className="mt-12 rounded-2xl border p-8 text-center" style={{ borderColor: "rgba(47,157,244,.4)", background: "linear-gradient(150deg, rgba(47,157,244,.12), transparent 65%)" }}>
        <div className="text-xl font-extrabold" style={{ color: BLUE }}>Underwrite one pilot title against your own comparable cost base.</div>
        <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-white/55">
          Every number on this page is measurable on a single production. That is the whole point
          of starting with services rather than a licence.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href="tel:9728006670" className="rounded-xl px-6 py-3 font-bold text-white" style={{ background: `linear-gradient(120deg, ${BLUE}, #6cc0ff)` }}>Talk to Jeff — 972-800-6670</a>
          <a href="/corporate-structure/AEOS/business-plan" className="rounded-xl border px-6 py-3 font-bold text-white/80" style={{ borderColor: "rgba(255,255,255,.2)" }}>Read the full business plan</a>
        </div>
      </div>
    </Shell>
  );
}

/* ════════════════════════════════════════════════════════════ business plan ══ */

export function BusinessPlan() {
  const gate = useGate();
  const GREEN = "#39c07c";
  if (gate === "loading") return <div style={{ minHeight: "100dvh", background: "#0a0e17" }} />;
  if (gate === "out") return <Locked />;
  const y5 = YEARS[4]!;

  return (
    <Shell color={GREEN} tag="Business plan"
      title="Entertainment is the vehicle. The platform is the business."
      sub="How AEOS makes money, what it costs to run, how the revenue compounds, and why the layer built on top of it — data, marketing, commerce — is worth more than the production platform underneath.">

      <Block kicker="The model" title="A perpetual royalty on production." color={GREEN}>
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {[
              { k: "What is sold", v: "A perpetual software-as-a-service royalty against productions run on the platform. It is not a per-seat licence and it is not a one-time fee — it accrues for as long as the title earns." },
              { k: "Why it compounds", v: "Every studio that adopts the platform expands their slate on it. Royalty grows with their production volume rather than with our headcount." },
              { k: "The ramp", v: `Zero at signature, ${usd(MODEL_INPUTS.q1)} in the first quarter, doubling for the following four quarters as the first cohort of titles goes into production, then ${MODEL_INPUTS.steadyGrowth * 100}% per quarter as the slate compounds.` },
              { k: "The margin", v: `${MODEL_INPUTS.margin * 100}% contribution after compute, delivery and support. Compute is deliberately not modelled as compressing — it is the one cost that scales with volume.` },
              { k: "The fixed line", v: `${usd(MODEL_INPUTS.opexAnnual, { compact: true })} a year to operate the platform. It does not move with revenue, which is where the operating leverage comes from.` },
            ].map((r) => (
              <div key={r.k} className="grid gap-1 sm:grid-cols-[150px_1fr] sm:gap-4">
                <div className="text-[12.5px] font-bold text-white/75">{r.k}</div>
                <div className="text-[13.5px] leading-relaxed text-white/55">{r.v}</div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <Stat color={GREEN} big={FIRST_PROFITABLE_QUARTER?.label ?? "—"} label="First profitable quarter" />
            <Stat color={GREEN} big={usd(PEAK_FUNDING, { compact: true })} label="Peak capital requirement" sub="Total cash needed before it self-funds" />
            <Stat color={GREEN} big={`${(y5.margin * 100).toFixed(0)}%`} label="Year-five EBITDA margin" />
          </div>
        </div>
      </Block>

      <Block kicker="The numbers" title="Twenty quarters, computed not asserted." color={GREEN}>
        <div className="rounded-2xl border p-6" style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(0,0,0,.28)" }}>
          <RampChart color={GREEN} />
        </div>
        <div className="mt-4"><YearTable color={GREEN} /></div>
        <div className="mt-4 overflow-x-auto rounded-2xl border" style={{ borderColor: "rgba(255,255,255,.1)" }}>
          <table className="w-full border-collapse text-left text-[12.5px]">
            <thead><tr>{["Quarter", "Revenue", "Contribution", "Opex", "EBITDA", "Cumulative"].map((h) => (
              <th key={h} className="border-b px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-white/40" style={{ borderColor: "rgba(255,255,255,.12)" }}>{h}</th>))}</tr></thead>
            <tbody>
              {QUARTERS.slice(0, 12).map((q) => (
                <tr key={q.q}>
                  <td className="border-b px-3 py-2 font-bold text-white/85" style={{ borderColor: "rgba(255,255,255,.05)" }}>{q.label}</td>
                  <td className="border-b px-3 py-2 font-mono text-white/70" style={{ borderColor: "rgba(255,255,255,.05)" }}>{usd(q.revenue)}</td>
                  <td className="border-b px-3 py-2 font-mono text-white/45" style={{ borderColor: "rgba(255,255,255,.05)" }}>{usd(q.contribution)}</td>
                  <td className="border-b px-3 py-2 font-mono text-white/45" style={{ borderColor: "rgba(255,255,255,.05)" }}>({usd(q.opex)})</td>
                  <td className="border-b px-3 py-2 font-mono font-bold" style={{ borderColor: "rgba(255,255,255,.05)", color: q.ebitda >= 0 ? GREEN : "#ff7a6b" }}>{usd(q.ebitda)}</td>
                  <td className="border-b px-3 py-2 font-mono" style={{ borderColor: "rgba(255,255,255,.05)", color: q.cumulative >= 0 ? GREEN : "rgba(255,255,255,.4)" }}>{usd(q.cumulative)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3 py-2 text-[11px] text-white/30">First twelve quarters shown. Years four and five are in the annual table above.</div>
        </div>
      </Block>

      <Block kicker="The layer on top" title="Entertainment as the vehicle. Commerce as the engine." color={GREEN}>
        <p className="max-w-3xl text-[15.5px] leading-relaxed text-white/60">{COMMERCE.premise}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COMMERCE.layers.map((l) => (
            <div key={l.pos} className="rounded-2xl border p-5" style={{ borderColor: "rgba(57,192,124,.3)", background: "rgba(57,192,124,.05)" }}>
              <div className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: GREEN }}>{l.pos}</div>
              <div className="mt-1 text-[15px] font-bold">{l.name}</div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">{l.what}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border p-6" style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(0,0,0,.28)" }}>
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-white/40">The commerce flywheel</div>
          <ol className="mt-3 space-y-2">
            {COMMERCE.flywheel.map((f, i) => (
              <li key={f} className="flex gap-3 text-[13.5px] leading-relaxed text-white/60">
                <span className="font-mono text-[12px] font-bold" style={{ color: GREEN }}>{String(i + 1).padStart(2, "0")}</span>{f}
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-6 rounded-2xl border p-6" style={{ borderColor: "rgba(255,91,46,.4)", background: "linear-gradient(150deg, rgba(255,91,46,.11), transparent 62%)" }}>
          <div className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: "#ff5b2e" }}>The accretive effect</div>
          <h3 className="mt-1.5 text-2xl font-extrabold">{COMMERCE.amazonBerkshire.title}</h3>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-white/65">{COMMERCE.amazonBerkshire.body}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {COMMERCE.amazonBerkshire.rows.map((r, i) => (
              <div key={r.who} className="rounded-xl border p-4"
                style={{ borderColor: i === 2 ? "rgba(255,91,46,.5)" : "rgba(255,255,255,.11)",
                         background: i === 2 ? "rgba(255,91,46,.09)" : "rgba(255,255,255,.02)" }}>
                <div className="text-[14px] font-extrabold text-white">{r.who}</div>
                <div className="mt-2 text-[10.5px] font-extrabold uppercase tracking-wider text-white/35">Takes</div>
                <div className="text-[13px] leading-snug text-white/75">{r.takes}</div>
                <div className="mt-2 border-t pt-2 text-[12px] leading-snug text-white/45" style={{ borderColor: "rgba(255,255,255,.1)" }}>{r.limit}</div>
              </div>
            ))}
          </div>
          <p className="mt-5 border-t pt-4 text-[15px] leading-relaxed text-white/75" style={{ borderColor: "rgba(255,255,255,.12)" }}>
            {COMMERCE.amazonBerkshire.accretive}
          </p>
          <p className="mt-4 text-[15px] font-bold text-white">{COMMERCE.why}</p>
          <div className="mt-5">
            <a href="/pillars" className="inline-block rounded-xl px-5 py-2.5 text-[13.5px] font-bold text-white"
              style={{ background: "linear-gradient(120deg,#ff5b2e,#ff8a4b)" }}>
              See how it compounds across all seven pillars →
            </a>
          </div>
        </div>
      </Block>

      <Block kicker="Capital" title="What we raise, and what it buys." color={GREEN}>
        <div className="grid gap-3 md:grid-cols-3">
          {ROUNDS.map((r) => (
            <div key={r.name} className="rounded-2xl border p-5" style={{ borderColor: "rgba(255,255,255,.11)", background: "rgba(255,255,255,.025)" }}>
              <div className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: GREEN }}>{r.name}</div>
              <div className="mt-1 text-2xl font-extrabold">{usd(r.raise, { compact: true })}</div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-white/55">{r.use}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border p-6" style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(0,0,0,.28)" }}>
          <CapTableChart color={GREEN} />
        </div>
      </Block>

      <Block kicker="Exit" title="Where this ends." color={GREEN}>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-2xl border p-6" style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(0,0,0,.28)" }}>
            <ExitLadder color={GREEN} />
          </div>
          <div className="space-y-2.5">
            {EXIT.buyers.map((b) => (
              <div key={b.who} className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,.1)" }}>
                <div className="text-[13.5px] font-bold">{b.who}</div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">{b.why}</p>
              </div>
            ))}
          </div>
        </div>
      </Block>

      <Block kicker="The market" title="Everyone owns a piece. Nobody owns the orchestration." color={GREEN}>
        <p className="max-w-3xl text-[15.5px] leading-relaxed text-white/60">{WHITE_SPACE}</p>
      </Block>

      <div className="mt-12 rounded-2xl border p-8 text-center" style={{ borderColor: "rgba(57,192,124,.4)", background: "linear-gradient(150deg, rgba(57,192,124,.12), transparent 65%)" }}>
        <div className="text-xl font-extrabold" style={{ color: GREEN }}>{CLOSING_LINE}</div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href="tel:9728006670" className="rounded-xl px-6 py-3 font-bold text-white" style={{ background: `linear-gradient(120deg, ${GREEN}, #6fe0a6)` }}>Talk to Jeff — 972-800-6670</a>
          <a href="/corporate-structure/AEOS/one-pager" className="rounded-xl border px-6 py-3 font-bold text-white/80" style={{ borderColor: "rgba(255,255,255,.2)" }}>The investment one-pager</a>
          <a href="/corporate-structure/AEOS" className="rounded-xl border px-6 py-3 font-bold text-white/80" style={{ borderColor: "rgba(255,255,255,.2)" }}>Back to the deck</a>
        </div>
      </div>
    </Shell>
  );
}
