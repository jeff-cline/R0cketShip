import type { Metadata } from "next";
import { COLORS } from "../advertise/_components/shared";
import { topOffers, type TrendingOffer } from "@/src/trending/selector";
import { OfferLogo } from "./OfferLogo";

export const metadata: Metadata = {
  title: "Trending Now — r0cketship",
  description:
    "Live offers across the r0cketship network, ranked by performance. Click anything that catches your eye.",
};

export const dynamic = "force-dynamic";

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

function OfferCard({ offer }: { offer: TrendingOffer }) {
  const blurb = truncate(offer.description, 140);
  return (
    <a
      href={`/c/trending/${offer.offerId}`}
      className="group flex flex-col rounded-2xl border p-6 transition"
      style={{
        borderColor: COLORS.hairline,
        background: COLORS.surface2,
        textDecoration: "none",
        color: COLORS.ink,
      }}
    >
      <div className="flex items-center gap-3">
        <OfferLogo url={offer.logoUrl} />
        <div className="flex flex-col">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: COLORS.accent }}
          >
            {titleCase(offer.tenantNiche)}
          </span>
          <span className="text-sm font-semibold" style={{ color: COLORS.ink2 }}>
            {offer.brand}
          </span>
        </div>
      </div>

      <h3
        className="mt-5 text-lg font-black leading-snug"
        style={{ color: COLORS.ink, letterSpacing: "-0.01em" }}
      >
        {offer.title}
      </h3>
      <p
        className="mt-2 text-sm leading-relaxed"
        style={{ color: COLORS.ink3, flexGrow: 1 }}
      >
        {blurb}
      </p>

      <div className="mt-6 flex items-center justify-between">
        <span
          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-bold"
          style={{
            background: COLORS.accent,
            color: COLORS.ink,
            boxShadow: `0 10px 24px ${COLORS.accent}33`,
          }}
        >
          Check it out &rarr;
        </span>
        <span className="text-xs" style={{ color: COLORS.ink4 }}>
          {offer.tenantDomain}
        </span>
      </div>
    </a>
  );
}

interface TrendingPageProps {
  searchParams?: Promise<{ niche?: string }>;
}

