"use client";

import { useMemo, useState } from "react";
import { TIERS } from "./tiers";

const TEAL = "#0d7377";
const ORANGE = "#ff5b2e";

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

type Tab = "roi" | "recommender" | "calls";

export function Tools() {
  const [tab, setTab] = useState<Tab>("roi");
  const tabs: { key: Tab; label: string }[] = [
    { key: "roi", label: "Growth ROI" },
    { key: "recommender", label: "Which tier fits me?" },
    { key: "calls", label: "Keyword-call value" },
  ];
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="rounded-full px-4 py-2 text-sm font-semibold transition"
            style={
              tab === t.key
                ? { background: TEAL, color: "#fff" }
                : { background: "var(--surface-3)", color: "var(--ink-2)" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "roi" && <RoiCalc />}
      {tab === "recommender" && <Recommender />}
      {tab === "calls" && <CallValue />}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  fmt = (v: number) => String(v),
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  fmt?: (v: number) => string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="label">{label}</span>
        <span className="text-sm font-bold" style={{ color: TEAL }}>{fmt(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: ORANGE }}
      />
    </label>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card p-4">
      <div className="label">{label}</div>
      <div className="mt-1 text-2xl font-extrabold tracking-tight" style={{ color: accent ? ORANGE : "var(--ink)" }}>{value}</div>
    </div>
  );
}

