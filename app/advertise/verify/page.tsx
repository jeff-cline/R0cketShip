import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifyAdvertiserEmail } from "@/src/auth/advertiser";

export const metadata: Metadata = {
  title: "Verify your email — r0cketship",
};

const COLORS = {
  bg: "#050608",
  surface: "rgba(255,255,255,0.025)",
  ink: "#FFFFFF",
  ink2: "#E5E7EB",
  ink3: "#A1A1AA",
  accent: "#FF6B35",
  hairline: "rgba(255,255,255,0.08)",
  hairline2: "rgba(255,255,255,0.16)",
  neg: "#F87171",
};

type FailureReason = "invalid" | "expired" | "already_verified" | "missing";

function reasonCopy(reason: FailureReason): { heading: string; body: string; cta: string; href: string } {
  switch (reason) {
    case "expired":
      return {
        heading: "This link has expired.",
        body: "Verification links are only valid for 24 hours. Sign in and request a new verification email.",
        cta: "Go to sign in",
        href: "/advertise/login",
      };
    case "already_verified":
      return {
        heading: "Already verified.",
        body: "This email has already been verified. You can sign in any time.",
        cta: "Sign in",
        href: "/advertise/login",
      };
    case "missing":
      return {
        heading: "Missing verification token.",
        body: "The verification link in your email is incomplete. Open it directly from your inbox, or contact support.",
        cta: "Back to overview",
        href: "/advertise",
      };
    case "invalid":
    default:
      return {
        heading: "We couldn't verify that link.",
        body: "The token is invalid or has already been used. If you're already verified, just sign in.",
        cta: "Sign in",
        href: "/advertise/login",
      };
  }
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const trimmed = (token ?? "").trim();

  if (!trimmed) {
    return renderFailure("missing");
  }

  const result = await verifyAdvertiserEmail(trimmed);
  if (result.ok) {
    // Success: hand off to login with a flag the page can render a banner from.
    redirect("/advertise/login?just_verified=1");
  }
  return renderFailure(result.reason);
}

function renderFailure(reason: FailureReason) {
  const copy = reasonCopy(reason);
  return (
    <main
      style={{
        background: COLORS.bg,
        color: COLORS.ink,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <nav
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur"
        style={{ background: "rgba(5,6,8,0.7)", borderBottom: `1px solid ${COLORS.hairline}` }}
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
      </nav>

      <section
        className="flex flex-1 items-center justify-center px-6 py-16"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,107,53,0.16) 0%, transparent 70%),
            ${COLORS.bg}
          `,
        }}
      >
        <div
          className="w-full"
          style={{
            maxWidth: 520,
            border: `1px solid ${COLORS.hairline2}`,
            background: COLORS.surface,
            borderRadius: 20,
            padding: 40,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.32em",
              color: reason === "already_verified" ? COLORS.accent : COLORS.neg,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {reason === "already_verified" ? "Heads up" : "We hit a snag"}
          </div>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 900,
              color: COLORS.ink,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            {copy.heading}
          </h1>
          <p style={{ color: COLORS.ink2, fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
            {copy.body}
          </p>
          <a
            href={copy.href}
            style={{
              display: "inline-block",
              background: COLORS.accent,
              color: COLORS.ink,
              fontWeight: 800,
              fontSize: 14,
              padding: "12px 22px",
              borderRadius: 999,
              textDecoration: "none",
              boxShadow: `0 12px 32px ${COLORS.accent}40`,
            }}
          >
            {copy.cta}
          </a>
        </div>
      </section>

      <footer className="px-6 py-10" style={{ background: "#000000", borderTop: `1px solid ${COLORS.hairline}` }}>
        <div className="mx-auto max-w-6xl text-xs" style={{ color: COLORS.ink3 }}>
          © {new Date().getFullYear()} r0cketship. Forward and upward only. #ARTLAB
        </div>
      </footer>
    </main>
  );
}
