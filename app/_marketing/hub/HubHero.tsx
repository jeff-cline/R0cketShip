"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { YouTubePlayer, preloadYouTubeApi } from "./YouTubePlayer";

// Interactive hero for the r0cketship.com hub. The marketing video's first
// frame is the dark backdrop; clicking the rocket or the play button loops the
// rocket, opens an immersive full-window player, and plays the video with sound.
// When the video ends, the CTA buttons rise to the center of the screen.
// HUB ONLY — rendered from HubLander, which only mounts on r0cketship.com.

const ACCENT = "#ff5b2e";
const POSTER_SRC = "/hub-video-poster.jpg";

// The hub's marketing film, hosted on YouTube. Used when the tenant hasn't set a
// custom heroVideo. heroVideo may hold a YouTube URL or an uploaded /uploads file.
const DEFAULT_FILM = "https://youtu.be/IDe0jhB00Jw";

/** Extract an 11-char YouTube video id from a watch/short/embed/youtu.be URL. */
function youTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

/** Canonical R0cketShip rocket-ship image. */
function RImg({ size = 16, className = "" }: { size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/rocket.png" width={size} height={size} alt="" aria-hidden className={`inline-block shrink-0 ${className}`} style={{ objectFit: "contain" }} />;
}

/** Wordmark with the zero rendered in the brand orange. */
function Brand({ className = "" }: { className?: string }) {
  return <span className={className}>R<span style={{ color: ACCENT }}>0</span>cketShip</span>;
}

// Single source of truth for the CTAs — reused in the resting hero and the
// overlay so links and styling never drift.
const CTAS: { href: string; label: string; primary?: boolean }[] = [
  { href: "/advertise", label: "Advertise with us", primary: true },
  { href: "/e-partnership", label: "Joint venture with us" },
  { href: "/niches", label: "Quick-start with predictive data →" },
];

function CtaButton({ cta, size = "base" }: { cta: (typeof CTAS)[number]; size?: "base" | "lg" }) {
  const pad = size === "lg" ? "px-8 py-4 text-lg" : "px-7 py-3.5";
  if (cta.primary) {
    return (
      <a href={cta.href} className={`rounded-full ${pad} font-bold text-white transition active:translate-y-px`} style={{ background: ACCENT, boxShadow: "0 10px 30px -8px rgba(255,91,46,.6)" }}>
        {cta.label}
      </a>
    );
  }
  return (
    <a href={cta.href} className={`rounded-full border ${pad} font-bold text-white transition hover:bg-white/5`} style={{ borderColor: "rgba(255,255,255,.28)", background: "rgba(0,0,0,.25)" }}>
      {cta.label}
    </a>
  );
}

export function HubHero({ videoSrc, posterSrc = POSTER_SRC }: { videoSrc?: string | null; posterSrc?: string }) {
  const [open, setOpen] = useState(false); // overlay mounted / playing
  const [shown, setShown] = useState(false); // drives the fade-to-black + video reveal
  const [ended, setEnded] = useState(false); // video finished → CTAs rise to center
  const [looping, setLooping] = useState(false); // hero rocket loop-the-loop
  const videoRef = useRef<HTMLVideoElement>(null);
  const src = videoSrc || DEFAULT_FILM;
  const ytId = youTubeId(src);
  const hasVideo = Boolean(src);
  const handleEnded = useCallback(() => setEnded(true), []);

  const openPlayer = useCallback(() => {
    if (open || !hasVideo) return;
    // Rocket loop-the-loop flourish (CSS handles reduced-motion).
    setLooping(true);
    window.setTimeout(() => setLooping(false), 950);
    setEnded(false);
    setOpen(true);
    // Start playback muted immediately (always allowed) inside the user gesture,
    // then unmute as the video reveals so audio is never blocked.
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.muted = true;
      void v.play().catch(() => {});
    }
  }, [open, hasVideo]);

  const closePlayer = useCallback(() => {
    const v = videoRef.current;
    if (v) v.pause();
    setOpen(false);
    setShown(false);
    setEnded(false);
  }, []);

  // Reveal transition + unmute shortly after opening; lock background scroll.
  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const reveal = window.setTimeout(() => setShown(true), 60);
    const unmute = window.setTimeout(() => {
      const v = videoRef.current;
      if (v) v.muted = false;
    }, 750);
    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(unmute);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Esc closes the overlay.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePlayer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closePlayer]);

  // Preload the YouTube API on mount so the player can start (with sound) inside
  // the click gesture rather than after an async script load.
  useEffect(() => {
    if (ytId) preloadYouTubeApi();
  }, [ytId]);

  return (
    <header className="relative overflow-hidden">
      {/* Video-poster backdrop — the dark "black background" the hero sits on. */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={posterSrc} alt="" aria-hidden className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 70% at 80% -8%, rgba(26,19,34,.55), rgba(6,8,13,.86) 60%), rgba(6,8,13,.7)" }} />
      </div>

      {/* Hero content — sits on top of the video backdrop. */}
      <div className="relative z-10 mx-auto max-w-5xl px-5 pb-16 pt-16 text-center sm:px-8 sm:pt-24">
        {/* Rocket — clickable only when a film is set (via Site branding upload) */}
        {hasVideo ? (
          <button
            type="button"
            onClick={openPlayer}
            aria-label="Play the R0cketShip film"
            className="group relative mx-auto mb-4 grid h-36 w-36 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(closest-side, color-mix(in srgb, #ff5b2e 55%, transparent), transparent)", filter: "blur(6px)" }} />
            <RImg size={104} className={`relative drop-shadow-[0_8px_30px_rgba(255,91,46,.5)] transition-transform group-hover:scale-105 ${looping ? "rocket-loop" : ""}`} />
          </button>
        ) : (
          <div className="relative mx-auto mb-9 grid h-36 w-36 place-items-center">
            <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(closest-side, color-mix(in srgb, #ff5b2e 55%, transparent), transparent)", filter: "blur(6px)" }} />
            <RImg size={104} className="relative drop-shadow-[0_8px_30px_rgba(255,91,46,.5)]" />
          </div>
        )}

        {/* Play button — directly under the rocket logo (only when a film is set) */}
        {hasVideo && (
          <button
            type="button"
            onClick={openPlayer}
            aria-label="Play video"
            className="mx-auto mb-8 flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:scale-105 active:translate-y-px"
            style={{ borderColor: "rgba(255,255,255,.3)", background: "rgba(0,0,0,.35)" }}
          >
            <span className="grid h-7 w-7 place-items-center rounded-full" style={{ background: ACCENT }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden><path d="M2 1.5v9l8-4.5-8-4.5z" fill="#0a0e17" /></svg>
            </span>
            Watch the film
          </button>
        )}

        <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold" style={{ background: "color-mix(in srgb, #ff5b2e 26%, transparent)" }}>
          🔥 The future of what business success looks like
        </div>

        <h1 className="font-serif-display flame-text mx-auto max-w-4xl text-6xl font-extrabold leading-[1.0] sm:text-8xl">
          The Future Is Now.
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
          <Brand className="font-semibold text-white" /> is a technology-powered, multi-service company platform built to <span className="font-semibold text-white">put people first</span> — leveraging proprietary technology, unique data, and people on fire. 🔥
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/55">
          We&apos;re not afraid of AI. We harness it — with the best and the brightest — to build the future we actually want.
        </p>

        <div className="mt-9 flex flex-col flex-wrap justify-center gap-3 sm:flex-row">
          {CTAS.map((c) => (
            <CtaButton key={c.href} cta={c} />
          ))}
        </div>
      </div>

      {/* ───────── Immersive full-window player ───────── */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="R0cketShip film"
          className="fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-700"
          style={{ background: "#000", opacity: shown ? 1 : 0 }}
        >
          {ytId ? (
            <YouTubePlayer
              videoId={ytId}
              onEnded={handleEnded}
              className="absolute inset-0 h-full w-full transition-opacity duration-700"
              style={{ opacity: shown ? 1 : 0 }}
            />
          ) : (
            <video
              ref={videoRef}
              src={src}
              poster={posterSrc}
              playsInline
              controls
              onEnded={handleEnded}
              className="absolute inset-0 h-full w-full object-contain transition-opacity duration-700"
              style={{ opacity: shown ? 1 : 0 }}
            />
          )}

          {/* When the film ends, cover the player (incl. YouTube's related-video
              end screen) with a dark layer so the CTA finale reads cleanly. */}
          {ended && <div className="absolute inset-0 z-[5]" style={{ background: "rgba(6,8,13,.92)" }} />}

          {/* Close */}
          <button
            type="button"
            onClick={closePlayer}
            aria-label="Close video"
            className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full text-white transition hover:scale-110"
            style={{ background: "rgba(0,0,0,.55)", border: "1px solid rgba(255,255,255,.25)" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden><path d="M4 4l10 10M14 4L4 14" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>

          {/* CTAs — docked at the bottom during playback, rise to center on end. */}
          <div
            className={`pointer-events-none absolute inset-x-0 z-10 flex flex-col items-center justify-center gap-4 px-5 transition-all duration-700 ease-out ${
              ended ? "top-1/2 -translate-y-1/2" : "bottom-24 translate-y-0"
            }`}
          >
            {ended && (
              <h2 className="font-serif-display flame-text pointer-events-none mb-2 max-w-3xl text-center text-4xl font-extrabold leading-tight sm:text-6xl">
                The Future Is Now.
              </h2>
            )}
            <div className={`pointer-events-auto flex flex-col flex-wrap items-center justify-center gap-3 sm:flex-row ${ended ? "scale-100" : "scale-90 opacity-90"}`}>
              {CTAS.map((c) => (
                <CtaButton key={c.href} cta={c} size={ended ? "lg" : "base"} />
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
