/**
 * /admin/outreach/queue — god-only browse of the per-lead outreach send queue.
 *
 * URL params drive everything (no client state):
 *   ?status=queued,failed       — comma-separated multi-select
 *   ?tenantId=<uuid>            — single white-label scope
 *   ?due=1                      — queued AND scheduledFor <= now
 *   ?page=N                     — 100 rows per page
 */
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import {
  listQueue,
  outreachOverview,
  type QueueStatus,
} from "@/src/outreach/observability";
import { PageHeader, Card, StatCard, Badge } from "@/app/_ui/primitives";

export const dynamic = "force-dynamic";

const ALL_STATUSES: QueueStatus[] = ["queued", "sent", "failed", "suppressed", "skipped"];
const PAGE_SIZE = 100;

type SP = {
  status?: string;
  tenantId?: string;
  due?: string;
  page?: string;
};

function parseStatuses(raw: string | undefined): QueueStatus[] {
  if (!raw) return [];
  const wanted = raw.split(",").map((s) => s.trim().toLowerCase());
  return ALL_STATUSES.filter((s) => wanted.includes(s));
}

function statusTone(s: QueueStatus): "neutral" | "pos" | "neg" | "warn" | "accent" {
  if (s === "sent") return "pos";
  if (s === "failed") return "neg";
  if (s === "queued") return "warn";
  if (s === "suppressed") return "neutral";
  if (s === "skipped") return "accent";
  return "neutral";
}

