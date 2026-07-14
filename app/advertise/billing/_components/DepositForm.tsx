"use client";
/**
 * Deposit form — client component.
 *
 * POSTs to /api/advertiser/deposit. On `stripe` mode, navigates to the
 * Checkout URL. On `manual` mode, shows the message inline (god needs to
 * manually confirm the deposit). Surfaces `below_minimum` errors from the API.
 */
import { useState } from "react";
import { MIN_DEPOSIT_CENTS } from "@/src/advertiser/constants";

const COLORS = {
  ink: "#FFFFFF",
  ink2: "#E5E7EB",
  ink3: "#A1A1AA",
  ink4: "#6B7280",
  accent: "#FF6B35",
  sky: "#0EA5E9",
  rose: "#F43F5E",
  surface2: "rgba(255,255,255,0.04)",
  surface3: "rgba(255,255,255,0.06)",
  hairline2: "rgba(255,255,255,0.16)",
};

const MIN_DOLLARS = MIN_DEPOSIT_CENTS / 100;

export function DepositForm() {
  const [amount, setAmount] = useState(String(MIN_DOLLARS));
  const [pending, setPending] = useState(false);
  const [manualMessage, setManualMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dollars = Number(amount);
  const invalid = !Number.isFinite(dollars) || dollars < MIN_DOLLARS;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (invalid) {
      setError(`Minimum deposit is $${MIN_DOLLARS.toLocaleString("en-US")}.`);
      return;
    }
    setPending(true);
    setError(null);
    setManualMessage(null);
    try {
      const res = await fetch("/api/advertiser/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: Math.round(dollars * 100) }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        mode?: "stripe" | "manual";
        url?: string;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Deposit failed. Try again.");
        return;
      }
      if (data.mode === "stripe" && data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.mode === "manual") {
        setManualMessage(data.message ?? "Manual deposit requested.");
        return;
      }
      setError("Unexpected response from the deposit endpoint.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label
        className="mb-1 block text-[11px] font-bold uppercase tracking-wider"
        style={{ color: COLORS.ink3 }}
      >
        Amount (USD)
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex items-center gap-2 rounded-xl border px-3 py-2"
          style={{
            borderColor: invalid ? COLORS.rose : COLORS.hairline2,
            background: COLORS.surface2,
          }}
        >
          <span style={{ color: COLORS.ink3 }}>$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={MIN_DOLLARS}
            step="100"
            className="bg-transparent outline-none"
            style={{ color: COLORS.ink, width: 160, fontSize: 16 }}
          />
        </div>
        <button
          type="submit"
          disabled={pending || invalid}
          className="rounded-full px-5 py-2.5 text-sm font-bold disabled:opacity-60"
          style={{
            background: COLORS.accent,
            color: COLORS.ink,
            boxShadow: `0 12px 32px ${COLORS.accent}40`,
          }}
        >
          {pending ? "Starting…" : "Deposit"}
        </button>
      </div>
      <div className="text-[11px]" style={{ color: COLORS.ink4 }}>
        Minimum deposit ${MIN_DOLLARS.toLocaleString("en-US")}. We&rsquo;ll redirect you to
        Stripe Checkout when configured; otherwise we&rsquo;ll send a manual invoice.
      </div>

      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm font-semibold"
          style={{
            background: `${COLORS.rose}1c`,
            color: COLORS.rose,
            border: `1px solid ${COLORS.rose}55`,
          }}
        >
          {error}
        </div>
      )}
      {manualMessage && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: `${COLORS.sky}1c`,
            color: COLORS.ink2,
            border: `1px solid ${COLORS.sky}55`,
          }}
        >
          {manualMessage}
        </div>
      )}
    </form>
  );
}

export default DepositForm;
