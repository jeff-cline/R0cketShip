"use client";

import type { Viz, VizDatum } from "./types";

const ACCENT = "#ff5b2e";
const PALETTE = ["#ff5b2e", "#ffa46b", "#38bdf8", "#f5c451", "#34d399", "#a78bfa"];

function colorAt(d: VizDatum, i: number): string {
  return d.color ?? PALETTE[i % PALETTE.length];
}

/** Horizontal bars — good for comparisons (e.g., tax rates). */
function Bars({ data }: { data: VizDatum[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-28 shrink-0 text-right text-xs font-semibold text-white/65 sm:w-48 sm:text-sm">{d.label}</div>
          <div className="h-7 flex-1 overflow-hidden rounded-md" style={{ background: "rgba(255,255,255,.06)" }}>
            <div
              className="flex h-full items-center justify-end rounded-md px-2"
              style={{ width: `${Math.max((d.value / max) * 100, 9)}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${colorAt(d, i)} 50%, transparent), ${colorAt(d, i)})` }}
            >
              <span className="whitespace-nowrap text-xs font-bold text-white">{d.display}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Funnel — narrowing centered bars for a capture / conversion story. */
function Funnel({ data }: { data: VizDatum[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col items-center gap-1.5">
      {data.map((d, i) => {
        const w = Math.max((d.value / max) * 100, 22);
        return (
          <div key={i} className="flex w-full flex-col items-center">
            <div
              className="flex h-12 items-center justify-center rounded-lg px-3 text-center transition-all"
              style={{ width: `${w}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${colorAt(d, i)} 40%, transparent), ${colorAt(d, i)}, color-mix(in srgb, ${colorAt(d, i)} 40%, transparent))` }}
            >
              <div className="leading-tight">
                <div className="text-sm font-extrabold text-white sm:text-base">{d.display}</div>
                <div className="text-[10px] font-semibold text-white/80 sm:text-xs">{d.label}</div>
              </div>
            </div>
            {i < data.length - 1 && (
              <div className="my-0.5 text-white/25" style={{ fontSize: 10 }}>▼</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Donut — revenue/share mix. SVG ring + legend. */
function Donut({ data }: { data: VizDatum[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 54;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="18" />
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = `${frac * C} ${C}`;
          const offset = -acc * C;
          acc += frac;
          return (
            <circle
              key={i}
              cx="70" cy="70" r={r} fill="none"
              stroke={colorAt(d, i)} strokeWidth="18"
              strokeDasharray={dash} strokeDashoffset={offset}
              transform="rotate(-90 70 70)"
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: colorAt(d, i) }} />
            <span className="text-sm font-semibold text-white">{d.display}</span>
            <span className="text-sm text-white/60">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VizChart({ viz }: { viz: Viz }) {
  return (
    <div className="mt-5 rounded-2xl border p-4 sm:p-5" style={{ borderColor: "rgba(255,255,255,.10)", background: "rgba(255,255,255,.02)" }}>
      {viz.kind === "bars" && <Bars data={viz.data} />}
      {viz.kind === "funnel" && <Funnel data={viz.data} />}
      {viz.kind === "donut" && <Donut data={viz.data} />}
      {viz.note && <p className="mt-3 text-xs leading-relaxed text-white/55">{viz.note}</p>}
      {viz.source && <p className="mt-1.5 text-[10px] uppercase tracking-wide text-white/35">Source: {viz.source}</p>}
    </div>
  );
}

export { ACCENT };
