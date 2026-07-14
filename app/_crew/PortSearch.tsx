"use client";

import { useEffect, useState } from "react";
import { PORT_GROUPS } from "./ports";
import { nearestPort } from "./portData";

const ORANGE = "#ff5b2e";
const TEAL = "#0e9aa7";

// Search bar with IP-based auto port-switch: on load we look up the visitor's
// approximate location and, if they're within 50 miles of a known cruise port,
// auto-select it in the dropdown.
export function PortSearch() {
  const [port, setPort] = useState("San Juan, Puerto Rico");
  const [detected, setDetected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("https://ipwho.is/?fields=latitude,longitude,city,success");
        const d = await r.json();
        if (cancelled || !d?.success || typeof d.latitude !== "number") return;
        const near = nearestPort({ lat: d.latitude, lon: d.longitude }, 50);
        if (near) { setPort(near.name); setDetected(near.name); }
      } catch {
        // geolocation is best-effort; default stays selected
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const portCount = PORT_GROUPS.reduce((n, g) => n + g.ports.length, 0);

  return (
    <>
      <form action="#explore" className="mx-auto mt-7 flex max-w-2xl flex-col gap-2 rounded-2xl border bg-white p-2 shadow-sm sm:flex-row" style={{ borderColor: "#e6eaf1" }}>
        <input placeholder="Search food, beaches, excursions…" className="flex-1 rounded-xl px-4 py-3 text-sm outline-none" />
        <div className="flex items-center gap-2">
          <select value={port} onChange={(e) => { setPort(e.target.value); setDetected(null); }} className="max-w-[170px] rounded-xl border px-3 py-3 text-sm outline-none" style={{ borderColor: "#e6eaf1", color: "#2a3550" }}>
            {PORT_GROUPS.map((g) => (
              <optgroup key={g.region} label={g.region}>
                {g.ports.map((p) => <option key={p} value={p}>{p}</option>)}
              </optgroup>
            ))}
          </select>
          <button className="rounded-xl px-6 py-3 text-sm font-bold text-white" style={{ background: ORANGE }}>Search</button>
        </div>
      </form>
      <p className="mt-3 text-xs" style={{ color: "#8b97ad" }}>
        {detected
          ? <span style={{ color: TEAL }}>📍 Detected your port: <b>{detected.split(",")[0]}</b> — showing local perks.</span>
          : <>Every cruise port, worldwide — {portCount}+ destinations and growing.</>}
      </p>
    </>
  );
}
