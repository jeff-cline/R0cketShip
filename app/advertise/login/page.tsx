import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdvertiserContext } from "@/src/auth/advertiser";
import { loginAdvertiserAction } from "./actions";

export const metadata: Metadata = {
  title: "Log in — Advertise with r0cketship",
  description: "Log in to your r0cketship advertiser portal.",
};

const COLORS = {
  bg: "#050608",
  surface: "rgba(255,255,255,0.025)",
  surface2: "rgba(255,255,255,0.04)",
  ink: "#FFFFFF",
  ink2: "#E5E7EB",
  ink3: "#A1A1AA",
  ink4: "#6B7280",
  accent: "#FF6B35",
  accentBright: "#FF8651",
  sky: "#0EA5E9",
  success: "#10B981",
  rose: "#F43F5E",
  hairline: "rgba(255,255,255,0.08)",
  hairline2: "rgba(255,255,255,0.16)",
};

function describeError(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "invalid_credentials":
      return "Invalid email or password.";
    case "unverified":
      return "Please verify your email before logging in. Check your inbox for the verification link.";
    case "suspended":
      return "This account is suspended. Contact support for help.";
    default:
      return "Could not log you in. Please try again.";
  }
}

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdvertiserLoginPage({ searchParams }: LoginPageProps) {
  // If already signed in, bounce to dashboard.
  const ctx = await getAdvertiserContext();
  if (ctx) {
    redirect("/advertise/dashboard");
  }

  const sp = await searchParams;
  const errorRaw = sp.error;
  const error = Array.isArray(errorRaw) ? errorRaw[0] : errorRaw;
  const justVerifiedRaw = sp.just_verified;
  const justVerified =
    (Array.isArray(justVerifiedRaw) ? justVerifiedRaw[0] : justVerifiedRaw) === "1";

  const errorMessage = describeError(error);

  return (
    <main
      style={{
        background: COLORS.bg,
        color: COLORS.ink,
        minHeight: "100vh",
      }}
    >
      {/* Top nav */}
      <nav
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur"
        style={{
          background: "rgba(5,6,8,0.7)",
          borderBottom: `1px solid ${COLORS.hairline}`,
        }}
      >
        <a
          href="/advertise"
          className="flex items-center gap-2 font-extrabold text-lg"
          style={{ color: COLORS.ink, letterSpacing: "-0.02em" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/rocket.png"
            alt=""
            width={26}
            height={26}
            style={{ filter: `drop-shadow(0 2px 8px ${COLORS.accent}66)` }}
          />
          <span>
            r<span style={{ color: COLORS.accent }}>0</span>cketship
          </span>
        </a>
        <div className="flex items-center gap-3">
          <a
            href="/advertise/signup?offer=pay-for-success"
            className="rounded-full px-4 py-2 text-sm font-bold"
            style={{ background: COLORS.accent, color: COLORS.ink }}
          >
            Create an account
          </a>
        </div>
      </nav>

      {/* Centered form */}
      <section
        className="flex items-center justify-center px-6 py-16 md:py-24"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 100% 0%, rgba(255,107,53,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 0% 100%, rgba(14,165,233,0.12) 0%, transparent 60%),
            ${COLORS.bg}
          `,
        }}
      >
        <div
          className="w-full max-w-md rounded-2xl border p-8"
          style={{
            borderColor: COLORS.hairline2,
            background: `linear-gradient(180deg, ${COLORS.surface}, ${COLORS.bg})`,
            boxShadow: `0 24px 64px rgba(255,107,53,0.08)`,
          }}
        >
          <div
            className="mb-1 text-xs font-bold uppercase tracking-[0.32em]"
            style={{ color: COLORS.accent }}
          >
            Advertiser portal
          </div>
          <h1
            className="text-3xl font-black leading-tight md:text-4xl"
            style={{ letterSpacing: "-0.025em" }}
          >
            Log in.
          </h1>
          <p className="mt-2 text-sm" style={{ color: COLORS.ink3 }}>
            Welcome back. Pick up where you left off.
          </p>

          {justVerified && (
            <div
              role="status"
              className="mt-6 rounded-lg border px-4 py-3 text-sm"
              style={{
                borderColor: `${COLORS.success}66`,
                background: `${COLORS.success}1a`,
                color: COLORS.ink,
              }}
            >
              <strong style={{ color: COLORS.success }}>Email verified.</strong>{" "}
              Log in to claim your <strong>$10 credit</strong>.
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="mt-6 rounded-lg border px-4 py-3 text-sm"
              style={{
                borderColor: `${COLORS.rose}66`,
                background: `${COLORS.rose}1a`,
                color: COLORS.ink2,
              }}
            >
              {errorMessage}
            </div>
          )}

          <form action={loginAdvertiserAction} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span
                className="text-xs font-bold uppercase tracking-[0.18em]"
                style={{ color: COLORS.ink3 }}
              >
                Email
              </span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="rounded-lg px-4 py-3 text-base outline-none"
                style={{
                  background: COLORS.surface2,
                  border: `1px solid ${COLORS.hairline2}`,
                  color: COLORS.ink,
                }}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span
                className="text-xs font-bold uppercase tracking-[0.18em]"
                style={{ color: COLORS.ink3 }}
              >
                Password
              </span>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="rounded-lg px-4 py-3 text-base outline-none"
                style={{
                  background: COLORS.surface2,
                  border: `1px solid ${COLORS.hairline2}`,
                  color: COLORS.ink,
                }}
              />
            </label>

            <div className="flex items-center justify-end">
              <a
                href="#"
                className="text-xs font-semibold"
                style={{ color: COLORS.ink3 }}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex w-full justify-center rounded-full px-6 py-3.5 text-base font-bold"
              style={{
                background: COLORS.accent,
                color: COLORS.ink,
                boxShadow: `0 12px 32px ${COLORS.accent}40`,
              }}
            >
              Log in →
            </button>
          </form>

          <div
            className="mt-6 flex flex-col gap-2 border-t pt-6 text-center text-sm"
            style={{ borderColor: COLORS.hairline, color: COLORS.ink3 }}
          >
            <div>
              New here?{" "}
              <a
                href="/advertise/signup?offer=pay-for-success"
                className="font-semibold"
                style={{ color: COLORS.accent }}
              >
                Create an account
              </a>
            </div>
            <div>
              <a href="/advertise" style={{ color: COLORS.ink4 }}>
                ← Back to marketing page
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
