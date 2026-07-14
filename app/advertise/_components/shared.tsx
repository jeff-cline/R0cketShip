import type { CSSProperties, ReactNode } from "react";

export const COLORS = {
  bg: "#050608",
  surface: "rgba(255,255,255,0.025)",
  surface2: "rgba(255,255,255,0.04)",
  surface3: "rgba(255,255,255,0.06)",
  ink: "#FFFFFF",
  ink2: "#E5E7EB",
  ink3: "#A1A1AA",
  ink4: "#6B7280",
  accent: "#FF6B35",
  accentBright: "#FF8651",
  sky: "#0EA5E9",
  violet: "#7C3AED",
  success: "#10B981",
  gold: "#FBBF24",
  rose: "#F43F5E",
  hairline: "rgba(255,255,255,0.08)",
  hairline2: "rgba(255,255,255,0.16)",
} as const;

/** Headline treatment used across /advertise and /trending: white outlined
 *  text with an orange glow. Makes the default-ink portion of a heading pop
 *  off the dark backdrop the same way the orange accent spans do. */
export function Outlined({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        color: "transparent",
        WebkitTextStroke: "1.5px #ffffff",
        textShadow: `0 0 24px ${COLORS.accent}99, 0 0 48px ${COLORS.accent}55`,
      }}
    >
      {children}
    </span>
  );
}

export function Eyebrow({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <div
      className="mb-4 text-xs font-bold uppercase tracking-[0.32em]"
      style={{ color: color ?? COLORS.accent }}
    >
      {children}
    </div>
  );
}

export function Cite({ n }: { n: number }) {
  return (
    <a
      href={`#src-${n}`}
      style={{
        color: COLORS.accent,
        fontSize: "0.7em",
        verticalAlign: "super",
        textDecoration: "none",
        marginLeft: 2,
        fontWeight: 700,
      }}
    >
      [{n}]
    </a>
  );
}

export function CheckIcon({ color }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, marginTop: 2 }}>
      <path
        d="M20 6L9 17l-5-5"
        stroke={color ?? COLORS.accent}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CrossIcon({ color }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, marginTop: 2 }}>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke={color ?? COLORS.rose}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Card({ children, style, className }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <div
      className={`rounded-xl border p-5 ${className ?? ""}`}
      style={{ borderColor: COLORS.hairline, background: COLORS.surface2, ...style }}
    >
      {children}
    </div>
  );
}
