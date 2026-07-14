"use client";

import { useState } from "react";
import { grantCreditsToUserAction } from "./actions";

interface LookupUser {
  id: string;
  email: string;
  role: string;
  tenantDomain: string;
  createdAt: string;
  walletId: string | null;
  balance: number;
  spentUsd: number;
  creditsPurchased: number;
  leadsDelivered: number;
  activeSubscriptions: number;
  recentGrants: Array<{
    amount: number;
    description: string | null;
    createdAt: string;
  }>;
}

const fmtUsd = (n: number) =>
  "$" + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const fmtDate = (iso: string) => new Date(iso).toLocaleString();

export function UserGrantPanel() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<LookupUser[] | null>(null);
  const [selected, setSelected] = useState<LookupUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) {
      setError("Type at least 2 characters.");
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const r = await fetch(
        `/api/admin/billing/user-lookup?q=${encodeURIComponent(query.trim())}`,
        { cache: "no-store" },
      );
      const data = await r.json();
      setResults(data.users ?? []);
      // Auto-select if exactly one result.
      if ((data.users ?? []).length === 1) setSelected(data.users[0]);
      else setSelected(null);
    } catch {
      setError("Search failed — try again.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Step 1: search */}
      <form onSubmit={runSearch} className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="customer@email.com"
          className="input"
          style={{ minWidth: 280, flex: 1 }}
        />
        <button className="btn btn-primary" disabled={searching}>
          {searching ? "Searching…" : "Search"}
        </button>
        {selected && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setSelected(null);
              setResults(null);
              setQuery("");
            }}
          >
            Clear
          </button>
        )}
      </form>
      {error && (
        <div className="text-sm" style={{ color: "var(--neg)" }}>
          {error}
        </div>
      )}

      {/* Step 2: result picker (only when multiple matched) */}
      {!selected && results && results.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            {results.length} match{results.length === 1 ? "" : "es"}:
          </div>
          {results.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelected(u)}
              className="rounded-lg border px-3 py-2 text-left text-sm transition hover:opacity-90"
              style={{
                borderColor: "var(--line)",
                background: "var(--surface-2)",
              }}
            >
              <div className="font-semibold">{u.email}</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                {u.tenantDomain} · {u.role} · joined {fmtDate(u.createdAt)}
              </div>
            </button>
          ))}
        </div>
      )}
      {results && results.length === 0 && (
        <div className="text-sm" style={{ color: "var(--muted)" }}>
          No matches.
        </div>
      )}

      {/* Step 3: full account snapshot + grant form */}
      {selected && <AccountSnapshot user={selected} />}
    </div>
  );
}

function AccountSnapshot({ user }: { user: LookupUser }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-bold">{user.email}</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            {user.tenantDomain} · {user.role} · joined {fmtDate(user.createdAt)}
          </div>
          {user.walletId ? (
            <div className="mt-1 font-mono text-[10px]" style={{ color: "var(--muted-2)" }}>
              wallet: {user.walletId}
            </div>
          ) : (
            <div className="mt-1 text-xs" style={{ color: "var(--warn)" }}>
              ⚠ no wallet yet — they need to log in once before you can credit them
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Balance" value={fmtUsd(user.balance)} sub="current credits" accent />
        <Stat label="Lifetime spent" value={fmtUsd(user.spentUsd)} sub={`${user.creditsPurchased.toLocaleString()} credits bought`} />
        <Stat label="Leads delivered" value={user.leadsDelivered.toLocaleString()} sub="pulled from your data" />
        <Stat label="Active subs" value={String(user.activeSubscriptions)} sub="ZIP recurring" />
      </div>

      {/* Past grants */}
      {user.recentGrants.length > 0 && (
        <div className="mt-5">
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Recent admin grants
          </div>
          <ul className="mt-2 space-y-1.5 text-xs">
            {user.recentGrants.map((g, i) => (
              <li
                key={i}
                className="flex flex-wrap items-baseline gap-2 rounded border px-2.5 py-1.5"
                style={{ borderColor: "var(--line)" }}
              >
                <span
                  className="font-bold tabular-nums"
                  style={{ color: g.amount >= 0 ? "var(--pos)" : "var(--neg)" }}
                >
                  {g.amount >= 0 ? "+" : ""}
                  {fmtUsd(g.amount)}
                </span>
                <span style={{ color: "var(--muted)" }}>· {fmtDate(g.createdAt)}</span>
                {g.description && <span style={{ color: "var(--ink)" }}>· {g.description}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Grant form */}
      {user.walletId && (
        <form action={grantCreditsToUserAction} className="mt-5 flex flex-col gap-2 border-t pt-4" style={{ borderColor: "var(--line)" }}>
          <input type="hidden" name="userId" value={user.id} />
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-col">
              <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                Dollar amount
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                placeholder="50"
                required
                className="input"
                style={{ width: 140 }}
              />
              <div className="mt-1 text-[10px]" style={{ color: "var(--muted-2)" }}>
                negative = claw back
              </div>
            </div>
            <div className="flex flex-1 flex-col">
              <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                Note (audit reason)
              </label>
              <input
                name="note"
                placeholder='e.g., "testing CRM flow" / "comped after support ticket"'
                required
                className="input"
              />
            </div>
            <div className="flex items-end">
              <button className="btn btn-primary">Grant to {user.email} →</button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{
        borderColor: "var(--line)",
        background: accent ? "color-mix(in srgb, var(--color-accent) 8%, transparent)" : "var(--surface)",
      }}
    >
      <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        {label}
      </div>
      <div className="mt-0.5 text-lg font-extrabold tabular-nums">{value}</div>
      {sub && (
        <div className="text-[10px]" style={{ color: "var(--muted-2)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}
