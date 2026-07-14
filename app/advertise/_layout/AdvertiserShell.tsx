"use client";
/**
 * AdvertiserShell — sidebar + top nav layout for all authenticated advertiser
 * pages. Renders as a client component so we can highlight the active nav link
 * via `usePathname`. Wallet balance and advertiser identity are passed in as
 * props from the server page that wraps this shell.
 */
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const COLORS = {
  bg: "#050608",
  surface: "rgba(255,255,255,0.025)",
  surface2: "rgba(255,255,255,0.04)",
  sidebar: "#0A0C10",
  ink: "#FFFFFF",
  ink2: "#E5E7EB",
  ink3: "#A1A1AA",
  ink4: "#6B7280",
  accent: "#FF6B35",
  accentDim: "rgba(255,107,53,0.16)",
  sky: "#0EA5E9",
  hairline: "rgba(255,255,255,0.08)",
  hairline2: "rgba(255,255,255,0.16)",
};

export interface AdvertiserShellProps {
  email: string;
  walletBalanceCents: number;
  children: ReactNode;
}

interface NavLink {
  href: string;
  label: string;
  icon: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/advertise/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/advertise/campaigns", label: "Campaigns", icon: "✈" },
  { href: "/advertise/billing", label: "Billing", icon: "$" },
  { href: "/advertise/referral", label: "Referral", icon: "↗" },
  { href: "/advertise/settings", label: "Settings", icon: "⚙" },
];

function formatUsd(cents: number): string {
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function AdvertiserShell({ email, walletBalanceCents, children }: AdvertiserShellProps) {
  const pathname = usePathname() ?? "";

  return (
    <div style={{ background: COLORS.bg, color: COLORS.ink, minHeight: "100vh" }}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className="hidden md:flex md:flex-col"
          style={{
            width: 220,
            background: COLORS.sidebar,
            borderRight: `1px solid ${COLORS.hairline}`,
            position: "sticky",
            top: 0,
            height: "100vh",
          }}
        >
          <div
            className="flex items-center gap-2 px-5 py-5"
            style={{ borderBottom: `1px solid ${COLORS.hairline}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/rocket.png"
              alt=""
              width={26}
              height={26}
              style={{ filter: `drop-shadow(0 2px 8px ${COLORS.accent}66)` }}
            />
            <span
              className="font-extrabold text-base"
              style={{ color: COLORS.ink, letterSpacing: "-0.02em" }}
            >
              r<span style={{ color: COLORS.accent }}>0</span>cketship
            </span>
          </div>
          <nav className="flex flex-col gap-1 px-3 py-4">
            {NAV_LINKS.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
                  style={{
                    background: active ? COLORS.accentDim : "transparent",
                    color: active ? COLORS.accent : COLORS.ink2,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      display: "inline-flex",
                      width: 18,
                      height: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      color: active ? COLORS.accent : COLORS.ink3,
                    }}
                  >
                    {link.icon}
                  </span>
                  {link.label}
                </a>
              );
            })}
          </nav>
          <div
            className="mt-auto px-5 py-4 text-xs"
            style={{ color: COLORS.ink4, borderTop: `1px solid ${COLORS.hairline}` }}
          >
            #ARTLAB · advertiser console
          </div>
        </aside>

        {/* Main column */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Top bar */}
          <header
            className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 py-3 backdrop-blur"
            style={{
              background: "rgba(5,6,8,0.78)",
              borderBottom: `1px solid ${COLORS.hairline}`,
            }}
          >
            <div
              className="truncate text-sm font-semibold"
              style={{ color: COLORS.ink2 }}
              title={email}
            >
              {email}
            </div>
            <div className="flex items-center justify-center">
              <span
                className="rounded-full px-4 py-1.5 text-sm font-bold"
                style={{
                  border: `1px solid ${COLORS.accent}`,
                  background: COLORS.accentDim,
                  color: COLORS.accent,
                  letterSpacing: "-0.01em",
                }}
                title="Wallet balance"
              >
                Wallet · {formatUsd(walletBalanceCents)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/advertise/logout"
                className="text-sm font-semibold"
                style={{ color: COLORS.ink3 }}
              >
                Logout
              </a>
            </div>
          </header>

          {/* Content area */}
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default AdvertiserShell;
