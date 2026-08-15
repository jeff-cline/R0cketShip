"use client";

import { useEffect, useMemo, useState } from "react";

// Lightweight port map — no map library. Plots merchant dots by lat/lon within a
// padded bounding box, click a dot to open the profile, and shows "you are here"
// from the visitor's approximate location.
const ORANGE = "#ff5b2e";
const TEAL = "#0e9aa7";

type Pin = { name: string; slug: string; lat: number; lon: number; perk: string | null };

export function MerchantMap({ pins, port }: { pins: Pin[]; port: string }) {
  const [me, setMe] = useState<{ lat: number; lon: number } | null>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("https://ipwho.is/?fields=latitude,longitude,success")
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d?.success) setMe({ lat: d.latitude, lon: d.longitude }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const box = useMemo(() => {
    const lats = pins.map((p) => p.lat);
    const lons = pins.map((p) => p.lon);
    const pad = 0.012;
    return { minLat: Math.min(...lats) - pad, maxLat: Math.max(...lats) + pad, minLon: Math.min(...lons) - pad, maxLon: Math.max(...lons) + pad };
  }, [pins]);

  const pos = (lat: number, lon: number) => ({
    left: `${((lon - box.minLon) / (box.maxLon - box.minLon)) * 100}%`,
    top: `${(1 - (lat - box.minLat) / (box.maxLat - box.minLat)) * 100}%`,
  });

  const meInBox = me && me.lat >= box.minLat && me.lat <= box.maxLat && me.lon >= box.minLon && me.lon <= box.maxLon;

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border" style={{ borderColor: "#e6eaf1", background: "linear-gradient(160deg,#dff3f6,#eaf6f7)" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 30% 10%, #e8f7fa, #d4ecf2)", backgroundImage: "linear-gradient(rgba(14,154,167,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(14,154,167,.08) 1px,transparent 1px)", backgroundSize: "34px 34px" }} />
      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold shadow-sm" style={{ color: TEAL }}>📍 {port.split(",")[0]}</div>

      {pins.map((p) => (
        <a key={p.slug} href={`/m/${p.slug}`} onMouseEnter={() => setActive(p.slug)} onMouseLeave={() => setActive(null)} className="absolute -translate-x-1/2 -translate-y-full" style={pos(p.lat, p.lon)}>
          <div className="grid place-items-center">
            <div className="grid h-7 w-7 place-items-center rounded-full text-white shadow-md transition hover:scale-110" style={{ background: ORANGE }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/rocket.png" width={15} height={15} alt="" style={{ objectFit: "contain" }} />
            </div>
            <div className="h-2 w-2 -translate-y-1 rotate-45" style={{ background: ORANGE }} />
          </div>
          {active === p.slug && (
            <div className="absolute bottom-full left-1/2 z-10 mb-1 w-44 -translate-x-1/2 rounded-lg bg-white p-2 text-left shadow-lg">
              <div className="text-xs font-bold" style={{ color: "#0a0e17" }}>{p.name}</div>
              {p.perk && <div className="text-[11px]" style={{ color: ORANGE }}>🎁 {p.perk}</div>}
            </div>
          )}
        </a>
      ))}

      {meInBox && (
        <div className="absolute -translate-x-1/2 -translate-y-1/2" style={pos(me!.lat, me!.lon)}>
          <div className="h-4 w-4 rounded-full border-2 border-white shadow" style={{ background: TEAL }} />
          <div className="absolute inset-0 animate-ping rounded-full" style={{ background: TEAL, opacity: 0.4 }} />
        </div>
      )}
      <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold shadow-sm" style={{ color: "#61708a" }}>
        {meInBox ? "Blue dot = you" : "Tap a 🚀 for the perk"}
      </div>
    </div>
  );
}
