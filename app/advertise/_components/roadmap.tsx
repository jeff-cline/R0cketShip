import { COLORS } from "./shared";

const phases = [
  {
    label: "Phase 1",
    status: "Live",
    title: "The proprietary high intent network",
    desc: "Our proprietary high intent network is on. Wallet-funded campaigns running across 1,200+ niches with CPA pricing and live console.",
    color: COLORS.success,
  },
  {
    label: "Phase 2",
    status: "Launching",
    title: "Verified-action engine",
    desc: "End-to-end action verification, attribution receipts, and CRM webhooks. Stripe + HubSpot + GoHighLevel native integrations.",
    color: COLORS.accent,
  },
  {
    label: "Phase 3",
    status: "Q4 2026",
    title: "Per-click optimizer",
    desc: "VRTCLS AI moves from per-campaign to per-click optimization. Every send window, copy variant, and audience slice is reinforcement-learned.",
    color: COLORS.sky,
  },
  {
    label: "Phase 4",
    status: "2027",
    title: "Closed-loop ML engine",
    desc: "Closed-loop training on closed-won revenue. Predictive CPA forecasting per niche. Auto-launch playbooks for verticals you don't even staff yet.",
    color: COLORS.violet,
  },
];

export function Roadmap() {
  return (
    <div className="relative">
      {/* desktop spine */}
      <div className="absolute left-1/2 hidden h-full w-px md:block" style={{ background: COLORS.hairline2, transform: "translateX(-0.5px)" }} />
      <ul className="space-y-8 md:space-y-12">
        {phases.map((p, i) => {
          const right = i % 2 === 1;
          return (
            <li key={p.label} className="relative grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-12">
              {/* spine dot — desktop */}
              <span
                className="absolute left-1/2 top-6 hidden h-4 w-4 rounded-full md:block"
                style={{
                  background: p.color,
                  transform: "translateX(-50%)",
                  boxShadow: `0 0 0 4px ${COLORS.bg}, 0 0 0 5px ${p.color}55`,
                }}
              />
              <div className={`${right ? "md:order-2 md:pl-8" : "md:pr-8 md:text-right"}`}>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider" style={{ background: `${p.color}1f`, color: p.color }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: p.color }} />
                  {p.label} · {p.status}
                </div>
                <h3 className="mt-2 text-2xl font-black" style={{ color: COLORS.ink, letterSpacing: "-0.015em" }}>{p.title}</h3>
                <p className="mt-2 text-sm" style={{ color: COLORS.ink3 }}>{p.desc}</p>
              </div>
              <div className={right ? "" : "md:order-2"} aria-hidden />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
