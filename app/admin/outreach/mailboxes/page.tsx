/**
 * /admin/outreach/mailboxes — god-only per-mailbox health snapshot.
 *
 * Surfaces 7-day delivery rate from `email_outbound` joined to each mailbox,
 * flagging "burnout watch" when delivery <85% over the last 7 days with at
 * least 25 attempts. Includes a hand-rolled SVG bar-chart so we don't need
 * a chart library for what's essentially N tiny bars.
 */
import { requireAuth } from "@/src/auth/guard";
import {
  mailboxStats,
  outreachOverview,
  type MailboxStat,
} from "@/src/outreach/observability";
import { PageHeader, Card, StatCard, Badge, SectionTitle } from "@/app/_ui/primitives";

export const dynamic = "force-dynamic";

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function rateColor(rate: number, denom: number): string {
  if (denom === 0) return "var(--muted-2)";
  if (rate >= 0.95) return "var(--pos)";
  if (rate >= 0.85) return "var(--warn)";
  return "var(--neg)";
}

function rateTone(rate: number, denom: number): "neutral" | "pos" | "neg" | "warn" {
  if (denom === 0) return "neutral";
  if (rate >= 0.95) return "pos";
  if (rate >= 0.85) return "warn";
  return "neg";
}

export default async function MailboxHealthPage() {
  await requireAuth(["god"]);

  const [overview, stats] = await Promise.all([outreachOverview(), mailboxStats()]);

  const totalCap = stats.reduce((n, s) => n + s.dailyCap, 0);
  const totalSentToday = stats.reduce((n, s) => n + s.sentToday, 0);
  const capUtil = totalCap > 0 ? totalSentToday / totalCap : 0;

  // Sort: burnout-watch first, then lowest delivery rate, then by attempts desc.
  const sorted = [...stats].sort((a, b) => {
    if (a.burnoutWatch !== b.burnoutWatch) return a.burnoutWatch ? -1 : 1;
    if (a.deliveryRate7d !== b.deliveryRate7d) return a.deliveryRate7d - b.deliveryRate7d;
    return b.sent7d + b.failed7d - (a.sent7d + a.failed7d);
  });

  return (
    <>
      <PageHeader
        title="Mailbox health"
        subtitle="Per-mailbox delivery efficiency over the last 7 days. Burnout watch flags mailboxes < 85% delivery."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total mailboxes"
          value={overview.totalMailboxes.toLocaleString()}
          sub={`${overview.activeMailboxes} active`}
        />
        <StatCard
          label="Active"
          value={overview.activeMailboxes.toLocaleString()}
          sub={`${overview.totalMailboxes - overview.activeMailboxes} paused`}
        />
        <StatCard
          label="Burnout watch"
          value={overview.burnoutWatchCount.toLocaleString()}
          accent={overview.burnoutWatchCount > 0}
          sub={overview.burnoutWatchCount > 0 ? "needs attention" : "all healthy"}
        />
        <StatCard
          label="Cap utilization"
          value={`${(capUtil * 100).toFixed(0)}%`}
          sub={`${totalSentToday.toLocaleString()} / ${totalCap.toLocaleString()} today`}
        />
      </div>

      {sorted.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No mailboxes configured yet.
          </p>
        </Card>
      ) : (
        <>
          <div className="mt-6">
            <SectionTitle hint="last 7 days · sent / (sent + failed)">
              Delivery rate per mailbox
            </SectionTitle>
          </div>
          <Card>
            <DeliveryRateChart rows={sorted} />
          </Card>

          <div className="mt-6">
            <SectionTitle hint="ordered by burnout risk">
              Mailbox table
            </SectionTitle>
          </div>
          <div
            className="overflow-x-auto rounded-[var(--radius-lg)] border"
            style={{ borderColor: "var(--line)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--surface-2)" }}>
                  {[
                    "Address",
                    "Tenant",
                    "Provider",
                    "Sent / cap today",
                    "7d sends",
                    "7d delivery",
                    "Flags",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => {
                  const denom = s.sent7d + s.failed7d;
                  const capPctValue = s.dailyCap > 0 ? s.sentToday / s.dailyCap : 0;
                  return (
                    <tr
                      key={s.id}
                      className="border-t"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="font-medium">{s.address}</div>
                        {s.displayName && (
                          <div
                            className="text-xs"
                            style={{ color: "var(--muted-2)" }}
                          >
                            {s.displayName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle text-xs" style={{ color: "var(--muted)" }}>
                        {s.tenantDomain}
                      </td>
                      <td className="px-4 py-3 align-middle text-xs">
                        <Badge tone="neutral">{s.provider}</Badge>
                      </td>
                      <td className="px-4 py-3 align-middle tabular-nums">
                        <div>
                          {s.sentToday} / {s.dailyCap}
                        </div>
                        <div
                          className="mt-1 h-1 w-24 overflow-hidden rounded-full"
                          style={{ background: "var(--surface-3)" }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, capPctValue * 100)}%`,
                              height: "100%",
                              background:
                                capPctValue >= 0.9
                                  ? "var(--warn)"
                                  : "var(--color-accent)",
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle tabular-nums">
                        <div>{s.sent7d.toLocaleString()}</div>
                        <div className="text-xs" style={{ color: "var(--muted-2)" }}>
                          {s.failed7d} failed · {s.skipped7d} skipped
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div
                          className="font-semibold tabular-nums"
                          style={{ color: rateColor(s.deliveryRate7d, denom) }}
                        >
                          {denom === 0 ? "—" : pct(s.deliveryRate7d)}
                        </div>
                        {denom > 0 && (
                          <div
                            className="mt-1 h-1.5 w-24 overflow-hidden rounded-full"
                            style={{ background: "var(--surface-3)" }}
                          >
                            <div
                              style={{
                                width: `${s.deliveryRate7d * 100}%`,
                                height: "100%",
                                background: rateColor(s.deliveryRate7d, denom),
                              }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {s.burnoutWatch ? (
                          <Badge tone="neg">Burnout watch</Badge>
                        ) : denom > 0 ? (
                          <Badge tone={rateTone(s.deliveryRate7d, denom)}>
                            {s.deliveryRate7d >= 0.95
                              ? "Healthy"
                              : s.deliveryRate7d >= 0.85
                                ? "Watch"
                                : "Degraded"}
                          </Badge>
                        ) : (
                          <Badge tone="neutral">No data</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Badge tone={s.status === "active" ? "pos" : "neutral"}>
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

/**
 * Hand-rolled SVG bar chart of 7-day delivery rate per mailbox. No deps.
 * Bars stack vertically with a small label and a percentage badge at the
 * end of each bar. Color tracks the same green/gold/red thresholds as the
 * table.
 */
function DeliveryRateChart({ rows }: { rows: MailboxStat[] }) {
  const ROW_H = 22;
  const PAD_TOP = 18;
  const PAD_BOTTOM = 24;
  const LABEL_W = 220;
  const BAR_W = 480;
  const RIGHT_PAD = 70;
  const totalW = LABEL_W + BAR_W + RIGHT_PAD;
  const totalH = PAD_TOP + rows.length * ROW_H + PAD_BOTTOM;

  // Gridlines at 0, 25, 50, 75, 85, 95, 100.
  const gridXs = [0, 25, 50, 75, 85, 95, 100];

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        width={totalW}
        height={totalH}
        viewBox={`0 0 ${totalW} ${totalH}`}
        style={{ display: "block" }}
        role="img"
        aria-label="7-day delivery rate per mailbox"
      >
        {/* Gridlines */}
        {gridXs.map((g) => {
          const x = LABEL_W + (g / 100) * BAR_W;
          const isThreshold = g === 85 || g === 95;
          return (
            <g key={g}>
              <line
                x1={x}
                y1={PAD_TOP - 6}
                x2={x}
                y2={totalH - PAD_BOTTOM + 4}
                stroke={isThreshold ? "var(--line)" : "var(--surface-3)"}
                strokeDasharray={isThreshold ? "4 3" : "2 4"}
                strokeWidth={1}
              />
              <text
                x={x}
                y={totalH - PAD_BOTTOM + 16}
                fontSize={10}
                textAnchor="middle"
                fill="var(--muted-2)"
              >
                {g}%
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {rows.map((r, i) => {
          const y = PAD_TOP + i * ROW_H;
          const denom = r.sent7d + r.failed7d;
          const w = denom > 0 ? r.deliveryRate7d * BAR_W : 0;
          const color = rateColor(r.deliveryRate7d, denom);
          const labelText =
            r.address.length > 28 ? r.address.slice(0, 27) + "…" : r.address;
          return (
            <g key={r.id}>
              <text
                x={LABEL_W - 8}
                y={y + ROW_H / 2 + 4}
                fontSize={11}
                textAnchor="end"
                fill="var(--ink)"
              >
                {labelText}
              </text>
              {/* Track */}
              <rect
                x={LABEL_W}
                y={y + 5}
                width={BAR_W}
                height={ROW_H - 10}
                fill="var(--surface-3)"
                rx={3}
              />
              {/* Filled portion */}
              {denom > 0 && (
                <rect
                  x={LABEL_W}
                  y={y + 5}
                  width={w}
                  height={ROW_H - 10}
                  fill={color}
                  rx={3}
                />
              )}
              {/* Value label */}
              <text
                x={LABEL_W + BAR_W + 6}
                y={y + ROW_H / 2 + 4}
                fontSize={11}
                fontWeight={600}
                fill={denom === 0 ? "var(--muted-2)" : color}
              >
                {denom === 0 ? "—" : pct(r.deliveryRate7d)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
