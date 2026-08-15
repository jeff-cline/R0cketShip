"use client";

import { useEffect, useState } from "react";

const ORANGE = "#ff5b2e";
const TEAL = "#0e9aa7";

// Crew gamification: a crew member's personal share QR. Cruisers who scan it land
// on the cruise.plus port page with their ref code; each signup earns the crew
// member points. Powered by the pass created in "Show my pass".
export function CrewShare({ shareBase = "https://cruise.plus/San-Juan-Puerto-Rico" }: { shareBase?: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let c = "";
    try { c = localStorage.getItem("crewperk_pass") || ""; } catch {}
    if (!c) return;
    setCode(c);
    fetch("/api/crew/me", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ passCode: c }) })
      .then((r) => r.json()).then((d) => { if (d.found) setPoints(d.points); }).catch(() => {});
  }, []);

  const link = code ? `${shareBase}?ref=${encodeURIComponent(code)}` : shareBase;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(link)}`;
  const copy = () => { navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {}); };

  return (
    <section className="px-5 py-14 sm:px-8" style={{ background: "linear-gradient(180deg,#fff,#f3fbfc)" }}>
      <div className="mx-auto grid max-w-5xl items-center gap-8 rounded-3xl border bg-white p-7 shadow-sm lg:grid-cols-2" style={{ borderColor: "#e6eaf1" }}>
        <div>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold" style={{ background: "#fff1ec", color: ORANGE }}>🚀 Crew rewards</div>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight" style={{ color: "#0a0e17" }}>Bring cruisers aboard. Earn points.</h2>
          <p className="mt-2 text-base" style={{ color: "#61708a" }}>
            Share your QR with passengers. Every cruiser who signs up on Cruise.Plus earns you <b style={{ color: ORANGE }}>1,500 points (≈ $15)</b>. Redeem at any port.
          </p>
          {code ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="rounded-xl px-4 py-2 text-sm font-bold" style={{ background: "#f3fbfc", color: TEAL }}>Your balance: {points ?? 0} pts</div>
              <button onClick={copy} className="rounded-full border-2 px-4 py-2 text-sm font-bold" style={{ borderColor: ORANGE, color: ORANGE }}>{copied ? "Copied!" : "Copy share link"}</button>
            </div>
          ) : (
            <p className="mt-4 rounded-xl border p-3 text-sm" style={{ borderColor: "#e6eaf1", color: "#61708a" }}>
              Create your free crew pass first — tap <b>“Show my pass”</b> on any venue — and your personal referral QR appears here.
            </p>
          )}
        </div>
        {code && (
          <div className="justify-self-center text-center">
            <div className="inline-block rounded-2xl border-2 border-dashed p-3" style={{ borderColor: ORANGE }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Your referral QR" width={180} height={180} />
            </div>
            <div className="mt-2 text-xs" style={{ color: "#8b97ad" }}>Scan to join Cruise.Plus · ref {code}</div>
          </div>
        )}
      </div>
    </section>
  );
}
