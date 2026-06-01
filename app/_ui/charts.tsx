// Dependency-free inline-SVG charts. Server-renderable.

function niceMax(v: number) {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

// Smooth area+line chart for a time series.
export function AreaChart({ data, height = 180, labels }: { data: number[]; height?: number; labels?: string[] }) {
  const w = 640;
  const h = height;
  const pad = { l: 8, r: 8, t: 14, b: 22 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const max = niceMax(Math.max(1, ...data));
  const n = Math.max(1, data.length - 1);
  const x = (i: number) => pad.l + (iw * i) / n;
  const y = (v: number) => pad.t + ih - (ih * v) / max;
  const pts = data.map((v, i) => [x(i), y(v)] as const);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${x(n).toFixed(1)} ${(pad.t + ih).toFixed(1)} L${pad.l.toFixed(1)} ${(pad.t + ih).toFixed(1)} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" role="img">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <line key={g} x1={pad.l} x2={w - pad.r} y1={pad.t + ih * g} y2={pad.t + ih * g} stroke="var(--line)" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#areaFill)" />
      <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="var(--color-accent)" />
      ))}
      {labels && labels.map((l, i) => (
        i % Math.ceil(labels.length / 6) === 0 ? (
          <text key={i} x={x(i)} y={h - 6} fontSize="10" fill="var(--muted-2)" textAnchor="middle">{l}</text>
        ) : null
      ))}
    </svg>
  );
}

// Horizontal bar chart (good for "sales by white-label").
export function BarChart({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  return (
    <div className="flex flex-col gap-3">
      {data.length === 0 && <div className="text-sm" style={{ color: "var(--muted-2)" }}>No data yet.</div>}
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-28 shrink-0 truncate text-sm font-medium" title={d.label}>{d.label}</div>
          <div className="h-3 flex-1 overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
            <div className="h-full rounded-full" style={{ width: `${Math.max(2, (d.value / max) * 100)}%`, background: d.color ?? "var(--color-accent)" }} />
          </div>
          <div className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">{d.value >= 1000 ? `$${(d.value / 1000).toFixed(1)}k` : `$${d.value.toFixed(0)}`}</div>
        </div>
      ))}
    </div>
  );
}

// Tiny inline sparkline.
export function Sparkline({ data, width = 90, height = 28 }: { data: number[]; width?: number; height?: number }) {
  const max = Math.max(1, ...data);
  const n = Math.max(1, data.length - 1);
  const pts = data.map((v, i) => `${(width * i) / n},${height - (height - 4) * (v / max) - 2}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
