# Hub Hero Video — Design Spec

**Date:** 2026-07-14
**Surface:** r0cketship.com hub homepage (`HubLander`), the "The Future Is Now." hero.
**Goal:** Turn the hero into an interactive video experience — the marketing video sits behind the hero as its dark backdrop, and clicking the rocket or a play button opens an immersive full-window player with call-to-action buttons that rise to center when the video ends.

## User-facing behavior

### Resting state (before any click)
- The compressed video's **first frame is the dark hero backdrop** (dimmed for legibility). Everything else in the hero layers on top of it.
- The **rocket logo** stays at the top of the hero and becomes clickable.
- A **play button (▶)** sits directly **below the rocket logo**.
- The badge, `The Future Is Now.` headline, subtext, and the 3 CTA buttons render on top as they do today.
- The heavy video is **not** downloaded on load (`preload="metadata"`), so the page stays fast. The static poster image carries the visual.

### On click of the rocket logo OR the play button
1. The **rocket plays a loop-the-loop flourish** (~0.9s CSS animation). Skipped when `prefers-reduced-motion: reduce`.
2. An **immersive overlay** mounts: `position: fixed; inset: 0`, black backdrop, high z-index, background scroll locked.
3. The video **plays from the start with sound** (the click is the user gesture that permits audio autoplay).
4. The **3 CTA buttons dock small at the bottom** of the overlay and remain clickable throughout.
5. A **close ✕** button sits top-right. **Esc** also closes.

### When the video ends (`onEnded`)
- The CTA buttons **animate up to the vertical center and enlarge** — the "move to the middle so people can click them" finale.
- Close ✕ / Esc still returns to the normal page.

## Architecture

- **New client component:** `app/_marketing/hub/HubHero.tsx` (`"use client"`). Owns the hero markup (rocket, play button, badge, headline, subtext, CTAs) **and** the immersive overlay player. All hero content is static text, so no server data needs to cross the boundary.
- **Edit:** `app/_marketing/hub/HubLander.tsx` — replace the inline `<header>` hero (current lines ~66–92) with `<HubHero />`. Everything else on the page is unchanged. `HubLander` stays a server component rendering the client `HubHero` as a child.
- **Edit:** `app/globals.css` — add `@keyframes` for the rocket loop and the CTA rise, matching the existing animation conventions (`flame-text`, `marquee`, etc. already live here).

### State (local to HubHero)
- `open: boolean` — overlay mounted / playing.
- `ended: boolean` — video finished → CTAs move to center + enlarge.
- `looping: boolean` — rocket loop animation currently playing (drives the CSS class).

### CTA source of truth
The 3 CTAs (`Advertise with us` → `/advertise`, `Joint venture with us` → `/e-partnership`, `Quick-start with predictive data →` → `/niches`) are defined **once** as an array in `HubHero` and rendered in both the resting hero and the overlay, so styling/links never drift.

## Assets
- `public/hub-video.mp4` — web-optimized re-encode of the source. Committed to git (must stay < GitHub's 100MB per-file limit).
- `public/hub-video-poster.jpg` — the video's first frame, used as the `poster` and the resting-state backdrop.
- **Full-res master:** the original 144MB `predictive-data-marketing-jeff-cline-r0cketship.mp4` stays in `~/Downloads` untouched.

### Encoding note (constraint discovered during build)
The source is already 720p at ~2.9 Mbps (144MB / 6.5 min). macOS `avconvert` (the only no-install transcoder available) has **no custom-bitrate control** — its 720p preset re-encodes at ~the same bitrate (stayed 143MB), which is over GitHub's 100MB limit. Its only size lever is resolution, so the committed web version is encoded at **540p** to stay committable. 540p is sharp enough in the immersive player; the full-res 720p master is preserved. If crisper 720p is wanted on-site later, the path is ffmpeg (proper 720p at a lower target bitrate) or a CDN/object-store host outside git.

## Accessibility
- Play button has `aria-label`. Overlay uses `role="dialog"` + `aria-modal="true"`.
- Esc closes; focus moves into the overlay on open and returns to the trigger on close.
- Rocket loop and CTA-rise animations are disabled under `prefers-reduced-motion: reduce`.

## Verification
UI/interaction feature — verified by:
1. `next build` compiles clean.
2. Driving it in a real browser (Chrome): poster shows as backdrop → click rocket/play opens overlay → video plays with sound → rocket loops → CTAs docked and clickable → CTAs rise to center on video end → Esc/✕ closes and restores scroll.

There is little pure logic to unit-test; the value is in the observed interaction.

## Out of scope
- No changes to any white-label template or any non-hub page.
- No backend/CMS wiring — the video asset is a static file (hero copy still flows from `marketingContent` where it already did; the video itself is not CMS-editable in this pass).