function fmtRelative(d: Date | null, refNow: number): string {
  if (!d) return "—";
  const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
  const diff = t - refNow;
  const abs = Math.abs(diff);
  const m = Math.round(abs / 60_000);
  const h = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);
  let unit: string;
  if (m < 1) unit = "just now";
  else if (m < 60) unit = `${m} min`;
  else if (h < 48) unit = `${h}h`;
  else unit = `${days}d`;
  if (m < 1) return unit;
  return diff < 0 ? `${unit} ago` : `in ${unit}`;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export default async function OutreachQueuePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  await requireAuth(["god"]);
  const sp = await searchParams;

  const statuses = parseStatuses(sp.status);
  const tenantId = sp.tenantId && sp.tenantId !== "" ? sp.tenantId : undefined;
  const due = sp.due === "1";
  const page = Math.max(1, Number(sp.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const now = new Date();

  // "Due now" forces status=queued and a scheduledBefore=now constraint.
  const effectiveStatuses: QueueStatus[] = due ? ["queued"] : statuses;

  // When the view is filtered to just queued rows (or "due now"), the user
  // wants earliest-first ("what's about to fire"). Otherwise default to
  // most-recent first ("what just happened?").
  const onlyQueued =
    due || (effectiveStatuses.length === 1 && effectiveStatuses[0] === "queued");

  const [overview, queue, allTenants] = await Promise.all([
    outreachOverview(),
    listQueue({
      status: effectiveStatuses.length > 0 ? effectiveStatuses : undefined,
      tenantId,
      limit: PAGE_SIZE,
      offset,
      scheduledBefore: due ? now : undefined,
      order: onlyQueued ? "asc" : "desc",
    }),
    db
      .select({ id: tenants.id, domain: tenants.domain })
      .from(tenants)
      .orderBy(tenants.domain),
  ]);

  const totalPages = Math.max(1, Math.ceil(queue.total / PAGE_SIZE));
  const firstRow = queue.total === 0 ? 0 : offset + 1;
  const lastRow = Math.min(offset + queue.rows.length, queue.total);

  function qs(overrides: Partial<Record<string, string | number | undefined>>): string {
    const base: Record<string, string | undefined> = {
      status: sp.status,
      tenantId: sp.tenantId,
      due: sp.due,
      page: sp.page,
    };
    const merged = { ...base, ...overrides };
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v === undefined || v === null || v === "") continue;
      usp.set(k, String(v));
    }
    const s = usp.toString();
    return s ? `/admin/outreach/queue?${s}` : "/admin/outreach/queue";
  }

  // Status pill toggling: clicking adds/removes from the comma-sep list,
  // and resets page to 1. "All" clears statuses entirely.
  function statusPillHref(s: QueueStatus | "all"): string {
    if (s === "all") return qs({ status: undefined, page: "1", due: undefined });
    const cur = new Set(statuses);
    if (cur.has(s)) cur.delete(s);
    else cur.add(s);
    return qs({
      status: cur.size === 0 ? undefined : Array.from(cur).join(","),
      page: "1",
      due: undefined,
    });
  }

  const statusTabs: { value: QueueStatus | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "queued", label: "Queued" },
    { value: "sent", label: "Sent" },
    { value: "failed", label: "Failed" },
    { value: "suppressed", label: "Suppressed" },
    { value: "skipped", label: "Skipped" },
  ];

  const allPillActive = statuses.length === 0 && !due;
  const dueHref = qs({ due: due ? undefined : "1", status: undefined, page: "1" });
  const refNowMs = now.getTime();

  return (
    <>
      <PageHeader
        title="Outreach queue"
        subtitle="Inspect what's going next, who failed, and how the drip is paced."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Queued total" value={overview.queued.toLocaleString()} sub="all white-labels" />
        <StatCard label="Sent today" value={overview.sentToday.toLocaleString()} accent />
        <StatCard label="Failed today" value={overview.failedToday.toLocaleString()} sub={overview.failedToday > 0 ? "investigate" : "all green"} />
        <StatCard label="Due within 1h" value={overview.dueWithin1h.toLocaleString()} sub="ready to fire" />
      </div>

      <Card className="mt-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((t) => {
              const active =
                t.value === "all"
                  ? allPillActive
                  : !due && statuses.includes(t.value as QueueStatus);
              return (
                <a
                  key={t.value}
                  href={statusPillHref(t.value)}
                  className="rounded-full px-3 py-1 text-xs font-semibold transition"
                  style={{
                    background: active ? "var(--color-accent)" : "var(--surface-2)",
                    color: active ? "#fff" : "var(--ink)",
                    border: "1px solid var(--line)",
                  }}
                >
                  {t.label}
                </a>
              );
            })}
            <a
              href={dueHref}
              className="rounded-full px-3 py-1 text-xs font-semibold transition"
              style={{
                background: due ? "var(--warn)" : "var(--surface-2)",
                color: due ? "#fff" : "var(--ink)",
                border: "1px solid var(--line)",
              }}
            >
              Due now
            </a>
          </div>

          <form className="ml-auto flex items-end gap-2" method="get">
            {/* Preserve other params across tenant change */}
            {sp.status && <input type="hidden" name="status" value={sp.status} />}
            {sp.due && <input type="hidden" name="due" value={sp.due} />}
            <label className="flex flex-col gap-1.5">
              <span className="label">White-label</span>
              <select className="input" name="tenantId" defaultValue={tenantId ?? ""}>
                <option value="">All</option>
                {allTenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.domain}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary" type="submit">
              Apply
            </button>
            {(statuses.length > 0 || tenantId || due) && (
              <a className="btn btn-ghost" href="/admin/outreach/queue">
                Reset
              </a>
            )}
          </form>
        </div>
      </Card>

      <div className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
        {queue.total === 0 ? (
          "No matching rows."
        ) : (
          <>
            Showing {firstRow.toLocaleString()}–{lastRow.toLocaleString()} of{" "}
            {queue.total.toLocaleString()}
          </>
        )}
      </div>

      {queue.rows.length > 0 && (
        <div
          className="mt-3 overflow-x-auto rounded-[var(--radius-lg)] border"
          style={{ borderColor: "var(--line)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {[
                  "Domain",
                  "To",
                  "Status",
                  "Scheduled / Sent",
                  "Mailbox",
                  "Clicks",
                  "Error",
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
              {queue.rows.map((r) => {
                const showSent = r.status === "sent" && r.sentAt;
                const when = showSent ? r.sentAt! : r.scheduledFor;
                const whenLabel = fmtRelative(when, refNowMs);
                const whenIso = (when instanceof Date ? when : new Date(when)).toISOString();
                return (
                  <tr
                    key={r.id}
                    className="border-t"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <td className="px-4 py-3 align-middle font-medium">
                      {r.tenantDomain}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span title={r.toAddr}>{truncate(r.toAddr, 40)}</span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    </td>
                    <td
                      className="px-4 py-3 align-middle text-xs"
                      style={{ color: "var(--muted)" }}
                      title={whenIso}
                    >
                      <div>{whenLabel}</div>
                      <div style={{ color: "var(--muted-2)" }}>
                        {showSent ? "sent" : "scheduled"}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 align-middle text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      {r.mailboxAddress ?? "—"}
                    </td>
                    <td className="px-4 py-3 align-middle tabular-nums">
                      {r.clicks > 0 ? (
                        <span style={{ color: "var(--color-accent)" }}>
                          {r.clicks}
                        </span>
                      ) : (
                        <span style={{ color: "var(--muted-2)" }}>0</span>
                      )}
                    </td>
                    <td
                      className="px-4 py-3 align-middle text-xs"
                      style={{ color: r.error ? "var(--neg)" : "var(--muted-2)" }}
                    >
                      {r.error ? (
                        <span title={r.error}>{truncate(r.error, 50)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {queue.total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span style={{ color: "var(--muted)" }}>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <a className="btn btn-ghost" href={qs({ page: page - 1 })}>
                ← Prev
              </a>
            ) : (
              <span
                className="btn btn-ghost"
                style={{ opacity: 0.4, pointerEvents: "none" }}
              >
                ← Prev
              </span>
            )}
            {page < totalPages ? (
              <a className="btn btn-ghost" href={qs({ page: page + 1 })}>
                Next →
              </a>
            ) : (
              <span
                className="btn btn-ghost"
                style={{ opacity: 0.4, pointerEvents: "none" }}
              >
                Next →
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
