"use client";

import type { CSSProperties, ReactNode } from "react";

// Visual constants for the yellow legal pad.
export const PAGE_BG = "#111";              // dark desk behind the sheet
export const SHEET_YELLOW = "#fff44f";      // bright canary
export const RULE_BLUE = "#8fb2df";         // thin horizontal rules
export const MARGIN_RED = "#e2453f";        // double vertical margin line
export const LINE_H = 34;                   // px between rules
export const MARGIN_X = 66;                 // px — content starts right of the red line

export const PRIORITY_COLORS: Record<"high" | "medium" | "low", string> = {
  high: "#e11d1d",
  medium: "#e8a021",
  low: "#5b7a99",
};

// Bright-yellow sheet with blue horizontal rules and a double red left margin line.
const sheetBackground: CSSProperties["background"] = [
  // double red vertical margin line near the left
  `linear-gradient(to right, transparent ${MARGIN_X - 20}px, ${MARGIN_RED} ${MARGIN_X - 20}px, ${MARGIN_RED} ${MARGIN_X - 19}px, transparent ${MARGIN_X - 19}px, transparent ${MARGIN_X - 16}px, ${MARGIN_RED} ${MARGIN_X - 16}px, ${MARGIN_RED} ${MARGIN_X - 15}px, transparent ${MARGIN_X - 15}px)`,
  // blue horizontal rules
  `repeating-linear-gradient(to bottom, transparent 0, transparent ${LINE_H - 1}px, ${RULE_BLUE} ${LINE_H - 1}px, ${RULE_BLUE} ${LINE_H}px)`,
  SHEET_YELLOW,
].join(", ");

export function YellowSheet({ children, compact }: { children: ReactNode; compact?: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: compact ? 460 : 850,
        margin: "0 auto",
        minHeight: compact ? undefined : "min(1100px, 90vh)",
        background: sheetBackground,
        backgroundPosition: compact ? "0 54px" : "0 46px",
        borderRadius: 4,
        boxShadow: "0 24px 60px -18px rgba(0,0,0,.6), 0 2px 0 rgba(0,0,0,.15)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

export function Wordmark({ size = 17 }: { size?: number }) {
  return (
    <span style={{ fontWeight: 800, fontSize: size, letterSpacing: -0.3, color: "#fff" }}>
      R<span style={{ color: "#ff5b2e" }}>0</span>cketShip
    </span>
  );
}

// The black band across the top of the sheet.
export function BlackBand({ right, children }: { right?: ReactNode; children?: ReactNode }) {
  return (
    <div
      style={{
        background: "#141414",
        color: "#fff",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        borderBottom: "3px solid #000",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Wordmark />
        {children}
      </div>
      {right != null && (
        <div style={{ fontSize: 14, fontWeight: 700, color: "#ffe94d", whiteSpace: "nowrap" }}>{right}</div>
      )}
    </div>
  );
}
