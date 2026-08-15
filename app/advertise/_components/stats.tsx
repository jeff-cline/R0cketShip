import { COLORS, CheckIcon, CrossIcon } from "./shared";

export function StatStrip() {
  const stats = [
    { kpi: "1,200+", label: "niches mapped & live" },
    { kpi: "$5", label: "minimum CPA per action" },
    { kpi: "$1,000", label: "minimum wallet deposit" },
    { kpi: "15% / 12mo", label: "referral commission window" },
    { kpi: "30%", label: "pool reserve held back" },
    { kpi: "1:1", label: "partner per industry" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
      {stats.map((s) => (
        <div key={s.kpi} className="rounded-xl border p-4 text-center" style={{ borderColor: COLORS.hairline, background: COLORS.surface2 }}>
          <div className="text-2xl font-black md:text-3xl" style={{ color: COLORS.accent, letterSpacing: "-0.02em" }}>
            {s.kpi}
          </div>
          <div className="mt-1 text-xs uppercase tracking-wider" style={{ color: COLORS.ink3 }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ComparisonTable() {
  const rows: Array<{ feature: string; legacy: string; rocketship: string; legacyOk?: boolean; rocketshipOk?: boolean }> = [
    { feature: "Pricing model", legacy: "Cost-per-impression / month", rocketship: "Cost-per-action only", legacyOk: false, rocketshipOk: true },
    { feature: "Risk of wasted spend", legacy: "High — pay for views", rocketship: "Zero — you only pay on success", legacyOk: false, rocketshipOk: true },
    { feature: "Setup time", legacy: "4–12 weeks of agency onboarding", rocketship: "Same-day launch", legacyOk: false, rocketshipOk: true },
    { feature: "Targeting model", legacy: "Demographic + lookalike", rocketship: "VRTCLS AI predictive + intent", legacyOk: false, rocketshipOk: true },
    { feature: "Audience exclusivity", legacy: "Auction — everyone competes", rocketship: "One strategic partner per industry", legacyOk: false, rocketshipOk: true },
    { feature: "Optimizer", legacy: "Manual / weekly review", rocketship: "Continuous per-click ML (Phase 3+)", legacyOk: false, rocketshipOk: true },
    { feature: "Budget control", legacy: "Locked monthly retainers", rocketship: "Turn flights on / off any time", legacyOk: false, rocketshipOk: true },
    { feature: "Compliance posture", legacy: "Customer carries the risk", rocketship: "TCPA / CAN-SPAM / GDPR / CCPA managed", legacyOk: false, rocketshipOk: true },
    { feature: "Transparency", legacy: "Black-box agency reports", rocketship: "Live dashboard, per-action audit", legacyOk: false, rocketshipOk: true },
  ];
  return (
    <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: COLORS.hairline2, background: COLORS.surface }}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr style={{ background: COLORS.surface3 }}>
            <th className="px-4 py-4 text-left font-bold uppercase tracking-wider text-xs" style={{ color: COLORS.ink3 }}>
              Capability
            </th>
            <th className="px-4 py-4 text-left font-bold uppercase tracking-wider text-xs" style={{ color: COLORS.ink3 }}>
              Traditional outbound / agency
            </th>
            <th className="px-4 py-4 text-left font-bold uppercase tracking-wider text-xs" style={{ color: COLORS.accent }}>
              r0cketship · VRTCLS AI
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.feature} style={{ borderTop: `1px solid ${COLORS.hairline}`, background: i % 2 === 0 ? "transparent" : COLORS.surface }}>
              <td className="px-4 py-3 font-semibold" style={{ color: COLORS.ink }}>
                {r.feature}
              </td>
              <td className="px-4 py-3" style={{ color: COLORS.ink3 }}>
                <div className="flex items-start gap-2">
                  <CrossIcon />
                  <span>{r.legacy}</span>
                </div>
              </td>
              <td className="px-4 py-3" style={{ color: COLORS.ink2 }}>
                <div className="flex items-start gap-2">
                  <CheckIcon color={COLORS.success} />
                  <span>{r.rocketship}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
