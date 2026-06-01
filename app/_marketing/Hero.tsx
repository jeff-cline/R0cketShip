import type { MarketingContent } from "@/src/marketing/content";

/**
 * Full-bleed hero used by every white-label landing page. Background is a
 * looping muted video, else a static image, else a themed gradient — so every
 * site has a fleshed-out hero even before the owner uploads media. A dark
 * overlay + a frosted text card keep the headline legible over any media.
 * Mobile-first: fluid min-height and responsive type.
 */
export function Hero({ content, variant = "bold" }: { content: MarketingContent; variant?: "bold" | "trust" | "dark" }) {
  const hasMedia = Boolean(content.heroVideo || content.heroImage);
  return (
    <header className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        {content.heroVideo ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={content.heroImage ?? undefined}
            className="h-full w-full object-cover"
          >
            <source src={content.heroVideo} type="video/mp4" />
          </video>
        ) : content.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={content.heroImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: "radial-gradient(120% 100% at 78% 0, color-mix(in srgb, var(--color-primary) 88%, #000), #090c13)" }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: hasMedia
              ? "linear-gradient(180deg, rgba(8,12,20,.50) 0%, rgba(8,12,20,.74) 100%)"
              : "linear-gradient(180deg, rgba(8,12,20,.28) 0%, rgba(8,12,20,.55) 100%)",
          }}
        />
      </div>

      <div className="mx-auto flex min-h-[66vh] max-w-3xl flex-col items-center justify-center px-5 py-16 text-center sm:px-6 md:min-h-[76vh] md:py-24">
        <div
          className="w-full rounded-3xl px-6 py-8 sm:px-10 sm:py-11"
          style={{ background: "rgba(8,12,20,.44)", backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)", border: "1px solid rgba(255,255,255,.10)" }}
        >
          <div
            className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold"
            style={{ background: "color-mix(in srgb, var(--color-accent) 28%, transparent)", color: "#fff" }}
          >
            ⚡ Predictive intent · live in your ZIP
          </div>
          <h1
            className={`hero-h1 mx-auto mt-5 max-w-2xl text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl ${variant === "trust" ? "font-serif-display" : ""}`}
          >
            {content.headline}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/80 sm:text-lg">{content.subhead}</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="/signup"
              className="rounded-full px-7 py-3.5 font-bold text-white"
              style={{ background: "var(--color-accent)", boxShadow: "var(--shadow-md)" }}
            >
              Start free — $50 in leads →
            </a>
            <a
              href="/how-it-works"
              className="rounded-full border px-6 py-3.5 font-semibold text-white"
              style={{ borderColor: "rgba(255,255,255,.32)" }}
            >
              See how it works
            </a>
          </div>
          <div className="mt-4 text-sm text-white/60">No card required · 3 free leads to test the system</div>
        </div>
      </div>
    </header>
  );
}
