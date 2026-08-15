import { COLORS } from "./shared";

export function SampleDashboard() {
  const rows = [
    { name: "Roofing — Greater Phoenix", status: "Live", spend: "$3,240", actions: 612, cpa: "$5.29", trend: "+12%" },
    { name: "Mortgage Refi — TX, FL, AZ", status: "Live", spend: "$1,808", actions: 297, cpa: "$6.09", trend: "+8%" },
    { name: "Solar — California Tier-1", status: "Paused", spend: "$420", actions: 64, cpa: "$6.56", trend: "—" },
    { name: "B2B SaaS — HR tooling", status: "Learning", spend: "$612", actions: 71, cpa: "$8.62", trend: "▼ stabilizing" },
  ];
  const activity = [
    { t: "00:00:07 ago", color: COLORS.success, text: "Action verified — Mortgage Refi — $6.09" },
    { t: "00:01:42 ago", color: COLORS.accent, text: "Flight cadence increased on Roofing/Phoenix" },
    { t: "00:04:11 ago", color: COLORS.sky, text: "Optimizer adjusted send window: 7:14–8:42 local" },
    { t: "00:08:55 ago", color: COLORS.violet, text: "New niche pool unlocked: Commercial HVAC (212)" },
    { t: "00:12:03 ago", color: COLORS.gold, text: "Wallet auto-top-up rule armed: $5,000 trigger" },
  ];

  return (
    <div
      className="rounded-2xl border p-4 md:p-6"
      style={{
        borderColor: COLORS.hairline2,
        background: `linear-gradient(180deg, ${COLORS.surface}, ${COLORS.bg})`,
        boxShadow: `0 24px 64px rgba(255,107,53,0.1)`,
      }}
    >
      {/* dashboard chrome */}
      <div className="mb-5 flex items-center justify-between border-b pb-3" style={{ borderColor: COLORS.hairline }}>
        <div className="flex items-center gap-2">
          <span style={{ width: 10, height: 10, borderRadius: 999, background: COLORS.rose }} />
          <span style={{ width: 10, height: 10, borderRadius: 999, background: COLORS.gold }} />
          <span style={{ width: 10, height: 10, borderRadius: 999, background: COLORS.success }} />
          <span className="ml-3 text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.ink3 }}>
            r0cketship · advertiser console
          </span>
        </div>
        <div className="text-xs" style={{ color: COLORS.ink4 }}>app.r0cketship.com/dashboard</div>
      </div>

      {/* top stat row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Wallet balance", value: "$8,420.18", sub: "Auto-top-up armed", color: COLORS.accent },
          { label: "Active campaigns", value: "4", sub: "1 paused · 1 learning", color: COLORS.sky },
          { label: "Actions today", value: "1,044", sub: "+126 vs yesterday", color: COLORS.success },
          { label: "Blended CPA", value: "$6.18", sub: "−9.4% w/w", color: COLORS.gold },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4" style={{ borderColor: COLORS.hairline, background: COLORS.surface2 }}>
            <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLORS.ink3 }}>{s.label}</div>
            <div className="mt-1 text-2xl font-black" style={{ color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
            <div className="mt-1 text-xs" style={{ color: COLORS.ink4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* campaigns table */}
        <div className="lg:col-span-2 rounded-xl border overflow-hidden" style={{ borderColor: COLORS.hairline, background: COLORS.surface }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${COLORS.hairline}` }}>
            <div className="text-sm font-bold" style={{ color: COLORS.ink }}>Campaigns</div>
            <div className="text-xs" style={{ color: COLORS.ink4 }}>4 of 4 shown</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr style={{ background: COLORS.surface3 }}>
                  <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ink3 }}>Campaign</th>
                  <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ink3 }}>Status</th>
                  <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ink3 }}>Spend</th>
                  <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ink3 }}>Actions</th>
                  <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ink3 }}>CPA</th>
                  <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ink3 }}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
                    <td className="px-4 py-2 font-semibold" style={{ color: COLORS.ink }}>{r.name}</td>
                    <td className="px-4 py-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          background:
                            r.status === "Live"
                              ? `${COLORS.success}22`
                              : r.status === "Paused"
                              ? `${COLORS.ink4}22`
                              : `${COLORS.gold}22`,
                          color:
                            r.status === "Live"
                              ? COLORS.success
                              : r.status === "Paused"
                              ? COLORS.ink3
                              : COLORS.gold,
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums" style={{ color: COLORS.ink2 }}>{r.spend}</td>
                    <td className="px-4 py-2 text-right tabular-nums" style={{ color: COLORS.ink2 }}>{r.actions}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-bold" style={{ color: COLORS.accent }}>{r.cpa}</td>
                    <td className="px-4 py-2 text-right text-xs" style={{ color: COLORS.ink3 }}>{r.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* activity feed */}
        <div className="rounded-xl border" style={{ borderColor: COLORS.hairline, background: COLORS.surface }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${COLORS.hairline}` }}>
            <div className="text-sm font-bold" style={{ color: COLORS.ink }}>Live activity</div>
            <span className="flex items-center gap-1 text-xs" style={{ color: COLORS.success }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: COLORS.success, boxShadow: `0 0 8px ${COLORS.success}` }} />
              streaming
            </span>
          </div>
          <ul className="divide-y" style={{ borderColor: COLORS.hairline }}>
            {activity.map((a, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3 text-sm" style={{ borderTop: i === 0 ? "none" : `1px solid ${COLORS.hairline}` }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: a.color, marginTop: 6, flexShrink: 0 }} />
                <div>
                  <div style={{ color: COLORS.ink2 }}>{a.text}</div>
                  <div className="mt-0.5 text-[11px]" style={{ color: COLORS.ink4 }}>{a.t}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 text-[11px]" style={{ color: COLORS.ink4 }}>
        Illustrative interface · numbers shown are sample data. Live console available after wallet activation.
      </div>
    </div>
  );
}
