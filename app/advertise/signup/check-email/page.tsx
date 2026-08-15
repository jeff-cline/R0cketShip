import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check your inbox — r0cketship",
  description: "We sent a verification link. Open it to activate your advertiser account.",
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
  success: "#10B981",
};

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  const email = (e ?? "").trim();

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
            maxWidth: 560,
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
              color: COLORS.accent,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Almost there
          </div>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: COLORS.ink,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              marginBottom: 16,
            }}
          >
            Check your inbox.
          </h1>
          <p style={{ color: COLORS.ink2, fontSize: 16, lineHeight: 1.55, marginBottom: 24 }}>
            {email ? (
              <>
                We sent a verification link to{" "}
                <strong style={{ color: COLORS.ink }}>{email}</strong>.
              </>
            ) : (
              <>We sent a verification link to your inbox.</>
            )}{" "}
            Click it to activate your account and claim{" "}
            <strong style={{ color: COLORS.accent }}>$10 in free advertising credit</strong>.
          </p>
          <div
            style={{
              border: `1px solid ${COLORS.hairline}`,
              borderRadius: 12,
              padding: "16px 18px",
              textAlign: "left",
              color: COLORS.ink3,
              fontSize: 13,
              lineHeight: 1.55,
              marginBottom: 24,
            }}
          >
            <strong style={{ color: COLORS.ink }}>Didn&apos;t get it?</strong> Check spam, then wait a
            minute. The link expires in 24 hours. If it never arrives, contact support and we&apos;ll
            resend it.
          </div>
          <a
            href="/advertise"
            style={{
              display: "inline-block",
              border: `1px solid ${COLORS.hairline2}`,
              color: COLORS.ink2,
              fontWeight: 600,
              fontSize: 14,
              padding: "10px 20px",
              borderRadius: 999,
              textDecoration: "none",
            }}
          >
            ← Back to overview
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
