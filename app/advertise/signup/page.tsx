import type { Metadata } from "next";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Create your advertiser account — r0cketship",
  description:
    "Sign up to advertise across America's highest-intent inbox network. Pay only for success.",
};

const COLORS = {
  bg: "#050608",
  ink: "#FFFFFF",
  ink2: "#E5E7EB",
  ink3: "#A1A1AA",
  accent: "#FF6B35",
  hairline: "rgba(255,255,255,0.08)",
};

export default async function AdvertiserSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ offer?: string; ref?: string }>;
}) {
  const { offer, ref } = await searchParams;
  // Normalize incoming offer to one of the two known landing flavors. The action
  // does authoritative enum coercion — this is purely for header copy.
  const offerSlug = offer === "strategic-partner" ? "strategic-partner" : "pay-for-success";
  const refCode = (ref ?? "").trim();

  return (
    <main style={{ background: COLORS.bg, color: COLORS.ink, minHeight: "100vh" }}>
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
        <div className="flex items-center gap-3 text-sm" style={{ color: COLORS.ink3 }}>
          <a href="/advertise" className="hidden md:inline">
            ← Back to overview
          </a>
          <a
            href="/advertise/login"
            className="rounded-full border px-4 py-2 font-semibold"
            style={{ borderColor: COLORS.hairline, color: COLORS.ink2 }}
          >
            Sign in
          </a>
        </div>
      </nav>

      <section
        className="px-6 py-12 md:py-16"
        style={{
          background: `
            radial-gradient(ellipse 70% 60% at 100% 0%, rgba(255,107,53,0.18) 0%, transparent 60%),
            ${COLORS.bg}
          `,
        }}
      >
        <div className="mx-auto" style={{ maxWidth: 720 }}>
          <SignupForm offer={offerSlug} refCode={refCode} />
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
