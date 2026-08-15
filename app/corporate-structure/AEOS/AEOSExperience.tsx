"use client";
/**
 * AEOS — the interactive deck.
 *
 * Three readers want the same argument in three vocabularies. The visitor picks
 * their industry, we choose the lens that serves them, and they can override it
 * at any time. Every lens draws on the same underlying content so the argument
 * never contradicts itself — only its framing and its evidence change.
 *
 * All graphics are inline SVG/CSS. No chart library, nothing to load, and the
 * whole thing prints.
 */
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  AUDIENCES, LENSES, STACK, STACK_BANDS, AGENT_TREE, MATURITY, MOAT,
  ECON_LEVERS, ESTIMATE_DEMO, ONE_WORLD, POSITIONING, COMPETITIVE, WHITE_SPACE,
  FLYWHEEL, EXEC_SUMMARY, ONE_SHEET, DECK, SIZZLE, CLOSING_LINE, COMPUTE,
  type Lens, type Audience,
} from "./aeos-content";
import { requestAccess, type AccessState } from "./actions";

const ACCENT = "#ff5b2e";
const GATE_KEY = "aeos-unlocked";

/**
 * globals.css sets `h1,h2,h3,h4 { color: var(--ink) }` outside any cascade
 * layer, which beats Tailwind's layered `text-white`. Rather than sprinkle
 * inline colours through every heading, override once, scoped to this deck.
 */
const HEADING_FIX = `
  .aeos h1, .aeos h2, .aeos h3, .aeos h4 { color: #fff; }
  .aeos h1 span[data-accent], .aeos h2 span[data-accent] { color: inherit; }
`;

/* ═══════════════════════════════════════════════════════════ small pieces ══ */

