"use client";
/**
 * Every chart on the AEOS deck, as inline SVG. No library, no CDN, nothing to
 * load, and it all prints. Each one takes an accent colour so the same chart
 * reads correctly in the studio, technical and investor lenses.
 */
import type { TrendPoint } from "./aeos-content";
import { QUARTERS, YEARS, EXIT, CAP_TABLE, usd } from "./finance";

const GRID = "rgba(255,255,255,.07)";
const AXIS = "rgba(255,255,255,.34)";

/* ── two-series trend, area + line ─────────────────────────────────────────── */
export function TrendChart({ data, aLabel, bLabel, color = "#ff5b2e", height = 230 }:
  { data: TrendPoint[]; aLabel: string; bLabel: string; color?: string; height?: number }) {
  const w = 640, pad = { l: 34, r: 14, t: 16, b: 30 };
  const iw = w - pad.l - pad.r, ih = height - pad.t - pad.b;
  const all = data.flatMap((d) => [d.a, d.b ?? 0]);
  const max = Math.max(...all) * 1.08 || 1;
  const x = (i: number) => pad.l + (i / Math.max(data.length - 1, 1)) * iw;
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const line = (key: "a" | "b") => data.map((d, i) => `${i ? "L" : "M"} ${x(i)} ${y(d[key] ?? 0)}`).join(" ");
  const area = `${line("b")} L ${x(data.length - 1)} ${pad.t + ih} L ${x(0)} ${pad.t + ih} Z`;

  return (
    <div className="overflow-x-auto">
      <svg width={w} height={height} role="img" aria-label={`${aLabel} versus ${bLabel}`} className="min-w-full">
        <defs>
          <linearGradient id={`g-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".34" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} y1={pad.t + ih * f} x2={w - pad.r} y2={pad.t + ih * f} stroke={GRID} />
            <text x={pad.l - 6} y={pad.t + ih * f + 3.5} textAnchor="end" fontSize="9" fill={AXIS}>
              {Math.round(max * (1 - f))}
            </text>
          </g>
        ))}
        <path d={area} fill={`url(#g-${color.slice(1)})`} />
        <path d={line("a")} fill="none" stroke="rgba(255,255,255,.34)" strokeWidth="2" strokeDasharray="5 4" />
        <path d={line("b")} fill="none" stroke={color} strokeWidth="2.5" />
        {data.map((d, i) => (
          <g key={d.x}>
            <circle cx={x(i)} cy={y(d.b ?? 0)} r="3.5" fill={color} />
            <text x={x(i)} y={height - 10} textAnchor="middle" fontSize="9.5" fill={AXIS}>{d.x}</text>
          </g>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 text-[11.5px]">
        <span className="flex items-center gap-1.5 text-white/45">
          <svg width="18" height="3"><line x1="0" y1="1.5" x2="18" y2="1.5" stroke="rgba(255,255,255,.4)" strokeWidth="2" strokeDasharray="5 4" /></svg>
          {aLabel}
        </span>
        <span className="flex items-center gap-1.5" style={{ color }}>
          <svg width="18" height="3"><line x1="0" y1="1.5" x2="18" y2="1.5" stroke={color} strokeWidth="2.5" /></svg>
          {bLabel}
        </span>
      </div>
    </div>
  );
}

/* ── today vs software-defined, per cost line ──────────────────────────────── */
export function StackBars({ rows, color = "#ff5b2e" }:
  { rows: { label: string; today: number; after: number }[]; color?: string }) {
  const max = Math.max(...rows.flatMap((r) => [r.today, r.after]));
  return (
    <div className="space-y-2.5">
      {rows.map((r) => {
        const up = r.after > r.today;
        return (
          <div key={r.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="text-[12.5px] text-white/65">{r.label}</span>
              <span className="font-mono text-[12px] font-bold" style={{ color: up ? "#39c07c" : color }}>
                {up ? "↑" : "↓"} {r.after} <span className="font-normal text-white/25">vs 100</span>
              </span>
            </div>
            <div className="relative h-4 overflow-hidden rounded" style={{ background: "rgba(255,255,255,.05)" }}>
              <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${(r.today / max) * 100}%`, background: "rgba(255,255,255,.13)" }} />
              <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${(r.after / max) * 100}%`, background: up ? "linear-gradient(90deg,#1f7a4d,#39c07c)" : `linear-gradient(90deg, ${color}, #ff8a4b)` }} />
            </div>
          </div>
        );
      })}
      <div className="flex gap-4 pt-1 text-[11px] text-white/35">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded" style={{ background: "rgba(255,255,255,.13)" }} />today = 100</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded" style={{ background: color }} />software-defined</span>
      </div>
    </div>
  );
}

/* ── the revenue ramp, with cumulative EBITDA beneath ──────────────────────── */
export function RampChart({ color = "#ff5b2e" }: { color?: string }) {
  const w = 700, h = 260, pad = { l: 44, r: 14, t: 16, b: 42 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const maxRev = Math.max(...QUARTERS.map((q) => q.revenue)) * 1.05;
  const cums = QUARTERS.map((q) => q.cumulative);
  const cMin = Math.min(...cums, 0), cMax = Math.max(...cums);
  const bw = iw / QUARTERS.length;
  const yRev = (v: number) => pad.t + ih - (v / maxRev) * ih;
  const yCum = (v: number) => pad.t + ih - ((v - cMin) / (cMax - cMin || 1)) * ih;
  const zero = yCum(0);
  const cumLine = QUARTERS.map((q, i) => `${i ? "L" : "M"} ${pad.l + i * bw + bw / 2} ${yCum(q.cumulative)}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg width={w} height={h} role="img" aria-label="Quarterly revenue ramp and cumulative EBITDA" className="min-w-full">
        {[0, 0.5, 1].map((f) => (
          <line key={f} x1={pad.l} y1={pad.t + ih * f} x2={w - pad.r} y2={pad.t + ih * f} stroke={GRID} />
        ))}
        {QUARTERS.map((q, i) => {
          const bh = Math.max((q.revenue / maxRev) * ih, 1);
          return (
            <g key={q.q}>
              <rect x={pad.l + i * bw + 2} y={pad.t + ih - bh} width={bw - 4} height={bh} rx="2"
                fill={q.phase === "ramp" ? "rgba(255,255,255,.22)" : color}
                opacity={q.phase === "ramp" ? 1 : 0.92}>
                <title>{`${q.label} — revenue ${usd(q.revenue)}, EBITDA ${usd(q.ebitda)}`}</title>
              </rect>
              {i % 4 === 0 && (
                <text x={pad.l + i * bw + bw / 2} y={h - 24} textAnchor="middle" fontSize="9.5" fill={AXIS}>Y{q.year}</text>
              )}
            </g>
          );
        })}
        <line x1={pad.l} y1={zero} x2={w - pad.r} y2={zero} stroke="rgba(255,255,255,.3)" strokeDasharray="3 3" />
        <path d={cumLine} fill="none" stroke="#39c07c" strokeWidth="2.5" />
        <text x={pad.l - 6} y={pad.t + 4} textAnchor="end" fontSize="9" fill={AXIS}>{usd(maxRev, { compact: true })}</text>
        <text x={pad.l - 6} y={pad.t + ih + 3} textAnchor="end" fontSize="9" fill={AXIS}>0</text>
        <text x={w - pad.r} y={zero - 5} textAnchor="end" fontSize="9" fill="rgba(255,255,255,.4)">cumulative breakeven</text>
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 text-[11.5px]">
        <span className="flex items-center gap-1.5 text-white/45"><span className="h-2.5 w-4 rounded" style={{ background: "rgba(255,255,255,.22)" }} />doubling ramp (Q1–Q5)</span>
        <span className="flex items-center gap-1.5 text-white/45"><span className="h-2.5 w-4 rounded" style={{ background: color }} />+25% / quarter</span>
        <span className="flex items-center gap-1.5" style={{ color: "#39c07c" }}><svg width="18" height="3"><line x1="0" y1="1.5" x2="18" y2="1.5" stroke="#39c07c" strokeWidth="2.5" /></svg>cumulative EBITDA</span>
      </div>
    </div>
  );
}

/* ── year summary table ────────────────────────────────────────────────────── */
export function YearTable({ color = "#ff5b2e" }: { color?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>{["Year", "Royalty revenue", "Contribution @40%", "Platform opex", "EBITDA", "Margin"].map((h) => (
            <th key={h} className="border-b px-3 py-2 text-[10.5px] font-extrabold uppercase tracking-wider text-white/40" style={{ borderColor: "rgba(255,255,255,.12)" }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {YEARS.map((y) => (
            <tr key={y.year}>
              <td className="border-b px-3 py-2.5 text-[13px] font-bold text-white" style={{ borderColor: "rgba(255,255,255,.06)" }}>Year {y.year}</td>
              <td className="border-b px-3 py-2.5 font-mono text-[13px] text-white/80" style={{ borderColor: "rgba(255,255,255,.06)" }}>{usd(y.revenue, { compact: true })}</td>
              <td className="border-b px-3 py-2.5 font-mono text-[13px] text-white/55" style={{ borderColor: "rgba(255,255,255,.06)" }}>{usd(y.contribution, { compact: true })}</td>
              <td className="border-b px-3 py-2.5 font-mono text-[13px] text-white/55" style={{ borderColor: "rgba(255,255,255,.06)" }}>({usd(y.opex, { compact: true })})</td>
              <td className="border-b px-3 py-2.5 font-mono text-[13px] font-bold" style={{ borderColor: "rgba(255,255,255,.06)", color: y.ebitda >= 0 ? "#39c07c" : "#ff7a6b" }}>{usd(y.ebitda, { compact: true })}</td>
              <td className="border-b px-3 py-2.5 font-mono text-[13px]" style={{ borderColor: "rgba(255,255,255,.06)", color: y.margin >= 0 ? color : "rgba(255,255,255,.35)" }}>{(y.margin * 100).toFixed(0)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── exit ladder ───────────────────────────────────────────────────────────── */
export function ExitLadder({ color = "#ff5b2e" }: { color?: string }) {
  const vals = EXIT.revenueMultiples.map((m) => ({ m, v: EXIT.basisRevenue * m }));
  const max = Math.max(...vals.map((v) => v.v));
  return (
    <div className="space-y-2.5">
      {vals.map(({ m, v }) => (
        <div key={m}>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[12.5px] text-white/60">{m}× year-five revenue</span>
            <span className="font-mono text-[15px] font-extrabold text-white">{usd(v, { compact: true })}</span>
          </div>
          <div className="h-3 overflow-hidden rounded" style={{ background: "rgba(255,255,255,.05)" }}>
            <div className="h-full rounded" style={{ width: `${(v / max) * 100}%`, background: `linear-gradient(90deg, ${color}, #ff8a4b)` }} />
          </div>
        </div>
      ))}
      <div className="grid gap-2 pt-2 sm:grid-cols-3">
        {EXIT.ebitdaMultiples.map((m) => (
          <div key={m} className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,.1)" }}>
            <div className="text-[10.5px] uppercase tracking-wide text-white/35">{m}× EBITDA</div>
            <div className="font-mono text-[14px] font-bold text-white">{usd(EXIT.basisEbitda * m, { compact: true })}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── cap table ─────────────────────────────────────────────────────────────── */
export function CapTableChart({ color = "#ff5b2e" }: { color?: string }) {
  const cols = [{ k: "seed" as const, n: "Post-seed" }, { k: "a" as const, n: "Post-A" }, { k: "b" as const, n: "Post-B" }];
  const palette = [color, "#f5a623", "#2f9df4", "#8b6ef6", "rgba(255,255,255,.22)"];
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {cols.map((c) => (
          <div key={c.k}>
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-white/40">{c.n}</div>
            <div className="flex h-5 overflow-hidden rounded">
              {CAP_TABLE.map((r, i) => r[c.k] > 0 && (
                <div key={r.holder} style={{ width: `${r[c.k]}%`, background: palette[i] }} title={`${r.holder} — ${r[c.k]}%`} />
              ))}
            </div>
            <div className="mt-2 space-y-0.5">
              {CAP_TABLE.filter((r) => r[c.k] > 0).map((r, i) => (
                <div key={r.holder} className="flex items-center justify-between gap-2 text-[11.5px]">
                  <span className="flex items-center gap-1.5 text-white/55">
                    <span className="h-2 w-2 rounded-sm" style={{ background: palette[CAP_TABLE.indexOf(r)] }} />
                    {r.holder.replace(" (founder)", "")}
                  </span>
                  <span className="font-mono text-white/75">{r[c.k]}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11.5px] leading-relaxed text-white/35">
        Illustrative structure at the modelled round sizes. Actual dilution depends on terms,
        pool refresh and whether the platform contribution is valued as equity or as licence.
      </p>
    </div>
  );
}
