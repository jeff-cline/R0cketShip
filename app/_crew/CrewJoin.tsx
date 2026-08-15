"use client";

import { useState } from "react";

// Crew join form for the consumer crewperk.com home. White/clean. Captures into
// the global Business-Leads CRM and SEGMENTS the user (cruise crew vs. 21+-day
// frequent cruiser vs. high-value traveler) so the God account can separate them.
const ORANGE = "#ff5b2e";
const TEAL = "#0e9aa7";

// Each option maps to a CRM `source` so segments are separable at a glance.
const SEGMENTS: { label: string; source: string }[] = [
  { label: "I'm cruise crew", source: "crew" },
  { label: "I cruise 21+ days a year", source: "cruiser-frequent" },
  { label: "High-value / luxury traveler", source: "traveler-highvalue" },
  { label: "Just exploring", source: "crew-curious" },
];

export function CrewJoin() {
  const [f, setF] = useState({ name: "", email: "", ship: "", port: "", who: SEGMENTS[0].label });
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const seg = SEGMENTS.find((s) => s.label === f.who) ?? SEGMENTS[0];
    fetch("/api/business-lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        source: seg.source,
        name: f.name,
        email: f.email,
        company: f.ship,
        message: `Port: ${f.port} · Segment: ${f.who}`,
        meta: { ship: f.ship, port: f.port, segment: seg.source, segmentLabel: f.who, crew: seg.source === "crew", site: "crewperk.com" },
      }),
    }).catch(() => {});
    setDone(true);
  };

  if (done) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-center shadow-sm" style={{ borderColor: "#e6eaf1" }}>
        <div className="text-2xl font-extrabold" style={{ color: "#0a0e17" }}>You're in. 🤫</div>
        <p className="mt-2 text-sm" style={{ color: "#61708a" }}>Welcome to the secret knock. We'll send your access as ports go live.</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: "#e6eaf1" }}>
      <div className="text-lg font-extrabold" style={{ color: "#0a0e17" }}>Join free — crew only</div>
      <p className="mt-1 text-sm" style={{ color: "#61708a" }}>Unlock crew-only perks at every port.</p>
      <div className="mt-4 grid gap-2.5">
        <select value={f.who} onChange={set("who")} className="rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: "#d3dae6", color: "#2a3550" }}>
          {SEGMENTS.map((s) => <option key={s.source} value={s.label}>{s.label}</option>)}
        </select>
        <input required value={f.name} onChange={set("name")} placeholder="Name" className="rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: "#d3dae6" }} />
        <input required type="email" value={f.email} onChange={set("email")} placeholder="Email" className="rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: "#d3dae6" }} />
        <div className="grid grid-cols-2 gap-2.5">
          <input value={f.ship} onChange={set("ship")} placeholder="Ship" className="rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: "#d3dae6" }} />
          <input value={f.port} onChange={set("port")} placeholder="Home port" className="rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: "#d3dae6" }} />
        </div>
      </div>
      <button type="submit" className="mt-4 w-full rounded-xl py-3 font-bold text-white transition active:translate-y-px" style={{ background: ORANGE }}>Get crew access →</button>
      <p className="mt-2 text-center text-xs" style={{ color: "#8b97ad" }}>Not affiliated with any cruise line. <span style={{ color: TEAL }}>Built for crew.</span></p>
    </form>
  );
}