function Rocket({ size = 20 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/rocket.png" width={size} height={size} alt="" aria-hidden className="inline-block shrink-0" style={{ objectFit: "contain" }} />;
}

function Kicker({ children, color = ACCENT }: { children: React.ReactNode; color?: string }) {
  return <div className="text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ color }}>{children}</div>;
}

function Section({ id, children, className = "" }: { id?: string; children: React.ReactNode; className?: string }) {
  return <section id={id} className={`mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20 ${className}`}>{children}</section>;
}

function Card({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-2xl border p-5 ${className}`}
      style={{ borderColor: "rgba(255,255,255,.10)", background: "rgba(255,255,255,.025)", ...style }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ the gate ══ */

function Gate({ password, onPass }: { password: string; onPass: () => void }) {
  const [tab, setTab] = useState<"login" | "request">("login");
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);
  const [state, action, pending] = useActionState<AccessState, FormData>(requestAccess, { ok: false, error: null });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (val.trim() === password) {
      try { localStorage.setItem(GATE_KEY, "1"); } catch { /* private mode */ }
      onPass();
    } else { setErr(true); setVal(""); }
  }

  return (
    <main className="aeos grid min-h-[100dvh] place-items-center px-5 py-16"
      style={{ background: "radial-gradient(120% 70% at 80% -10%, #1b1420, #0a0e17 55%)" }}>
      <style>{HEADING_FIX}</style>
      <div className="w-full max-w-xl">
        <div className="text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white"
            style={{ background: "color-mix(in srgb, #ff5b2e 26%, transparent)" }}>
            <Rocket size={14} /> R0cketShip Holdings · Confidential
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">
            Autonomous Entertainment<br /><span data-accent style={{ color: ACCENT }}>Operating System</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/55">
            One creative intent becomes a film, a series, a game, a campaign and forty
            localisations — from a single world.
          </p>
        </div>

        <div className="mt-9 overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(255,255,255,.12)", background: "rgba(255,255,255,.03)" }}>
          <div className="grid grid-cols-2 text-sm font-bold">
            {(["login", "request"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} type="button"
                className="px-4 py-3.5 transition-colors"
                style={{ background: tab === t ? "rgba(255,91,46,.14)" : "transparent",
                         color: tab === t ? "#fff" : "rgba(255,255,255,.45)",
                         borderBottom: tab === t ? `2px solid ${ACCENT}` : "2px solid transparent" }}>
                {t === "login" ? "I have access" : "Request access"}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <form onSubmit={submit} className="p-6">
              <label htmlFor="pw" className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/45">Access code</label>
              <input id="pw" type="password" autoFocus value={val} autoComplete="current-password"
                onChange={(e) => { setVal(e.target.value); setErr(false); }}
                placeholder="Enter your code"
                className="w-full rounded-xl border bg-black/30 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/25"
                style={{ borderColor: err ? "#ff5b5b" : "rgba(255,255,255,.16)" }} />
              {err && <div className="mt-2 text-sm font-semibold text-red-400">That code is not right.</div>}
              <button type="submit" className="mt-4 w-full rounded-xl px-4 py-3 font-bold text-white transition-transform hover:-translate-y-px"
                style={{ background: `linear-gradient(120deg, ${ACCENT}, #ff8a4b)` }}>
                Open the system
              </button>
              <p className="mt-4 text-center text-xs text-white/35">
                Returning visitor? Use the code you were sent.{" "}
                <button type="button" onClick={() => setTab("request")} className="font-semibold underline" style={{ color: ACCENT }}>
                  No code yet
                </button>
              </p>
            </form>
          ) : state.ok ? (
            <div className="p-8 text-center">
              <div className="text-4xl">✅</div>
              <h2 className="mt-3 text-xl font-extrabold text-white">Request received.</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/55">
                Jeff has been notified and will come back to you directly with an access code.
                If it is urgent, call <span className="font-bold text-white">972-800-6670</span>.
              </p>
              <button type="button" onClick={() => setTab("login")} className="mt-5 text-sm font-bold underline" style={{ color: ACCENT }}>
                I have a code now
              </button>
            </div>
          ) : (
            <form action={action} className="p-6">
              <p className="mb-4 text-sm leading-relaxed text-white/55">
                This deck goes out selectively. Tell us who you are and we will send a code.
              </p>
              {state.error && (
                <div className="mb-4 rounded-xl border px-4 py-2.5 text-sm font-semibold"
                  style={{ borderColor: "rgba(255,91,91,.4)", background: "rgba(255,91,91,.12)", color: "#ffb4b4" }}>
                  {state.error}
                </div>
              )}
              {/* honeypot */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="name" label="Name" required autoFocus />
                <Field name="phone" label="Number" type="tel" required />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field name="email" label="Business email" type="email" required />
                <Field name="company" label="Company" />
              </div>

              <div className="mt-3">
                <label htmlFor="industry" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-white/45">Industry</label>
                <select id="industry" name="industry" defaultValue=""
                  className="w-full rounded-xl border bg-black/30 px-4 py-2.5 text-white outline-none"
                  style={{ borderColor: "rgba(255,255,255,.16)" }}>
                  <option value="">Select…</option>
                  {AUDIENCES.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,.12)", background: "rgba(255,255,255,.02)" }}>
                <div className="text-xs font-bold uppercase tracking-wide text-white/45">Cloud &amp; compute</div>
                <p className="mt-1.5 text-xs leading-relaxed text-white/45">
                  This platform is GPU-hungry by nature. Knowing where you already run tells us
                  what a pilot would actually look like for you.
                </p>
                <label htmlFor="aws" className="mt-3 mb-1.5 block text-xs font-bold uppercase tracking-wide text-white/45">Do you run on AWS?</label>
                <select id="aws" name="aws" defaultValue=""
                  className="w-full rounded-xl border bg-black/30 px-4 py-2.5 text-white outline-none"
                  style={{ borderColor: "rgba(255,255,255,.16)" }}>
                  <option value="">Select…</option>
                  <option>Yes — AWS is our primary cloud</option>
                  <option>Yes — alongside another cloud</option>
                  <option>No — we run on GCP</option>
                  <option>No — we run on Azure</option>
                  <option>No — on-premise / private render farm</option>
                  <option>Not sure</option>
                </select>
                <input name="awsDetail" placeholder="Account, region, or rough monthly spend (optional)"
                  className="mt-2 w-full rounded-xl border bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
                  style={{ borderColor: "rgba(255,255,255,.16)" }} />
              </div>

              <div className="mt-3">
                <label htmlFor="note" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-white/45">
                  Anything we should know <span className="font-medium normal-case tracking-normal text-white/30">(optional)</span>
                </label>
                <textarea id="note" name="note" rows={2}
                  className="w-full rounded-xl border bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
                  style={{ borderColor: "rgba(255,255,255,.16)" }}
                  placeholder="What are you working on, and what would make this worth your time?" />
              </div>

              <button type="submit" disabled={pending}
                className="mt-5 w-full rounded-xl px-4 py-3 font-bold text-white transition-transform hover:-translate-y-px disabled:opacity-50"
                style={{ background: `linear-gradient(120deg, ${ACCENT}, #ff8a4b)` }}>
                {pending ? "Sending…" : "Grant me access"}
              </button>
              <p className="mt-3 text-center text-[11px] text-white/30">
                Goes straight to Jeff Cline. No list, no sequence, no sharing.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({ name, label, type = "text", required, autoFocus }: { name: string; label: string; type?: string; required?: boolean; autoFocus?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-white/45">{label}</label>
      <input id={name} name={name} type={type} required={required} autoFocus={autoFocus}
        className="w-full rounded-xl border bg-black/30 px-4 py-2.5 text-white outline-none placeholder:text-white/25"
        style={{ borderColor: "rgba(255,255,255,.16)" }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ graphics ══ */

/** The pipeline, drawn as a single continuous flow. */
function PipelineFlow({ color = ACCENT }: { color?: string }) {
  const steps = ["Intent", "Story", "World", "Assets", "Production", "Assembly", "Rights", "Market", "Revenue"];
  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(760, steps.length * 96)} height="92" role="img" aria-label="Production pipeline">
        {steps.map((s, i) => {
          const x = i * 96 + 10;
          return (
            <g key={s}>
              <rect x={x} y={26} width={80} height={38} rx={8} fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.14)" />
              <text x={x + 40} y={50} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#fff">{s}</text>
              {i < steps.length - 1 && (
                <>
                  <line x1={x + 80} y1={45} x2={x + 96} y2={45} stroke={color} strokeWidth="2" opacity=".75" />
                  <polygon points={`${x + 96},45 ${x + 90},41 ${x + 90},49`} fill={color} />
                </>
              )}
            </g>
          );
        })}
        <text x="10" y="18" fontSize="10.5" fontWeight="800" fill={color} letterSpacing="1.4">ONE GRAPH, END TO END</text>
        <path d={`M ${steps.length * 96 - 46} 70 L ${steps.length * 96 - 46} 82 L 50 82 L 50 70`} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity=".6" />
        <text x={steps.length * 48} y="92" textAnchor="middle" fontSize="10" fill={color} opacity=".75">performance data returns to the graph</text>
      </svg>
    </div>
  );
}

/** Orchestrator → departments → specialists, as a real hierarchy. */
function AgentGraph({ color = ACCENT }: { color?: string }) {
  const depts = AGENT_TREE.departments;
  const w = Math.max(880, depts.length * 92);
  return (
    <div className="overflow-x-auto">
      <svg width={w} height="290" role="img" aria-label="Agent hierarchy">
        <rect x={w / 2 - 92} y={6} width={184} height={34} rx={9} fill={color} />
        <text x={w / 2} y={28} textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">{AGENT_TREE.root}</text>
        <line x1={w / 2} y1={40} x2={w / 2} y2={56} stroke={color} strokeWidth="2" />
        <rect x={w / 2 - 100} y={56} width={200} height={30} rx={8} fill="rgba(255,255,255,.08)" stroke={color} />
        <text x={w / 2} y={76} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">{AGENT_TREE.second}</text>
        <line x1={w / 2} y1={86} x2={w / 2} y2={102} stroke={color} strokeWidth="2" />
        <rect x={w / 2 - 74} y={102} width={148} height={30} rx={8} fill="rgba(255,255,255,.08)" stroke={color} />
        <text x={w / 2} y={122} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">{AGENT_TREE.third}</text>
        <line x1={w / 2} y1={132} x2={w / 2} y2={146} stroke={color} strokeWidth="2" />
        <line x1={46} y1={146} x2={w - 46} y2={146} stroke={color} strokeWidth="1.5" opacity=".55" />
        {depts.map((d, i) => {
          const x = 46 + i * ((w - 92) / (depts.length - 1 || 1));
          return (
            <g key={d.name}>
              <line x1={x} y1={146} x2={x} y2={162} stroke={color} strokeWidth="1.5" opacity=".55" />
              <rect x={x - 38} y={162} width={76} height={26} rx={7} fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.16)" />
              <text x={x} y={179} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">{d.name}</text>
              {d.agents.map((a, j) => (
                <g key={a}>
                  <rect x={x - 40} y={196 + j * 22} width={80} height={18} rx={4} fill="rgba(255,255,255,.03)" />
                  <text x={x} y={209 + j * 22} textAnchor="middle" fontSize="8.5" fill="rgba(255,255,255,.6)">{a}</text>
                </g>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Layer cake — the NVIDIA-style stack diagram. */
function LayerCake() {
  const layers = [
    { n: "Creative intent", d: "Natural language. A brief, a note, a change.", c: "#ff5b2e" },
    { n: "Orchestration layer", d: "Decomposition, delegation, budgets, approvals, memory.", c: "#f5a623" },
    { n: "Department & specialist agents", d: "250+ agents with scope, context and escalation paths.", c: "#39c07c" },
    { n: "Capability surface (290+)", d: "Engine functions, generative models, simulation, render, audio.", c: "#2f9df4" },
    { n: "Scene graph — OpenUSD", d: "The single composable truth. Every agent reads and writes here.", c: "#8b6ef6" },
    { n: "Execution engines", d: "Unreal, renderers, physics, DCC tools, physical stages.", c: "#e14b8a" },
    { n: "Telemetry & rights ledger", d: "Provenance, cost, approvals, performance — feeding back up.", c: "#00c2b2" },
  ];
  return (
    <div className="space-y-2">
      {layers.map((l, i) => (
        <div key={l.n} className="relative overflow-hidden rounded-xl border px-4 py-3.5"
          style={{ borderColor: `color-mix(in srgb, ${l.c} 45%, transparent)`,
                   background: `linear-gradient(90deg, color-mix(in srgb, ${l.c} 13%, transparent), transparent 70%)` }}>
          <div className="absolute left-0 top-0 h-full w-1" style={{ background: l.c }} />
          <div className="flex flex-wrap items-baseline justify-between gap-2 pl-2">
            <div className="font-mono text-[13.5px] font-bold" style={{ color: l.c }}>
              <span className="opacity-50">{String(i + 1).padStart(2, "0")}</span> {l.n}
            </div>
            <div className="text-[12.5px] text-white/50">{l.d}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** The 25-system stack, grouped by band. */
function StackGrid() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-6">
      {STACK_BANDS.map((band) => {
        const items = STACK.filter((s) => s.band === band.id);
        return (
          <div key={band.id}>
            <div className="mb-2.5 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: band.color }} />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.16em]" style={{ color: band.color }}>{band.name}</span>
              <span className="text-[11px] text-white/25">{items.length} systems</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((s) => (
                <button key={s.n} type="button" onClick={() => setOpen(open === s.n ? null : s.n)}
                  className="rounded-xl border p-3.5 text-left transition-all hover:-translate-y-px"
                  style={{ borderColor: open === s.n ? band.color : "rgba(255,255,255,.10)",
                           background: open === s.n ? `color-mix(in srgb, ${band.color} 10%, transparent)` : "rgba(255,255,255,.025)" }}>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] font-bold" style={{ color: band.color }}>{String(s.n).padStart(2, "0")}</span>
                    <span className="text-[13.5px] font-bold leading-tight text-white">{s.name}</span>
                  </div>
                  <div className={`mt-1.5 text-[12.5px] leading-relaxed text-white/50 ${open === s.n ? "" : "line-clamp-2"}`}>{s.what}</div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** One world, many outputs. */
function OneWorld({ color = ACCENT }: { color?: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
      <Card>
        <Kicker color={color}>The world</Kicker>
        <div className="mt-1 text-2xl font-extrabold text-white">{ONE_WORLD.project}</div>
        <div className="mt-3 space-y-2.5">
          {([["World", ONE_WORLD.world], ["Characters", ONE_WORLD.characters], ["Story", ONE_WORLD.story]] as const).map(([k, v]) => (
            <div key={k}>
              <div className="text-[11px] font-bold uppercase tracking-wide text-white/35">{k}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {v.map((x) => (
                  <span key={x} className="rounded-md px-1.5 py-0.5 text-[11px] text-white/60" style={{ background: "rgba(255,255,255,.05)" }}>{x}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="hidden text-center lg:block">
        <div className="text-3xl" style={{ color }}>→</div>
        <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/30">choose<br />an output</div>
      </div>
      <div className="space-y-2">
        {ONE_WORLD.outputs.map((o) => (
          <div key={o.k} className="rounded-xl border px-4 py-3" style={{ borderColor: "rgba(255,255,255,.10)", background: "rgba(255,255,255,.025)" }}>
            <div className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color }}>{o.k}</div>
            <div className="mt-0.5 text-[13.5px] italic text-white/70">{o.v}</div>
          </div>
        ))}
        <div className="pt-1 text-center text-[12px] text-white/40">Same world. Same assets. Same characters. Same IP graph.</div>
      </div>
    </div>
  );
}

/** Production Intelligence estimate. */
function EstimatePanel({ color = ACCENT }: { color?: string }) {
  return (
    <Card style={{ background: "rgba(0,0,0,.3)" }}>
      <Kicker color={color}>Production Intelligence · before a frame is generated</Kicker>
      <div className="mt-2 rounded-lg px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-white/70" style={{ background: "rgba(255,255,255,.04)" }}>
        &gt; {ESTIMATE_DEMO.brief}
      </div>
      <div className="mt-4 divide-y" style={{ borderColor: "rgba(255,255,255,.08)" }}>
        {ESTIMATE_DEMO.rows.map((r) => (
          <div key={r.k} className="flex items-baseline justify-between gap-4 py-2">
            <span className="text-[13px] text-white/50">{r.k}</span>
            <span className="font-mono text-[14px] font-bold text-white">{r.v}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="rounded-lg px-4 py-2 text-sm font-extrabold text-white" style={{ background: `linear-gradient(120deg, ${color}, #ff8a4b)` }}>BUILD PROJECT</div>
        <div className="text-[11.5px] text-white/35">and the agent swarm starts</div>
      </div>
      <p className="mt-3 text-[11.5px] leading-relaxed text-white/35">{ESTIMATE_DEMO.note}</p>
    </Card>
  );
}

/** The one section that is not a projection: what the stack already consumes. */
function ComputeReality({ color = ACCENT }: { color?: string }) {
  return (
    <Section id="compute" className="border-t">
      <Kicker color={color}>Not a projection</Kicker>
      <h2 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">
        The stack is already running. Here is what it costs.
      </h2>
      <p className="mt-3 max-w-3xl text-[15.5px] leading-relaxed text-white/55">
        Every AI platform pitch is a diagram until someone shows the bill. This one has a
        production stack in operation today, routing across OpenAI, Anthropic and open-weight
        models by task, cost and latency.
      </p>

      <div className="mt-7 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border p-5 sm:col-span-3"
            style={{ borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
                     background: `linear-gradient(130deg, color-mix(in srgb, ${color} 16%, transparent), transparent 70%)` }}>
            <div className="text-6xl font-extrabold leading-none tracking-tight text-white sm:text-7xl">{COMPUTE.headline}</div>
            <div className="mt-1.5 text-[15px] font-bold" style={{ color }}>{COMPUTE.headlineUnit}</div>
            <div className="mt-2 text-[13.5px] leading-relaxed text-white/55">{COMPUTE.subhead}</div>
          </div>
          <Card className="sm:col-span-1">
            <div className="text-3xl font-extrabold text-white">{COMPUTE.budget}</div>
            <div className="mt-1 text-[12px] leading-snug text-white/45">{COMPUTE.budgetLabel}</div>
          </Card>
          <Card className="sm:col-span-1">
            <div className="text-3xl font-extrabold text-white">{COMPUTE.perMonth}</div>
            <div className="mt-1 text-[12px] leading-snug text-white/45">{COMPUTE.perMonthLabel}</div>
          </Card>
          <Card className="sm:col-span-1">
            <div className="text-3xl font-extrabold text-white">3</div>
            <div className="mt-1 text-[12px] leading-snug text-white/45">model providers in live rotation</div>
          </Card>
        </div>

        <Card style={{ background: "rgba(0,0,0,.3)" }}>
          <Kicker color={color}>Retail equivalent, by volume</Kicker>
          <div className="mt-3 space-y-1">
            {COMPUTE.ladder.map((r) => {
              const pct = (parseFloat(r.tokens) / 100) * 100;
              return (
                <div key={r.tokens} className="flex items-center gap-3">
                  <div className="w-12 shrink-0 font-mono text-[12px] font-bold text-white/70">{r.tokens}</div>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, background: `linear-gradient(90deg, ${color}, #ff8a4b)` }} />
                  </div>
                  <div className="w-16 shrink-0 text-right font-mono text-[12px] font-bold text-white">{r.retail}</div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-white/40">{COMPUTE.ladderNote}</p>
        </Card>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {COMPUTE.points.map((p) => (
          <Card key={p.k}>
            <div className="text-[13.5px] font-bold text-white">{p.k}</div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-white/50">{p.v}</p>
          </Card>
        ))}
      </div>

      <div className="mt-5 rounded-xl border px-4 py-3"
        style={{ borderColor: "rgba(245,166,35,.35)", background: "rgba(245,166,35,.07)" }}>
        <div className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: "#f5a623" }}>
          Internal note — resolve before this goes outside
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">{COMPUTE.FOOTNOTE}</p>
      </div>
    </Section>
  );
}

/* ═════════════════════════════════════════════════════════════ the lenses ══ */

function StudioLens({ audience }: { audience: Audience | null }) {
  return (
    <>
      <Section>
        <Kicker>The floor</Kicker>
        <h2 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">
          Greenlight to final pixel, without the forty hand-offs in between.
        </h2>
        <p className="mt-4 max-w-3xl text-[16.5px] leading-relaxed text-white/60">
          A modern production is assembled, not operated. Development, previs, principal
          photography, post, finishing, localisation and delivery each run on their own tools,
          their own files and their own version of the truth. The schedule is mostly waiting.
          The overage is mostly translation loss.
        </p>
        {audience && (
          <Card className="mt-6" style={{ borderColor: "rgba(255,91,46,.4)", background: "rgba(255,91,46,.07)" }}>
            <Kicker>Reading as {audience.name}</Kicker>
            <p className="mt-1.5 text-[15px] leading-relaxed text-white/75">{audience.hook}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/45"><b className="text-white/65">What you will ask first:</b> {audience.proof}</p>
          </Card>
        )}
        <div className="mt-8"><PipelineFlow /></div>
      </Section>

      <Section className="border-t" >
        <Kicker>The crew, as an org chart</Kicker>
        <h2 className="mt-2 text-3xl font-extrabold text-white">Departments you recognise. Agents you direct.</h2>
        <p className="mt-3 max-w-3xl text-[15.5px] leading-relaxed text-white/55">
          The hierarchy is deliberately familiar: an executive producer above a director, a
          director above departments, departments above specialists. Scope, budget and
          escalation work the way a unit works — because that structure already survived a
          century of production, and because you need to know who to talk to when a shot is wrong.
        </p>
        <div className="mt-7"><AgentGraph /></div>
      </Section>

      <Section className="border-t">
        <Kicker>The dailies question</Kicker>
        <h2 className="mt-2 text-3xl font-extrabold text-white">Where the human still holds the pen.</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { t: "Taste", d: "Every creative gate — script approval, casting, cut approval, final grade — is a human checkpoint, logged and reversible." },
            { t: "Law", d: "No deliverable leaves the system with an incomplete rights chain. Likeness, voice, music and asset provenance are gates, not reports." },
            { t: "Money", d: "Budget thresholds, compute spend and P&A commitments all require named approval before an agent proceeds." },
          ].map((x) => (
            <Card key={x.t}>
              <div className="text-lg font-extrabold text-white">{x.t}</div>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/55">{x.d}</p>
            </Card>
          ))}
        </div>
        <p className="mt-5 text-[14px] italic text-white/45">
          The estimate on a 110-minute feature carries 37 human approvals. That is the design,
          not a limitation of it.
        </p>
      </Section>

      <ComputeReality />

      <Section className="border-t">
        <Kicker>Slate economics</Kicker>
        <h2 className="mt-2 text-3xl font-extrabold text-white">The second title in a world is a different business.</h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-white/40">What compresses</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ECON_LEVERS.compress.map((x) => <span key={x} className="rounded-lg px-2.5 py-1 text-[12.5px] text-white/70" style={{ background: "rgba(255,91,46,.12)" }}>{x}</span>)}
            </div>
            <div className="mt-5 text-xs font-bold uppercase tracking-wide text-white/40">What expands</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ECON_LEVERS.expand.map((x) => <span key={x} className="rounded-lg px-2.5 py-1 text-[12.5px] text-white/70" style={{ background: "rgba(57,192,124,.14)" }}>{x}</span>)}
            </div>
            <Card className="mt-6" style={{ borderColor: "rgba(255,255,255,.16)" }}>
              <div className="text-[13px] font-bold text-white">We are not publishing savings percentages.</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">
                Not because they will not be real, but because nobody has earned them yet. What
                we will commit to is the measurement — these are the KPIs a first production
                establishes as a baseline.
              </p>
              <ul className="mt-3 space-y-1">
                {ECON_LEVERS.kpis.map((k) => (
                  <li key={k} className="flex gap-2 text-[12.5px] text-white/55"><span style={{ color: ACCENT }}>▸</span>{k}</li>
                ))}
              </ul>
            </Card>
          </div>
          <EstimatePanel />
        </div>
      </Section>

      <Section className="border-t">
        <Kicker>The output question</Kicker>
        <h2 className="mt-2 text-3xl font-extrabold text-white">You do not make a movie, then make a game.</h2>
        <p className="mt-3 max-w-3xl text-[15.5px] leading-relaxed text-white/55">
          You make a world, and then choose what to render out of it. That single change is what
          turns a title into a franchise and a franchise into a library.
        </p>
        <div className="mt-7"><OneWorld /></div>
      </Section>
    </>
  );
}

function StackLens({ audience }: { audience: Audience | null }) {
  const green = "#39c07c";
  return (
    <>
      <Section>
        <Kicker color={green}>Architecture</Kicker>
        <h2 className="mt-2 max-w-3xl font-mono text-3xl font-extrabold leading-tight text-white sm:text-4xl">
          Creative intent → orchestrator → agents → capabilities → scene graph → final pixel
        </h2>
        <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-white/60">
          The interesting problem is not generation. It is <b className="text-white">context</b> —
          giving a tool call enough awareness of the project to be worth making, and a place to
          write its result that everything else can read.
        </p>
        {audience && (
          <Card className="mt-6" style={{ borderColor: `color-mix(in srgb, ${green} 45%, transparent)`, background: `color-mix(in srgb, ${green} 8%, transparent)` }}>
            <Kicker color={green}>Reading as {audience.name}</Kicker>
            <p className="mt-1.5 text-[15px] leading-relaxed text-white/75">{audience.hook}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/45"><b className="text-white/65">The question you will ask:</b> {audience.proof}</p>
          </Card>
        )}
        <div className="mt-8"><LayerCake /></div>
      </Section>

      <Section className="border-t">
        <Kicker color={green}>Honesty layer</Kicker>
        <h2 className="mt-2 text-3xl font-extrabold text-white">What exists today, what we build, what is vision.</h2>
        <p className="mt-3 max-w-3xl text-[15.5px] leading-relaxed text-white/55">
          Conflating these three is how AI media pitches lose technical audiences in the first
          ninety seconds. So they are separated, explicitly, everywhere.
        </p>
        <div className="mt-6 space-y-3">
          {MATURITY.map((m) => (
            <div key={m.label} className="overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(255,255,255,.10)" }}>
              <div className="px-4 py-2.5 font-mono text-[13px] font-bold text-white" style={{ background: "rgba(255,255,255,.04)" }}>{m.label}</div>
              <div className="grid gap-px sm:grid-cols-3" style={{ background: "rgba(255,255,255,.07)" }}>
                {([["Exists today", m.today, "#39c07c"], ["We build", m.build, "#2f9df4"], ["Long-term vision", m.vision, "#8b6ef6"]] as const).map(([k, v, c]) => (
                  <div key={k} className="p-4" style={{ background: "#0d121d" }}>
                    <div className="text-[10.5px] font-extrabold uppercase tracking-widest" style={{ color: c }}>{k}</div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/60">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-t">
        <Kicker color={green}>Agent topology</Kicker>
        <h2 className="mt-2 text-3xl font-extrabold text-white">Not one model. A hierarchy with scope.</h2>
        <p className="mt-3 max-w-3xl text-[15.5px] leading-relaxed text-white/55">
          A single enormous agent fails the moment a production gets complex — context runs out,
          responsibility blurs, and there is nowhere to put an approval. Delegation with explicit
          memory and budget per node is the difference between a demo and a system.
        </p>
        <div className="mt-7"><AgentGraph color={green} /></div>
      </Section>

      <Section className="border-t">
        <Kicker color={green}>Capability surface</Kicker>
        <h2 className="mt-2 text-3xl font-extrabold text-white">Twenty-five systems. Two hundred and ninety capabilities.</h2>
        <p className="mt-3 max-w-3xl text-[15.5px] leading-relaxed text-white/55">
          The number is not the argument. Capabilities that do not share a scene graph are just
          more tools — the argument is that all of these read and write the same truth.
        </p>
        <div className="mt-7"><StackGrid /></div>
      </Section>

      <ComputeReality color={green} />

      <Section className="border-t">
        <Kicker color={green}>Estimation</Kicker>
        <h2 className="mt-2 text-3xl font-extrabold text-white">Compute is the constraint. So price it first.</h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <EstimatePanel color={green} />
          <div>
            <OneWorld color={green} />
          </div>
        </div>
      </Section>
    </>
  );
}

function InvestorLens({ audience }: { audience: Audience | null }) {
  const blue = "#2f9df4";
  return (
    <>
      <Section>
        <Kicker color={blue}>The case</Kicker>
        <h2 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">
          Everyone owns a piece of the stack. Nobody owns the orchestration.
        </h2>
        <p className="mt-4 max-w-3xl text-[16.5px] leading-relaxed text-white/60">{WHITE_SPACE}</p>
        {audience && (
          <Card className="mt-6" style={{ borderColor: `color-mix(in srgb, ${blue} 45%, transparent)`, background: `color-mix(in srgb, ${blue} 8%, transparent)` }}>
            <Kicker color={blue}>Reading as {audience.name}</Kicker>
            <p className="mt-1.5 text-[15px] leading-relaxed text-white/75">{audience.hook}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/45"><b className="text-white/65">Your diligence starts at:</b> {audience.proof}</p>
          </Card>
        )}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {ONE_SHEET.map((r) => (
            <Card key={r.k}>
              <Kicker color={blue}>{r.k}</Kicker>
              <p className="mt-1.5 text-[14px] leading-relaxed text-white/70">{r.v}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="border-t">
        <Kicker color={blue}>Defensibility</Kicker>
        <h2 className="mt-2 text-3xl font-extrabold text-white">What actually compounds — and what does not.</h2>
        <p className="mt-3 max-w-3xl text-[15.5px] leading-relaxed text-white/55">
          Most AI media decks list features and call them a moat. These are separated on purpose,
          because the copyable half is the half a competitor closes in a quarter.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: "#39c07c" }}>Real moat · compounds</div>
            <div className="space-y-2">
              {MOAT.filter((m) => m.real).map((m) => (
                <Card key={m.name} style={{ borderColor: "rgba(57,192,124,.3)", background: "rgba(57,192,124,.06)" }}>
                  <div className="text-[14.5px] font-bold text-white">{m.name}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/55">{m.why}</p>
                </Card>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-white/35">Not a moat · copyable</div>
            <div className="space-y-2">
              {MOAT.filter((m) => !m.real).map((m) => (
                <Card key={m.name} style={{ opacity: 0.72 }}>
                  <div className="text-[14.5px] font-bold text-white/70">{m.name}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/45">{m.why}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section className="border-t">
        <Kicker color={blue}>The flywheel</Kicker>
        <h2 className="mt-2 text-3xl font-extrabold text-white">Every production makes the platform smarter.</h2>
        <div className="mt-7 grid gap-3 md:grid-cols-5">
          {FLYWHEEL.map((f, i) => (
            <div key={f.k} className="relative rounded-2xl border p-4" style={{ borderColor: "rgba(255,255,255,.10)", background: "rgba(255,255,255,.025)" }}>
              <div className="font-mono text-[11px] font-bold" style={{ color: blue }}>{String(i + 1).padStart(2, "0")}</div>
              <div className="mt-1 text-[13.5px] font-bold text-white">{f.k}</div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-white/50">{f.v}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[14.5px] italic text-white/50">The tenth production is not ten times the first. It is a different business.</p>
      </Section>

      <Section className="border-t">
        <Kicker color={blue}>Landscape</Kicker>
        <h2 className="mt-2 text-3xl font-extrabold text-white">Who owns what.</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                {["Player", "Owns", "Does not attempt"].map((h) => (
                  <th key={h} className="border-b px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-white/40" style={{ borderColor: "rgba(255,255,255,.12)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPETITIVE.map((c) => (
                <tr key={c.who}>
                  <td className="border-b px-3 py-3 text-[14px] font-bold text-white" style={{ borderColor: "rgba(255,255,255,.06)" }}>{c.who}</td>
                  <td className="border-b px-3 py-3 text-[13px] text-white/60" style={{ borderColor: "rgba(255,255,255,.06)" }}>{c.owns}</td>
                  <td className="border-b px-3 py-3 text-[13px] text-white/45" style={{ borderColor: "rgba(255,255,255,.06)" }}>{c.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <ComputeReality color={blue} />

      <Section className="border-t">
        <Kicker color={blue}>Economics</Kicker>
        <h2 className="mt-2 text-3xl font-extrabold text-white">Priced before it is built.</h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <EstimatePanel color={blue} />
          <Card>
            <Kicker color={blue}>Three revenue lines</Kicker>
            <div className="mt-3 space-y-3">
              {[
                { t: "Platform", d: "Licence and compute for studios operating it themselves. Recurring, high gross margin, expands with their slate." },
                { t: "Production services", d: "Titles we run end to end. Lower margin, far higher contract value, and the fastest way to prove the KPIs." },
                { t: "IP participation", d: "Equity in what the platform creates. The asymmetric line — and the one the data flywheel makes progressively smarter." },
              ].map((x) => (
                <div key={x.t}>
                  <div className="text-[14.5px] font-bold text-white">{x.t}</div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-white/55">{x.d}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 border-t pt-3 text-[12.5px] leading-relaxed text-white/40" style={{ borderColor: "rgba(255,255,255,.1)" }}>
              We can sell the road, drive on it, or own the cargo. The thesis is that the same
              platform makes all three possible, and that each one makes the other two cheaper.
            </p>
          </Card>
        </div>
      </Section>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════ shell ══ */

export function AEOSExperience({ password }: { password: string }) {
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [audienceId, setAudienceId] = useState<string | null>(null);
  const [lens, setLens] = useState<Lens>("studio");
  const [tab, setTab] = useState<"deck" | "summary" | "onesheet" | "reel">("deck");

  useEffect(() => {
    try { if (localStorage.getItem(GATE_KEY) === "1") setUnlocked(true); } catch { /* ignore */ }
    setReady(true);
  }, []);

  const audience = useMemo(() => AUDIENCES.find((a) => a.id === audienceId) ?? null, [audienceId]);

  function pick(a: Audience) {
    setAudienceId(a.id);
    setLens(a.lens);
    requestAnimationFrame(() => document.getElementById("lens-top")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  if (!ready) return <div style={{ minHeight: "100dvh", background: "#0a0e17" }} />;
  if (!unlocked) return <Gate password={password} onPass={() => setUnlocked(true)} />;

  return (
    <main className="aeos min-h-[100dvh] text-white" style={{ background: "radial-gradient(120% 70% at 80% -10%, #191424, #0a0e17 55%)" }}>
      <style>{HEADING_FIX}</style>
      {/* ── hero ── */}
      <Section className="!pb-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white"
          style={{ background: "color-mix(in srgb, #ff5b2e 26%, transparent)" }}>
          <Rocket size={14} /> AEOS · An operating node of R0cketShip Holdings
        </div>
        <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
          Autonomous Entertainment<br /><span data-accent style={{ color: ACCENT }}>Operating System</span>
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/65 sm:text-xl">
          One creative intent becomes a film, an episodic series, a game, a trailer, an ad
          campaign, a localisation package, a distribution package — and ultimately a monetisable
          IP asset. Not a filmmaking tool. The operating system underneath the studio.
        </p>
        <div className="mt-7 flex flex-wrap gap-2">
          {POSITIONING.slice(0, 5).map((p) => (
            <span key={p} className="rounded-full border px-3 py-1.5 text-[12.5px] text-white/60" style={{ borderColor: "rgba(255,255,255,.14)" }}>{p}</span>
          ))}
        </div>
      </Section>

      {/* ── audience selector ── */}
      <Section className="!py-8">
        <Card style={{ borderColor: "rgba(255,91,46,.3)", background: "rgba(255,91,46,.05)" }}>
          <Kicker>Start here</Kicker>
          <h2 className="mt-1.5 text-2xl font-extrabold text-white">What do you do?</h2>
          <p className="mt-1.5 max-w-2xl text-[14.5px] leading-relaxed text-white/55">
            The argument is the same either way — the evidence you will want is not. Pick your
            industry and the deck reframes itself. You can change the lens at any point.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {AUDIENCES.map((a) => (
              <button key={a.id} type="button" onClick={() => pick(a)}
                className="rounded-xl border px-3.5 py-2.5 text-left transition-all hover:-translate-y-px"
                style={{ borderColor: audienceId === a.id ? ACCENT : "rgba(255,255,255,.12)",
                         background: audienceId === a.id ? "rgba(255,91,46,.14)" : "rgba(255,255,255,.03)" }}>
                <div className="flex items-center gap-2 text-[13.5px] font-bold text-white"><span>{a.icon}</span>{a.name}</div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wide text-white/35">
                  → {LENSES.find((l) => l.id === a.lens)!.name}
                </div>
              </button>
            ))}
          </div>
          {audience && (
            <div className="mt-5 rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,.14)", background: "rgba(0,0,0,.25)" }}>
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-white/35">What we assume is on your mind</div>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-white/70">{audience.pain}</p>
            </div>
          )}
        </Card>
      </Section>

      {/* ── lens switcher ── */}
      <div id="lens-top" className="sticky top-0 z-40 border-y backdrop-blur"
        style={{ borderColor: "rgba(255,255,255,.10)", background: "rgba(10,14,23,.86)" }}>
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 py-2.5 sm:px-8">
          {LENSES.map((l) => (
            <button key={l.id} type="button" onClick={() => setLens(l.id)}
              className="whitespace-nowrap rounded-lg px-3.5 py-2 text-[13px] font-bold transition-colors"
              style={{ background: lens === l.id ? "rgba(255,91,46,.16)" : "transparent",
                       color: lens === l.id ? "#fff" : "rgba(255,255,255,.45)" }}>
              <span className="mr-1.5">{l.icon}</span>{l.name}
            </button>
          ))}
          <div className="ml-auto hidden items-center pr-1 text-[11.5px] text-white/30 lg:flex">
            {LENSES.find((l) => l.id === lens)!.blurb}
          </div>
        </div>
      </div>

      {lens === "studio" && <StudioLens audience={audience} />}
      {lens === "stack" && <StackLens audience={audience} />}
      {lens === "investor" && <InvestorLens audience={audience} />}

      {/* ── documents ── */}
      <Section className="border-t">
        <Kicker>The documents</Kicker>
        <h2 className="mt-2 text-3xl font-extrabold text-white">Everything else you would ask for.</h2>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {([["deck", "15-slide deck"], ["summary", "Executive summary"], ["onesheet", "One-page sizzle"], ["reel", "90-second reel"]] as const).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className="rounded-lg px-3.5 py-2 text-[13px] font-bold transition-colors"
              style={{ background: tab === k ? "rgba(255,91,46,.16)" : "rgba(255,255,255,.04)",
                       color: tab === k ? "#fff" : "rgba(255,255,255,.5)" }}>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "deck" && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {DECK.map((s) => (
                <Card key={s.n} className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[11px] font-bold" style={{ color: ACCENT }}>{String(s.n).padStart(2, "0")}</span>
                    <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-white/35">{s.kicker}</span>
                  </div>
                  <div className="mt-1.5 text-[16px] font-extrabold leading-tight text-white">{s.title}</div>
                  <div className="mt-1 text-[13px] text-white/50">{s.sub}</div>
                  <ul className="mt-3 flex-1 space-y-1.5">
                    {s.points.map((p) => (
                      <li key={p} className="flex gap-2 text-[12.5px] leading-relaxed text-white/55"><span style={{ color: ACCENT }}>▸</span>{p}</li>
                    ))}
                  </ul>
                  <div className="mt-3 border-t pt-2.5 text-[12.5px] italic" style={{ borderColor: "rgba(255,255,255,.1)", color: ACCENT }}>
                    “{s.sizzle}”
                  </div>
                </Card>
              ))}
            </div>
          )}

          {tab === "summary" && (
            <div className="max-w-3xl space-y-5">
              {EXEC_SUMMARY.map((s) => (
                <div key={s.h}>
                  <h3 className="text-lg font-extrabold text-white">{s.h}</h3>
                  <p className="mt-1.5 text-[15.5px] leading-relaxed text-white/60">{s.p}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "onesheet" && (
            <div className="mx-auto max-w-3xl rounded-2xl border p-8" style={{ borderColor: "rgba(255,255,255,.14)", background: "rgba(0,0,0,.3)" }}>
              <div className="text-center">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>AEOS</div>
                <div className="mt-1 text-3xl font-extrabold text-white">From Greenlight to Final Pixel</div>
              </div>
              <div className="mt-7 space-y-4">
                {ONE_SHEET.map((r) => (
                  <div key={r.k} className="grid gap-1 sm:grid-cols-[150px_1fr] sm:gap-4">
                    <div className="text-[11px] font-extrabold uppercase tracking-widest text-white/40 sm:pt-1">{r.k}</div>
                    <div className="text-[15px] leading-relaxed text-white/75">{r.v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-8 border-t pt-5 text-center text-lg font-extrabold" style={{ borderColor: "rgba(255,255,255,.14)", color: ACCENT }}>
                {CLOSING_LINE}
              </div>
            </div>
          )}

          {tab === "reel" && (
            <div className="max-w-4xl overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(255,255,255,.12)" }}>
              {SIZZLE.map((s, i) => (
                <div key={s.t} className="grid gap-3 border-b p-4 sm:grid-cols-[64px_1fr_1fr]"
                  style={{ borderColor: "rgba(255,255,255,.07)", background: i % 2 ? "rgba(255,255,255,.02)" : "transparent" }}>
                  <div className="font-mono text-[13px] font-bold" style={{ color: ACCENT }}>{s.t}</div>
                  <div>
                    <div className="text-[13.5px] leading-relaxed text-white/75">{s.v}</div>
                    <div className="mt-1 text-[12px] italic text-white/40">{s.a}</div>
                  </div>
                  {s.s && (
                    <div className="self-center rounded-lg px-3 py-2 text-center font-mono text-[12.5px] font-bold tracking-wider text-white"
                      style={{ background: "rgba(255,91,46,.14)" }}>{s.s}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* ── close ── */}
      <Section className="border-t">
        <div className="rounded-3xl border p-10 text-center" style={{ borderColor: "rgba(255,91,46,.35)", background: "linear-gradient(150deg, rgba(255,91,46,.12), transparent 65%)" }}>
          <Kicker>The question</Kicker>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            What would Hollywood look like if we were inventing the entire production stack today?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-white/60">
            One prompt. One world. Every medium. Movie, game, television, AR/VR, advertising,
            social, interactive, merchandising, licensing — all from the same underlying digital IP.
          </p>
          <div className="mt-7 text-xl font-extrabold" style={{ color: ACCENT }}>{CLOSING_LINE}</div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="tel:9728006670" className="rounded-xl px-6 py-3 font-bold text-white" style={{ background: `linear-gradient(120deg, ${ACCENT}, #ff8a4b)` }}>
              Talk to Jeff — 972-800-6670
            </a>
            <a href="/corporate-structure" className="rounded-xl border px-6 py-3 font-bold text-white/80" style={{ borderColor: "rgba(255,255,255,.2)" }}>
              Back to the ecosystem
            </a>
          </div>
        </div>
        <p className="mt-8 text-center text-[11.5px] leading-relaxed text-white/25">
          Confidential. Prepared for named recipients only. Forward-looking statements describe
          intended architecture and strategy, not shipped product. HyperReal™ and Virtual Reel™
          are working brand concepts, not asserted registrations.
        </p>
      </Section>
    </main>
  );
}