// ---- 1. Growth ROI ----
function RoiCalc() {
  const [leads, setLeads] = useState(120);
  const [close, setClose] = useState(8); // %
  const [deal, setDeal] = useState(6000);
  const [tierIdx, setTierIdx] = useState(2);

  const tier = TIERS[tierIdx];
  const wins = (leads * close) / 100;
  const revenue = wins * deal;
  const net = revenue - tier.monthly;
  const roi = tier.monthly ? revenue / tier.monthly : 0;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card flex flex-col gap-5 p-6">
        <Slider label="High-intent leads / month" value={leads} min={10} max={1000} step={10} onChange={setLeads} />
        <Slider label="Your close rate" value={close} min={1} max={40} onChange={setClose} fmt={(v) => `${v}%`} />
        <Slider label="Average deal value" value={deal} min={500} max={50000} step={500} onChange={setDeal} fmt={money} />
        <label className="block">
          <span className="label">THRIVE tier</span>
          <select className="input mt-1" value={tierIdx} onChange={(e) => setTierIdx(Number(e.target.value))}>
            {TIERS.map((t, i) => (
              <option key={t.key} value={i}>{t.name} — {t.price}/mo</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid content-start gap-3">
        <Stat label="New customers / month" value={wins.toFixed(1)} />
        <Stat label="Projected revenue / month" value={money(revenue)} />
        <Stat label={`Net after ${tier.name}`} value={money(net)} accent />
        <div className="card p-4" style={{ background: net >= 0 ? "color-mix(in srgb, #0d7377 8%, #fff)" : "color-mix(in srgb, #e11d48 8%, #fff)" }}>
          <div className="label">Return on investment</div>
          <div className="mt-1 text-3xl font-extrabold" style={{ color: net >= 0 ? TEAL : "var(--neg)" }}>{roi.toFixed(1)}×</div>
          <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
            {net >= 0 ? `Every $1 into ${tier.name} returns ${money(roi)}.` : `Raise leads or close rate to clear the ${tier.name} investment.`}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---- 2. Tier recommender ----
function Recommender() {
  const [reach, setReach] = useState<"zip" | "state">("zip");
  const [want, setWant] = useState<string[]>(["data"]);
  const [inperson, setInperson] = useState(false);
  const [exclusive, setExclusive] = useState(false);

  const toggle = (k: string) =>
    setWant((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const pick = useMemo(() => {
    if (exclusive) return TIERS.find((t) => t.key === "explode")!;
    if (reach === "state" || inperson) return TIERS.find((t) => t.key === "velocity")!;
    if (want.includes("calls")) return TIERS.find((t) => t.key === "integrate")!;
    if (want.includes("marketing")) return TIERS.find((t) => t.key === "response")!;
    if (want.includes("consulting")) return TIERS.find((t) => t.key === "help")!;
    return TIERS.find((t) => t.key === "try")!;
  }, [reach, want, inperson, exclusive]);

  const opts = [
    { k: "data", label: "Predictive data" },
    { k: "consulting", label: "Consulting" },
    { k: "marketing", label: "Done-for-you marketing" },
    { k: "calls", label: "Inbound keyword calls" },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card flex flex-col gap-5 p-6">
        <div>
          <span className="label">What do you want most?</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {opts.map((o) => (
              <button key={o.k} onClick={() => toggle(o.k)} className="rounded-full px-3 py-1.5 text-sm font-semibold transition"
                style={want.includes(o.k) ? { background: TEAL, color: "#fff" } : { background: "var(--surface-3)", color: "var(--ink-2)" }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="label">Coverage</span>
          <div className="mt-2 flex gap-2">
            {(["zip", "state"] as const).map((r) => (
              <button key={r} onClick={() => setReach(r)} className="rounded-full px-3 py-1.5 text-sm font-semibold transition"
                style={reach === r ? { background: ORANGE, color: "#fff" } : { background: "var(--surface-3)", color: "var(--ink-2)" }}>
                {r === "zip" ? "One ZIP code" : "Entire state"}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={inperson} onChange={(e) => setInperson(e.target.checked)} style={{ accentColor: TEAL }} />
          Immersive in-person, live at their location
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={exclusive} onChange={(e) => setExclusive(e.target.checked)} style={{ accentColor: TEAL }} />
          Exclusive calls + a new revenue stream (Secret Weapon)
        </label>
      </div>
      <div className="card flex flex-col justify-center p-6 text-center" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${TEAL} 10%, #fff), color-mix(in srgb, ${ORANGE} 10%, #fff))` }}>
        <div className="label">Your recommended tier</div>
        <div className="mt-2 text-4xl font-extrabold" style={{ color: TEAL }}>{pick.name}</div>
        <div className="mt-1 text-xl font-bold" style={{ color: ORANGE }}>{pick.price}/mo</div>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>{pick.tagline}</p>
        <a href="#contact" className="btn btn-primary mx-auto mt-5" style={{ background: TEAL }}>Start with {pick.name} →</a>
      </div>
    </div>
  );
}

// ---- 3. Keyword-call value ----
function CallValue() {
  const [calls, setCalls] = useState(60);
  const [answer, setAnswer] = useState(70);
  const [close, setClose] = useState(25);
  const [deal, setDeal] = useState(4500);

  const answered = (calls * answer) / 100;
  const wins = (answered * close) / 100;
  const revenue = wins * deal;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card flex flex-col gap-5 p-6">
        <Slider label="Keyword calls / month" value={calls} min={5} max={500} step={5} onChange={setCalls} />
        <Slider label="Answer rate" value={answer} min={20} max={100} onChange={setAnswer} fmt={(v) => `${v}%`} />
        <Slider label="Close rate on answered calls" value={close} min={5} max={60} onChange={setClose} fmt={(v) => `${v}%`} />
        <Slider label="Average deal value" value={deal} min={500} max={50000} step={500} onChange={setDeal} fmt={money} />
      </div>
      <div className="grid content-start gap-3">
        <Stat label="Answered calls / month" value={answered.toFixed(0)} />
        <Stat label="New customers / month" value={wins.toFixed(1)} />
        <Stat label="Revenue from keyword calls" value={money(revenue)} accent />
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Keyword calls come in at INTEGRATE (ZIP), VELOCITY (statewide), and EXPLODE (exclusive) — a brand-new revenue stream layered on your data.
        </p>
      </div>
    </div>
  );
}
