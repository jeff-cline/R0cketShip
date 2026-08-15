import { COLORS } from "./shared";

const steps = [
  {
    n: "01",
    title: "Fund a wallet",
    desc: "Drop a $1,000 minimum deposit. Funds escrow. 30% pool reserve floats against pending verified actions.",
    color: COLORS.accent,
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
        <rect x="2.5" y="6" width="19" height="13" rx="2" stroke={COLORS.accent} strokeWidth="1.8" />
        <path d="M2.5 10h19" stroke={COLORS.accent} strokeWidth="1.8" />
        <circle cx="17" cy="15" r="1.5" fill={COLORS.accent} />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Pick niche + KPI",
    desc: "Choose your industry pool. Define the action you'll pay for and the maximum CPA you'll bid. Set caps.",
    color: COLORS.sky,
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke={COLORS.sky} strokeWidth="1.8" />
        <circle cx="12" cy="12" r="5" stroke={COLORS.sky} strokeWidth="1.8" />
        <circle cx="12" cy="12" r="1.5" fill={COLORS.sky} />
      </svg>
    ),
  },
  {
    n: "03",
    title: "VRTCLS AI launches",
    desc: "Predictive targeting + intent signals + AI-generated copy. The optimizer learns your KPI surface fast.",
    color: COLORS.violet,
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
        <path d="M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 2z" stroke={COLORS.violet} strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    n: "04",
    title: "Pay on success",
    desc: "Wallet debits only when a verified action clears your rule. Receipts hit your CRM. Live dashboard, on/off any time.",
    color: COLORS.success,
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
        <path d="M4 12l5 5L20 6" stroke={COLORS.success} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {steps.map((s) => (
        <div
          key={s.n}
          className="relative rounded-2xl border p-6"
          style={{ borderColor: COLORS.hairline, background: COLORS.surface2 }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ background: `${s.color}1f` }}
            >
              {s.icon}
            </span>
            <span className="text-4xl font-black opacity-60" style={{ color: s.color }}>
              {s.n}
            </span>
          </div>
          <h4 className="mt-4 text-lg font-black" style={{ color: COLORS.ink, letterSpacing: "-0.01em" }}>
            {s.title}
          </h4>
          <p className="mt-1 text-sm" style={{ color: COLORS.ink3 }}>
            {s.desc}
          </p>
        </div>
      ))}
    </div>
  );
}
