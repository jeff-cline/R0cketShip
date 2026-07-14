"use client";

import { useState } from "react";
import { COLORS } from "../advertise/_components/shared";

/** Logo for an offer card on /trending. Tries the offer's `logoUrl` first; on
 *  load error (404, blocked, mixed-content, etc.) falls back to the brand
 *  rocket. When no URL is provided up-front we render the rocket directly. */
export function OfferLogo({ url }: { url: string | null | undefined }) {
  const [broken, setBroken] = useState(false);
  const showRocket = !url || broken;

  if (showRocket) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${COLORS.accent}33, ${COLORS.violet}33)`,
          border: `1px solid ${COLORS.hairline2}`,
        }}
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/rocket.png"
          alt=""
          width={26}
          height={26}
          style={{ filter: `drop-shadow(0 2px 6px ${COLORS.accent}66)` }}
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url!}
      alt=""
      width={44}
      height={44}
      onError={() => setBroken(true)}
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        objectFit: "cover",
        background: COLORS.surface3,
        border: `1px solid ${COLORS.hairline}`,
      }}
    />
  );
}
