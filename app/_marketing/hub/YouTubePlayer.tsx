"use client";

import { useEffect, useRef } from "react";

// Thin wrapper around the YouTube IFrame Player API. We use the API (rather than a
// plain <iframe>) so we can (a) start playback with sound from the open gesture and
// (b) detect the ENDED state to trigger the hero's CTA finale. The API script is
// loaded once and shared across instances.

type YT = { Player: new (el: HTMLElement, opts: unknown) => unknown };
declare global {
  interface Window {
    YT?: YT & { PlayerState?: { ENDED: number } };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YT> | null = null;
/** Kick off loading the IFrame API early so a later open can start playback
 *  within the user's click gesture (needed for autoplay with sound). */
export function preloadYouTubeApi(): void {
  void loadYouTubeApi();
}
function loadYouTubeApi(): Promise<YT> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YT>((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiPromise;
}

export function YouTubePlayer({
  videoId,
  onEnded,
  className,
  style,
}: {
  videoId: string;
  onEnded?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<{ destroy?: () => void } | null>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  useEffect(() => {
    let destroyed = false;
    loadYouTubeApi().then((YT) => {
      if (destroyed || !hostRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      playerRef.current = new (YT.Player as any)(hostRef.current, {
        videoId,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1, controls: 1 },
        events: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onReady: (e: any) => {
            try {
              e.target.unMute();
              e.target.playVideo();
            } catch {
              /* noop */
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: (e: any) => {
            if (e.data === 0) onEndedRef.current?.(); // 0 = ENDED
          },
        },
      });
    });
    return () => {
      destroyed = true;
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* noop */
      }
    };
  }, [videoId]);

  return (
    <div className={className} style={style}>
      <div ref={hostRef} className="h-full w-full" />
    </div>
  );
}
