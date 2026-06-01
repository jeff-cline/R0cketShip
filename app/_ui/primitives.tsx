import type { ReactNode } from "react";

// ---- Page chrome ----
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-extrabold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "", pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <div className={`card ${pad ? "p-5" : ""} ${className}`}>{children}</div>;
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{children}</h2>
      {hint && <span className="text-xs" style={{ color: "var(--muted-2)" }}>{hint}</span>}
    </div>
  );
}

// ---- Stat card: big-number-first with optional delta ----
export function StatCard({
  label, value, sub, delta, accent = false,
}: { label: string; value: string; sub?: string; delta?: { value: string; positive?: boolean }; accent?: boolean }) {
  return (
    <div className="card p-5" style={accent ? { borderColor: "color-mix(in srgb, var(--color-accent) 35%, var(--line))" } : undefined}>
      <div className="label">{label}</div>
      <div className="mt-2 flex items-end gap-2">
        <div className="text-[30px] font-extrabold leading-none tracking-tight" style={accent ? { color: "var(--color-accent)" } : undefined}>{value}</div>
        {delta && (
          <span className="mb-1 text-xs font-semibold" style={{ color: delta.positive === false ? "var(--neg)" : "var(--pos)" }}>
            {delta.positive === false ? "▼" : "▲"} {delta.value}
          </span>
        )}
      </div>
      {sub && <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{sub}</div>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "pos" | "neg" | "warn" | "accent" }) {
  const map: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: "var(--surface-3)", fg: "var(--ink-2)" },
    pos: { bg: "color-mix(in srgb, var(--pos) 14%, transparent)", fg: "var(--pos)" },
    neg: { bg: "color-mix(in srgb, var(--neg) 14%, transparent)", fg: "var(--neg)" },
    warn: { bg: "color-mix(in srgb, var(--warn) 16%, transparent)", fg: "var(--warn)" },
    accent: { bg: "color-mix(in srgb, var(--color-accent) 14%, transparent)", fg: "var(--color-accent)" },
  };
  const c = map[tone];
  return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: c.bg, color: c.fg }}>{children}</span>;
}

// ---- Form field ----
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="text-xs" style={{ color: "var(--muted-2)" }}>{hint}</span>}
    </label>
  );
}

// ---- Simple table ----
export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border" style={{ borderColor: "var(--line)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "var(--surface-2)" }}>
            {head.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="border-t" style={{ borderColor: "var(--line)" }}>{children}</tr>;
}
export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