export default async function TrendingPage({ searchParams }: TrendingPageProps) {
  const sp = (await searchParams) ?? {};
  const rawNiche = typeof sp.niche === "string" ? sp.niche.trim() : "";
  const niche = rawNiche || undefined;

  const offers = await topOffers({ limit: 12, niche });

  return (
    <main
      style={{ background: COLORS.bg, color: COLORS.ink, minHeight: "100vh" }}
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
          href="https://r0cketship.com"
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
          <span
            className="hidden rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] md:inline-flex"
            style={{
              borderColor: COLORS.hairline2,
              color: COLORS.accent,
              background: `${COLORS.accent}14`,
            }}
          >
            Trending Now
          </span>
          <a
            href="/advertise"
            className="rounded-full px-4 py-2 text-sm font-bold"
            style={{ background: COLORS.accent, color: COLORS.ink }}
          >
            Advertise with us
          </a>
        </div>
      </nav>

      {/* HERO */}
      <header
        className="relative px-6 pb-16 pt-20 text-center"
        style={{
          background: `
            radial-gradient(ellipse 70% 60% at 100% 0%, rgba(255,107,53,0.22) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 0% 100%, rgba(124,58,237,0.18) 0%, transparent 60%),
            ${COLORS.bg}
          `,
        }}
      >
        <div className="mx-auto max-w-4xl">
          <div
            className="mb-4 text-xs font-bold uppercase tracking-[0.32em]"
            style={{ color: COLORS.accent }}
          >
            Live across the network
          </div>
          <h1
            className="text-5xl font-black leading-[1.02] tracking-tight md:text-7xl"
            style={{ letterSpacing: "-0.035em" }}
          >
            <span
              style={{
                color: "transparent",
                WebkitTextStroke: "1.5px #ffffff",
                textShadow: `0 0 24px ${COLORS.accent}99, 0 0 48px ${COLORS.accent}55`,
              }}
            >
              Trending
            </span>{" "}
            <span style={{ color: COLORS.accent }}>Now</span>.
          </h1>
          <p
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed md:text-xl"
            style={{ color: COLORS.ink2 }}
          >
            Live offers, ranked by performance.{" "}
            <span style={{ color: COLORS.ink, fontWeight: 700 }}>
              Click anything that catches your eye.
            </span>
          </p>

          {niche && (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold"
                style={{
                  borderColor: COLORS.hairline2,
                  background: COLORS.surface3,
                  color: COLORS.ink2,
                }}
              >
                Showing: {titleCase(niche)}
                <a
                  href="/trending"
                  style={{
                    color: COLORS.accent,
                    textDecoration: "none",
                    fontWeight: 800,
                  }}
                >
                  clear &times;
                </a>
              </span>
            </div>
          )}

          <div className="mt-10 flex justify-center gap-2">
            {[COLORS.accent, COLORS.sky, COLORS.success, COLORS.gold, COLORS.violet].map(
              (c, i) => (
                <span
                  key={i}
                  style={{ width: 36, height: 4, background: c, borderRadius: 2 }}
                />
              ),
            )}
          </div>
        </div>
      </header>

      {/* GRID */}
      <section className="px-6 py-16" style={{ background: COLORS.bg }}>
        <div className="mx-auto max-w-6xl">
          {offers.length === 0 ? (
            <div
              className="mx-auto max-w-2xl rounded-2xl border p-10 text-center"
              style={{
                borderColor: COLORS.hairline,
                background: COLORS.surface2,
              }}
            >
              <div
                className="mb-3 text-xs font-bold uppercase tracking-[0.32em]"
                style={{ color: COLORS.accent }}
              >
                Nothing here yet
              </div>
              <h2
                className="text-2xl font-black"
                style={{ letterSpacing: "-0.02em" }}
              >
                {niche
                  ? `No live offers in ${titleCase(niche)} right now.`
                  : "No live offers right now."}
              </h2>
              <p className="mt-3 text-base" style={{ color: COLORS.ink3 }}>
                Check back soon — fresh offers go live as the network grows.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {niche && (
                  <a
                    href="/trending"
                    className="rounded-full border px-5 py-2.5 text-sm font-semibold"
                    style={{
                      borderColor: COLORS.hairline2,
                      color: COLORS.ink2,
                    }}
                  >
                    Show everything
                  </a>
                )}
                <a
                  href="/advertise"
                  className="rounded-full px-5 py-2.5 text-sm font-bold"
                  style={{
                    background: COLORS.accent,
                    color: COLORS.ink,
                    boxShadow: `0 12px 32px ${COLORS.accent}40`,
                  }}
                >
                  Become an advertiser &rarr;
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {offers.map((o) => (
                <OfferCard key={o.offerId} offer={o} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CLOSING — same energy as /advertise */}
      <section
        className="px-6 py-20"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,107,53,0.18) 0%, transparent 70%),
            ${COLORS.bg}
          `,
        }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/rocket.png"
              alt=""
              width={56}
              height={56}
              style={{ filter: `drop-shadow(0 8px 28px ${COLORS.accent}80)` }}
            />
          </div>
          <h2
            className="text-3xl font-black leading-tight md:text-5xl"
            style={{ letterSpacing: "-0.02em" }}
          >
            Want your offer on this page?
          </h2>
          <p
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed md:text-lg"
            style={{ color: COLORS.ink2 }}
          >
            r0cketship runs our proprietary high intent network. Pay only for
            verified actions.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="/advertise/signup?offer=pay-for-success"
              className="rounded-full px-6 py-3 text-base font-bold"
              style={{
                background: COLORS.accent,
                color: COLORS.ink,
                boxShadow: `0 12px 32px ${COLORS.accent}40`,
              }}
            >
              Create an account &rarr;
            </a>
            <a
              href="/advertise"
              className="rounded-full border px-6 py-3 text-base font-semibold"
              style={{
                borderColor: COLORS.hairline2,
                color: COLORS.ink2,
              }}
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-12"
        style={{ background: "#000000", borderTop: `1px solid ${COLORS.hairline}` }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <a
              href="https://r0cketship.com"
              className="flex items-center gap-2 font-extrabold"
              style={{ color: COLORS.ink, letterSpacing: "-0.02em" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/rocket.png" alt="" width={20} height={20} />
              <span>
                r<span style={{ color: COLORS.accent }}>0</span>cketship
              </span>
            </a>
            <div
              className="flex flex-wrap gap-5 text-sm"
              style={{ color: COLORS.ink3 }}
            >
              <a href="https://r0cketship.com/about">About</a>
              <a href="https://r0cketship.com/how-it-works">How it works</a>
              <a href="https://r0cketship.com/pricing">Pricing</a>
              <a href="https://r0cketship.com/integrations">Integrations</a>
              <a href="https://r0cketship.com/niches">Niches</a>
              <a
                href="/advertise"
                style={{ color: COLORS.accent, fontWeight: 700 }}
              >
                Advertise with us
              </a>
            </div>
          </div>
          <div className="mt-8 text-xs" style={{ color: COLORS.ink4 }}>
            © {new Date().getFullYear()} r0cketship. Forward and upward only.
            #ARTLAB
          </div>
        </div>
      </footer>
    </main>
  );
}
