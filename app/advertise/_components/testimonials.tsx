import { COLORS } from "./shared";

type T = {
  initials: string;
  name: string;
  role: string;
  quote: string;
  kpi?: string;
  hue: string;
};

const testimonials: T[] = [
  {
    initials: "MR",
    name: "Marcus R.",
    role: "Commercial Roofing · 14 crews, 3 states",
    quote:
      "We were burning $9k a month on a national lead aggregator for leads that any of seven contractors could buy. Same-day pivot to a CPA model — we now only pay when a project meets our crew's profile. Operationally it's night and day.",
    kpi: "CAC: $612 → $194",
    hue: COLORS.accent,
  },
  {
    initials: "AT",
    name: "Anya T.",
    role: "Mortgage Broker · independent shop",
    quote:
      "I'm a one-person back office. I cannot manage SDRs, can't manage a six-figure martech stack. This is the first system where I set the action I'm willing to pay for and the platform just produces it. The dashboard alone is worth the deposit.",
    kpi: "Funded loans: +38% Q/Q",
    hue: COLORS.sky,
  },
  {
    initials: "JK",
    name: "Jamal K.",
    role: "Boutique agency owner · 11 seats",
    quote:
      "We use r0cketship as the demand layer behind every retainer we sell. The strategic-partner tier locked us in as the only agency in our vertical with this channel — that exclusivity is doing the heavy lifting in our pitch deck.",
    kpi: "Retainers > $25k MRR: 4 new",
    hue: COLORS.violet,
  },
  {
    initials: "PS",
    name: "Priya S.",
    role: "SaaS founder · seed-stage, 7 FTEs",
    quote:
      "I needed pipeline before I could hire a sales team. We launched on the pay-for-success offer with a $1k deposit; the predictive targeting actually figured out our ICP faster than our own analyst did.",
    kpi: "Pipeline: $0 → $480k in 11 weeks",
    hue: COLORS.success,
  },
  {
    initials: "DH",
    name: "Derek H.",
    role: "Solar Installer · Texas",
    quote:
      "Every lead source we'd tried before — Angi, Modernize, you name it — sold the same lead to 5 people. r0cketship is the first thing that delivered a qualified action that was ours. Just ours. That's the whole game.",
    kpi: "Close rate: 6% → 19%",
    hue: COLORS.gold,
  },
];

export function Testimonials() {
  return (
    <div>
      <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider" style={{ background: COLORS.surface3, color: COLORS.ink3 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: COLORS.gold }} />
        Sample · Early-access partner composites
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <figure
            key={t.name}
            className="flex flex-col gap-4 rounded-2xl border p-6"
            style={{ borderColor: COLORS.hairline, background: COLORS.surface2 }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full font-extrabold"
                style={{
                  background: `linear-gradient(135deg, ${t.hue}, ${t.hue}88)`,
                  color: COLORS.ink,
                  boxShadow: `0 4px 16px ${t.hue}55`,
                  letterSpacing: "0.04em",
                }}
              >
                {t.initials}
              </div>
              <figcaption>
                <div className="font-bold" style={{ color: COLORS.ink }}>{t.name}</div>
                <div className="text-xs" style={{ color: COLORS.ink3 }}>{t.role}</div>
              </figcaption>
            </div>
            <blockquote className="text-sm leading-relaxed" style={{ color: COLORS.ink2 }}>
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            {t.kpi && (
              <div className="mt-auto inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold" style={{ background: `${t.hue}1f`, color: t.hue }}>
                <span>▲</span> {t.kpi}
              </div>
            )}
          </figure>
        ))}
      </div>
      <p className="mt-4 text-xs" style={{ color: COLORS.ink4 }}>
        Sample testimonials are composite profiles built from early-access partner conversations. We will publish first-name, verified accounts as outcomes mature.
      </p>
    </div>
  );
}
