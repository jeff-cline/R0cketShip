import { COLORS } from "./shared";

/**
 * Bar chart — ROI per $1 spent by channel.
 * All inline SVG. No libs.
 */
export function RoiBarChart() {
  const data = [
    { label: "Email (B2B)", value: 36, color: COLORS.accent, note: "$36 / $1" },
    { label: "SEO", value: 22, color: COLORS.sky, note: "$22 / $1" },
    { label: "Content", value: 17, color: COLORS.success, note: "$17 / $1" },
    { label: "Social", value: 12, color: COLORS.gold, note: "$12 / $1" },
    { label: "Paid search", value: 8, color: COLORS.violet, note: "$8 / $1" },
    { label: "Display", value: 5, color: COLORS.ink4, note: "$5 / $1" },
  ];
  const max = 40;
  const w = 720;
  const h = 280;
  const padLeft = 110;
  const padRight = 70;
  const padTop = 12;
  const padBottom = 12;
  const barH = (h - padTop - padBottom) / data.length - 6;
  const innerW = w - padLeft - padRight;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Average ROI per $1 spent by marketing channel" style={{ width: "100%", height: "auto", display: "block" }}>
      {/* gridlines */}
      {[10, 20, 30, 40].map((g) => {
        const x = padLeft + (innerW * g) / max;
        return (
          <g key={g}>
            <line x1={x} y1={padTop} x2={x} y2={h - padBottom} stroke={COLORS.hairline} />
            <text x={x} y={h - 1} fill={COLORS.ink4} fontSize="10" textAnchor="middle">${g}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const y = padTop + i * (barH + 6);
        const barW = (innerW * d.value) / max;
        return (
          <g key={d.label}>
            <text x={padLeft - 10} y={y + barH / 2 + 4} fill={COLORS.ink2} fontSize="12" textAnchor="end" fontWeight={600}>
              {d.label}
            </text>
            <rect x={padLeft} y={y} width={barW} height={barH} rx={3} fill={d.color} opacity={0.92} />
            <text x={padLeft + barW + 8} y={y + barH / 2 + 4} fill={COLORS.ink} fontSize="12" fontWeight={700}>
              {d.note}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Line chart — CPA decline over time as optimizer learns.
 */
export function CpaLearningChart() {
  const points = [
    { x: 0, y: 42 },
    { x: 1, y: 38 },
    { x: 2, y: 30 },
    { x: 3, y: 23 },
    { x: 4, y: 17 },
    { x: 5, y: 13 },
    { x: 6, y: 10 },
    { x: 7, y: 8 },
    { x: 8, y: 7 },
  ];
  const w = 720;
  const h = 260;
  const padL = 50;
  const padR = 24;
  const padT = 24;
  const padB = 40;
  const maxX = 8;
  const maxY = 50;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const toX = (x: number) => padL + (innerW * x) / maxX;
  const toY = (y: number) => padT + innerH - (innerH * y) / maxY;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.x)} ${toY(p.y)}`).join(" ");
  const areaPath = `${linePath} L ${toX(maxX)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Cost per action declines as the optimizer learns" style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="cpaGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={COLORS.accent} stopOpacity="0.6" />
          <stop offset="100%" stopColor={COLORS.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* y-axis labels */}
      {[0, 10, 20, 30, 40, 50].map((v) => (
        <g key={v}>
          <line x1={padL} y1={toY(v)} x2={w - padR} y2={toY(v)} stroke={COLORS.hairline} />
          <text x={padL - 8} y={toY(v) + 4} fill={COLORS.ink4} fontSize="10" textAnchor="end">${v}</text>
        </g>
      ))}
      {/* x-axis labels */}
      {points.map((p) => (
        <text key={p.x} x={toX(p.x)} y={h - 22} fill={COLORS.ink4} fontSize="10" textAnchor="middle">
          W{p.x + 1}
        </text>
      ))}
      <text x={(w) / 2} y={h - 6} fill={COLORS.ink3} fontSize="11" textAnchor="middle">Weeks of campaign learning</text>
      <path d={areaPath} fill="url(#cpaGrad)" />
      <path d={linePath} stroke={COLORS.accent} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p) => (
        <circle key={p.x} cx={toX(p.x)} cy={toY(p.y)} r="3.4" fill={COLORS.bg} stroke={COLORS.accent} strokeWidth="2" />
      ))}
      {/* callout */}
      <g>
        <line x1={toX(0)} y1={toY(42) - 6} x2={toX(0) + 110} y2={toY(42) - 32} stroke={COLORS.ink4} strokeDasharray="2,3" />
        <text x={toX(0) + 116} y={toY(42) - 30} fill={COLORS.ink2} fontSize="11" fontWeight={700}>Cold start CPA</text>
        <line x1={toX(8)} y1={toY(7) + 6} x2={toX(8) - 110} y2={toY(7) + 30} stroke={COLORS.ink4} strokeDasharray="2,3" />
        <text x={toX(8) - 116} y={toY(7) + 32} fill={COLORS.success} fontSize="11" fontWeight={700} textAnchor="end">-83% after 8 weeks</text>
      </g>
    </svg>
  );
}

/**
 * Donut — wasted ad spend breakdown.
 */
export function WasteDonut() {
  const segments = [
    { label: "Invalid traffic / bots", value: 22, color: COLORS.rose },
    { label: "Non-viewable impressions", value: 34, color: COLORS.gold },
    { label: "Off-target audience", value: 18, color: COLORS.violet },
    { label: "Attribution gaps", value: 14, color: COLORS.sky },
    { label: "Actual conversions", value: 12, color: COLORS.success },
  ];
  const total = segments.reduce((s, x) => s + x.value, 0);
  const cx = 130;
  const cy = 130;
  const r = 100;
  const innerR = 64;
  let acc = 0;

  function arc(start: number, end: number) {
    const a0 = (start / total) * Math.PI * 2 - Math.PI / 2;
    const a1 = (end / total) * Math.PI * 2 - Math.PI / 2;
    const large = end - start > total / 2 ? 1 : 0;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const x2 = cx + innerR * Math.cos(a1);
    const y2 = cy + innerR * Math.sin(a1);
    const x3 = cx + innerR * Math.cos(a0);
    const y3 = cy + innerR * Math.sin(a0);
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${innerR} ${innerR} 0 ${large} 0 ${x3} ${y3} Z`;
  }

  return (
    <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
      <svg viewBox="0 0 260 260" role="img" aria-label="Breakdown of where legacy ad budgets go" style={{ width: 220, height: 220, flexShrink: 0 }}>
        {segments.map((s) => {
          const start = acc;
          acc += s.value;
          return <path key={s.label} d={arc(start, acc)} fill={s.color} opacity={0.92} />;
        })}
        <text x={cx} y={cy - 4} fill={COLORS.ink} fontSize="22" fontWeight={800} textAnchor="middle">88%</text>
        <text x={cx} y={cy + 16} fill={COLORS.ink3} fontSize="10" textAnchor="middle">waste / leakage</text>
      </svg>
      <ul className="space-y-2 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-3">
            <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color, display: "inline-block" }} />
            <span style={{ color: COLORS.ink2, fontWeight: 600, minWidth: 36 }}>{s.value}%</span>
            <span style={{ color: COLORS.ink3 }}>{s.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Funnel — lead → email → click → action with conversion %s.
 */
export function ConversionFunnel() {
  const stages = [
    { label: "Targeted prospects", count: "100,000", pct: 100, color: COLORS.sky },
    { label: "Emails opened", count: "47,000", pct: 47, color: COLORS.violet },
    { label: "Clicks generated", count: "4,200", pct: 4.2, color: COLORS.gold },
    { label: "Qualified actions", count: "640", pct: 0.64, color: COLORS.accent },
    { label: "Closed-won", count: "112", pct: 0.112, color: COLORS.success },
  ];
  return (
    <div className="space-y-3">
      {stages.map((s, i) => {
        const width = `${Math.max(s.pct, 6)}%`;
        return (
          <div key={s.label} className="grid grid-cols-12 items-center gap-3">
            <div className="col-span-5 md:col-span-3 text-sm font-semibold" style={{ color: COLORS.ink2 }}>
              {s.label}
            </div>
            <div className="col-span-4 md:col-span-7">
              <div className="h-9 rounded-md overflow-hidden" style={{ background: COLORS.surface3 }}>
                <div
                  className="h-full flex items-center justify-end pr-3 text-xs font-bold"
                  style={{
                    width,
                    background: `linear-gradient(90deg, ${s.color}33, ${s.color})`,
                    color: COLORS.ink,
                    minWidth: 90,
                  }}
                >
                  {s.count}
                </div>
              </div>
            </div>
            <div className="col-span-3 md:col-span-2 text-right text-xs" style={{ color: COLORS.ink3 }}>
              {i === 0 ? "baseline" : `${s.pct}% of top`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * CPL bar comparison — Email vs LinkedIn vs Google
 */
export function CplComparison() {
  const data = [
    { label: "r0cketship target", value: 5, color: COLORS.accent, note: "$5 min CPA" },
    { label: "Cold email (industry avg)", value: 53, color: COLORS.sky, note: "$53 CPL" },
    { label: "Google Search (B2B)", value: 70, color: COLORS.gold, note: "$70 CPL" },
    { label: "LinkedIn Ads (B2B)", value: 110, color: COLORS.violet, note: "$110 CPL" },
    { label: "Enterprise C-suite", value: 250, color: COLORS.rose, note: "$250 CPL" },
  ];
  const max = 280;
  const w = 720;
  const h = 240;
  const padLeft = 180;
  const padRight = 90;
  const padTop = 8;
  const padBottom = 8;
  const innerW = w - padLeft - padRight;
  const barH = (h - padTop - padBottom) / data.length - 6;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Cost per lead by channel" style={{ width: "100%", height: "auto", display: "block" }}>
      {data.map((d, i) => {
        const y = padTop + i * (barH + 6);
        const barW = Math.max((innerW * d.value) / max, 6);
        return (
          <g key={d.label}>
            <text x={padLeft - 10} y={y + barH / 2 + 4} fill={COLORS.ink2} fontSize="12" textAnchor="end" fontWeight={600}>
              {d.label}
            </text>
            <rect x={padLeft} y={y} width={barW} height={barH} rx={3} fill={d.color} opacity={0.92} />
            <text x={padLeft + barW + 8} y={y + barH / 2 + 4} fill={COLORS.ink} fontSize="12" fontWeight={700}>
              {d.note}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
