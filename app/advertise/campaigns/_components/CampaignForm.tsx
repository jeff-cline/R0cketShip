"use client";
/**
 * Shared campaign form — used by both /campaigns/new and /campaigns/[id].
 *
 * - Client component because we run a debounced reach estimator via fetch as
 *   the operator tweaks filters. Form submit hits a server action passed in
 *   via props (`action`).
 * - The $5 CPA floor is enforced client-side for UX; the server action and
 *   the underlying module re-enforce server-side.
 * - HTML body is plain textarea for now — DOMPurify sanitization happens
 *   server-side in `sanitizeEmailHtml`.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { MIN_CPA_CENTS } from "@/src/advertiser/constants";
import type { TargetingFilters, Segment, AgeTier } from "@/src/advertiser/targeting";

const COLORS = {
  bg: "#050608",
  surface: "rgba(255,255,255,0.025)",
  surface2: "rgba(255,255,255,0.04)",
  surface3: "rgba(255,255,255,0.06)",
  ink: "#FFFFFF",
  ink2: "#E5E7EB",
  ink3: "#A1A1AA",
  ink4: "#6B7280",
  accent: "#FF6B35",
  accentDim: "rgba(255,107,53,0.16)",
  sky: "#0EA5E9",
  rose: "#F43F5E",
  hairline: "rgba(255,255,255,0.08)",
  hairline2: "rgba(255,255,255,0.16)",
};

const MIN_CPA_DOLLARS = MIN_CPA_CENTS / 100;

const SEGMENT_OPTIONS: Array<{ value: Segment; label: string }> = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
];

const AGE_TIER_OPTIONS: Array<{ value: AgeTier; label: string }> = [
  { value: "real_time", label: "Real-time (<24h)" },
  { value: "one_week", label: "1 week" },
  { value: "thirty_day", label: "30 day" },
  { value: "older", label: "Older / unknown" },
];

export interface CampaignFormInitial {
  name: string;
  emailSubject: string;
  emailBodyHtml: string;
  ctaUrl: string;
  ctaLabel: string;
  maxCpaDollars: string;
  dailyBudgetDollars: string;
  filters: TargetingFilters;
}

export interface NicheOption {
  value: string;
  label: string;
}

export interface StateOption {
  code: string;
  name: string;
}

export interface CampaignFormProps {
  /**
   * Server action bound to either create or update. Receives FormData.
   * We expose a regular `action` instead of useTransition so Next can run the
   * action with progressive-enhancement (form works even without JS).
   */
  action: (formData: FormData) => void | Promise<void>;
  initial: CampaignFormInitial;
  submitLabel: string;
  mode: "create" | "edit";
  error?: string;
  saved?: boolean;
  /** Loaded server-side from `listNiches()` — populates the niches dropdown. */
  availableNiches: NicheOption[];
  /** Loaded server-side from `US_STATES`. */
  usStates: StateOption[];
}

type ZipMode = "nationwide" | "by_state" | "by_zip";
type NicheMode = "ron" | "specific";

export function CampaignForm({
  action,
  initial,
  submitLabel,
  mode,
  error,
  saved,
  availableNiches,
  usStates,
}: CampaignFormProps) {
  const [name, setName] = useState(initial.name);
  const [emailSubject, setEmailSubject] = useState(initial.emailSubject);
  const [emailBodyHtml, setEmailBodyHtml] = useState(initial.emailBodyHtml);
  const [ctaUrl, setCtaUrl] = useState(initial.ctaUrl);
  const [ctaLabel, setCtaLabel] = useState(initial.ctaLabel);
  const [maxCpaDollars, setMaxCpaDollars] = useState(initial.maxCpaDollars);
  const [dailyBudgetDollars, setDailyBudgetDollars] = useState(initial.dailyBudgetDollars);

  // Targeting state. Two extra UX layers:
  //  - zipMode: nationwide / by-state / by-zip — controls which inputs render
  //  - nicheMode: ron (run of network) / specific — multi-select dropdown
  const initialZipMode: ZipMode = (initial.filters.zip ?? []).length
    ? "by_zip"
    : (initial.filters.states ?? []).length
      ? "by_state"
      : "nationwide";
  const initialNicheMode: NicheMode = (initial.filters.niches ?? []).length ? "specific" : "ron";

  const [zipMode, setZipMode] = useState<ZipMode>(initialZipMode);
  const [zip, setZip] = useState((initial.filters.zip ?? []).join(", "));
  const [states, setStates] = useState<Set<string>>(
    new Set((initial.filters.states ?? []).map((s) => s.toUpperCase())),
  );
  const [segments, setSegments] = useState<Set<Segment>>(
    new Set(initial.filters.segments ?? []),
  );
  const [ageTiers, setAgeTiers] = useState<Set<AgeTier>>(
    new Set(initial.filters.age_tiers ?? []),
  );
  const [nicheMode, setNicheMode] = useState<NicheMode>(initialNicheMode);
  const [selectedNiches, setSelectedNiches] = useState<Set<string>>(
    new Set((initial.filters.niches ?? []).map((s) => s.toLowerCase())),
  );
  const [incomeMin, setIncomeMin] = useState(
    initial.filters.income_min != null && initial.filters.income_min > 0
      ? String(initial.filters.income_min)
      : "",
  );
  const [incomeMax, setIncomeMax] = useState(
    initial.filters.income_max != null && initial.filters.income_max > 0
      ? String(initial.filters.income_max)
      : "",
  );

  // Reach estimate
  const [reachCount, setReachCount] = useState<number | null>(null);
  const [reachLoading, setReachLoading] = useState(false);
  const reachTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filterPayload = useMemo<TargetingFilters>(() => {
    const out: Record<string, unknown> = {};
    if (zipMode === "by_zip") {
      const zipList = zip.split(",").map((s) => s.trim()).filter(Boolean);
      if (zipList.length) out.zip = zipList;
    } else if (zipMode === "by_state") {
      if (states.size) out.states = Array.from(states);
    }
    // zipMode === "nationwide" → no zip/state filter (full network)
    if (segments.size) out.segments = Array.from(segments);
    if (ageTiers.size) out.age_tiers = Array.from(ageTiers);
    if (nicheMode === "specific" && selectedNiches.size) {
      out.niches = Array.from(selectedNiches);
    }
    // nicheMode === "ron" → no niches filter (run of network)
    const minNum = Number(incomeMin);
    if (incomeMin.trim() && Number.isFinite(minNum) && minNum > 0) out.income_min = minNum;
    const maxNum = Number(incomeMax);
    if (incomeMax.trim() && Number.isFinite(maxNum) && maxNum > 0) out.income_max = maxNum;
    return out as TargetingFilters;
  }, [zipMode, zip, states, segments, ageTiers, nicheMode, selectedNiches, incomeMin, incomeMax]);

  useEffect(() => {
    // Debounce 350ms so each keystroke doesn't fire a fetch.
    if (reachTimer.current) clearTimeout(reachTimer.current);
    reachTimer.current = setTimeout(() => {
      let cancelled = false;
      setReachLoading(true);
      (async () => {
        try {
          const res = await fetch("/api/advertiser/reach-estimate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filters: filterPayload }),
          });
          if (!res.ok) throw new Error(`reach ${res.status}`);
          const data = (await res.json()) as { count: number };
          if (!cancelled) setReachCount(data.count);
        } catch {
          if (!cancelled) setReachCount(null);
        } finally {
          if (!cancelled) setReachLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, 350);
    return () => {
      if (reachTimer.current) clearTimeout(reachTimer.current);
    };
  }, [filterPayload]);

  const cpaNum = Number(maxCpaDollars);
  const cpaInvalid = !Number.isFinite(cpaNum) || cpaNum < MIN_CPA_DOLLARS;

  const toggleSegment = (s: Segment) => {
    setSegments((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };
  const toggleTier = (t: AgeTier) => {
    setAgeTiers((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  return (
    <form action={action} className="space-y-8">
      {/* Banner */}
      <div
        className="rounded-xl border p-4 text-sm"
        style={{
          borderColor: COLORS.hairline2,
          background: `linear-gradient(90deg, ${COLORS.accentDim}, transparent)`,
          color: COLORS.ink2,
        }}
      >
        <strong style={{ color: COLORS.accent }}>We optimize to your CPA.</strong>{" "}
        The fewer filters, the more options we have to deliver. Use filters when you know
        your customer better than us — and we&rsquo;ll honor them.
      </div>

      {/* Saved/Error banners */}
      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm font-semibold"
          style={{ background: `${COLORS.rose}1c`, color: COLORS.rose, border: `1px solid ${COLORS.rose}55` }}
        >
          {formatError(error)}
        </div>
      )}
      {saved && (
        <div
          className="rounded-lg px-4 py-3 text-sm font-semibold"
          style={{
            background: `${COLORS.sky}1c`,
            color: COLORS.sky,
            border: `1px solid ${COLORS.sky}55`,
          }}
        >
          Saved.
        </div>
      )}

      {/* Basics */}
      <Section title="Creative">
        <Field label="Campaign name" required>
          <input
            type="text"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
          />
        </Field>
        <Field label="Email subject line" required>
          <input
            type="text"
            name="emailSubject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            required
            style={inputStyle}
          />
        </Field>
        <Field label="Email body (HTML)" hint="Sanitized server-side. Plain HTML is fine.">
          <textarea
            name="emailBodyHtml"
            value={emailBodyHtml}
            onChange={(e) => setEmailBodyHtml(e.target.value)}
            rows={10}
            style={{ ...inputStyle, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13 }}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="CTA URL" required>
            <input
              type="url"
              name="ctaUrl"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              required
              placeholder="https://example.com/landing"
              style={inputStyle}
            />
          </Field>
          <Field label="CTA label">
            <input
              type="text"
              name="ctaLabel"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="Learn more"
              style={inputStyle}
            />
          </Field>
        </div>
      </Section>

      {/* Pricing */}
      <Section title="Pricing">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label={`Max CPA (USD)${cpaInvalid ? " — min $5" : ""}`}
            required
            hint={`We charge at most this much per click. Floor: $${MIN_CPA_DOLLARS.toFixed(2)}.`}
          >
            <input
              type="number"
              name="maxCpaDollars"
              value={maxCpaDollars}
              onChange={(e) => setMaxCpaDollars(e.target.value)}
              step="0.01"
              min={MIN_CPA_DOLLARS}
              required
              style={{
                ...inputStyle,
                borderColor: cpaInvalid ? COLORS.rose : COLORS.hairline2,
              }}
            />
          </Field>
          <Field
            label="Daily budget (USD)"
            hint="Optional. We pause when today's spend would exceed this."
          >
            <input
              type="number"
              name="dailyBudgetDollars"
              value={dailyBudgetDollars}
              onChange={(e) => setDailyBudgetDollars(e.target.value)}
              step="0.01"
              min={0}
              placeholder="Leave blank for no cap"
              style={inputStyle}
            />
          </Field>
        </div>
      </Section>

      {/* Targeting */}
      <Section title="Targeting filters" subtitle="Fewer filters = more delivery options. We honor what you set.">
        <Field
          label="Geography"
          hint="We optimize delivery against any mix. Pick how broad to cast the net."
        >
          <div className="flex flex-wrap gap-2">
            {[
              { value: "nationwide" as ZipMode, label: "Nationwide (run of network)" },
              { value: "by_state" as ZipMode, label: "By state" },
              { value: "by_zip" as ZipMode, label: "By ZIP codes" },
            ].map((opt) => {
              const checked = zipMode === opt.value;
              return (
                <label
                  key={opt.value}
                  className="cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    borderColor: checked ? COLORS.accent : COLORS.hairline2,
                    background: checked ? COLORS.accentDim : COLORS.surface2,
                    color: checked ? COLORS.accent : COLORS.ink2,
                  }}
                >
                  <input
                    type="radio"
                    name="zipMode"
                    value={opt.value}
                    checked={checked}
                    onChange={() => setZipMode(opt.value)}
                    style={{ display: "none" }}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
          {zipMode === "by_zip" && (
            <div className="mt-3">
              <input
                type="text"
                name="zip"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="75201, 75202, 75203"
                style={inputStyle}
              />
              <div className="mt-1 text-[11px]" style={{ color: COLORS.ink4 }}>
                Comma-separated 5-digit ZIPs.
              </div>
            </div>
          )}
          {zipMode === "by_state" && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1.5">
                {usStates.map((s) => {
                  const checked = states.has(s.code);
                  return (
                    <label
                      key={s.code}
                      title={s.name}
                      className="cursor-pointer rounded-md border px-2 py-1 text-xs font-semibold tabular-nums"
                      style={{
                        borderColor: checked ? COLORS.accent : COLORS.hairline2,
                        background: checked ? COLORS.accentDim : COLORS.surface2,
                        color: checked ? COLORS.accent : COLORS.ink2,
                      }}
                    >
                      <input
                        type="checkbox"
                        name="states"
                        value={s.code}
                        checked={checked}
                        onChange={() =>
                          setStates((prev) => {
                            const next = new Set(prev);
                            if (next.has(s.code)) next.delete(s.code);
                            else next.add(s.code);
                            return next;
                          })
                        }
                        style={{ display: "none" }}
                      />
                      {s.code}
                    </label>
                  );
                })}
              </div>
              <div className="mt-2 text-[11px]" style={{ color: COLORS.ink4 }}>
                Click state codes to toggle. {states.size === 0 ? "None selected — pick one or more." : `${states.size} state${states.size === 1 ? "" : "s"} selected.`}
              </div>
            </div>
          )}
          {zipMode === "nationwide" && (
            <div className="mt-2 text-[11px]" style={{ color: COLORS.ink4 }}>
              We&rsquo;ll deliver to every ZIP we have inventory in. The optimizer routes against your CPA and other targeting filters.
            </div>
          )}
        </Field>

        <Field label="Segments" hint="Leave both blank for any.">
          <div className="flex flex-wrap gap-2">
            {SEGMENT_OPTIONS.map((opt) => {
              const checked = segments.has(opt.value);
              return (
                <label
                  key={opt.value}
                  className="cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    borderColor: checked ? COLORS.accent : COLORS.hairline2,
                    background: checked ? COLORS.accentDim : COLORS.surface2,
                    color: checked ? COLORS.accent : COLORS.ink2,
                  }}
                >
                  <input
                    type="checkbox"
                    name="segments"
                    value={opt.value}
                    checked={checked}
                    onChange={() => toggleSegment(opt.value)}
                    style={{ display: "none" }}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </Field>

        <Field label="Age tiers (last_updated freshness)" hint="Leave all blank for any.">
          <div className="flex flex-wrap gap-2">
            {AGE_TIER_OPTIONS.map((opt) => {
              const checked = ageTiers.has(opt.value);
              return (
                <label
                  key={opt.value}
                  className="cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    borderColor: checked ? COLORS.accent : COLORS.hairline2,
                    background: checked ? COLORS.accentDim : COLORS.surface2,
                    color: checked ? COLORS.accent : COLORS.ink2,
                  }}
                >
                  <input
                    type="checkbox"
                    name="age_tiers"
                    value={opt.value}
                    checked={checked}
                    onChange={() => toggleTier(opt.value)}
                    style={{ display: "none" }}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </Field>

        <Field
          label="Niches"
          hint="Run of network = blast every niche we have. Pick specific niches if you know who your customer is."
        >
          <div className="flex flex-wrap gap-2">
            {[
              { value: "ron" as NicheMode, label: "Run of network (all niches)" },
              { value: "specific" as NicheMode, label: "Specific niches" },
            ].map((opt) => {
              const checked = nicheMode === opt.value;
              return (
                <label
                  key={opt.value}
                  className="cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    borderColor: checked ? COLORS.accent : COLORS.hairline2,
                    background: checked ? COLORS.accentDim : COLORS.surface2,
                    color: checked ? COLORS.accent : COLORS.ink2,
                  }}
                >
                  <input
                    type="radio"
                    name="nicheMode"
                    value={opt.value}
                    checked={checked}
                    onChange={() => setNicheMode(opt.value)}
                    style={{ display: "none" }}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
          {nicheMode === "specific" && (
            <div className="mt-3">
              {availableNiches.length === 0 ? (
                <div className="text-[11px]" style={{ color: COLORS.ink4 }}>
                  No active niches in the network yet — choose &quot;Run of network&quot; for now.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {availableNiches.map((n) => {
                    const checked = selectedNiches.has(n.value);
                    return (
                      <label
                        key={n.value}
                        className="cursor-pointer rounded-md border px-2.5 py-1.5 text-xs font-semibold"
                        style={{
                          borderColor: checked ? COLORS.accent : COLORS.hairline2,
                          background: checked ? COLORS.accentDim : COLORS.surface2,
                          color: checked ? COLORS.accent : COLORS.ink2,
                        }}
                      >
                        <input
                          type="checkbox"
                          name="niches"
                          value={n.value}
                          checked={checked}
                          onChange={() =>
                            setSelectedNiches((prev) => {
                              const next = new Set(prev);
                              if (next.has(n.value)) next.delete(n.value);
                              else next.add(n.value);
                              return next;
                            })
                          }
                          style={{ display: "none" }}
                        />
                        {n.label}
                      </label>
                    );
                  })}
                </div>
              )}
              <div className="mt-2 text-[11px]" style={{ color: COLORS.ink4 }}>
                {selectedNiches.size === 0 ? "Pick at least one — or switch to run of network." : `${selectedNiches.size} niche${selectedNiches.size === 1 ? "" : "s"} selected.`}
              </div>
            </div>
          )}
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Income min (USD/yr)">
            <input
              type="number"
              name="income_min"
              value={incomeMin}
              onChange={(e) => setIncomeMin(e.target.value)}
              step="1000"
              min={0}
              placeholder=""
              style={inputStyle}
            />
          </Field>
          <Field label="Income max (USD/yr)">
            <input
              type="number"
              name="income_max"
              value={incomeMax}
              onChange={(e) => setIncomeMax(e.target.value)}
              step="1000"
              min={0}
              placeholder=""
              style={inputStyle}
            />
          </Field>
        </div>

        {/* Reach estimate */}
        <div
          className="mt-4 rounded-xl border p-4"
          style={{
            borderColor: COLORS.hairline2,
            background: COLORS.surface3,
          }}
        >
          <div
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: COLORS.ink3 }}
          >
            Estimated reach
          </div>
          <div
            className="mt-1 text-3xl font-black tabular-nums"
            style={{ color: reachCount === 0 ? COLORS.accent : COLORS.sky, letterSpacing: "-0.02em" }}
          >
            {reachLoading
              ? "…"
              : reachCount === null
                ? "—"
                : reachCount === 0
                  ? "Predictive delivery"
                  : `~${reachCount.toLocaleString("en-US")} leads`}
          </div>
          <div className="mt-1 text-xs leading-relaxed" style={{ color: COLORS.ink3 }}>
            {reachCount === 0 ? (
              <>
                No <strong style={{ color: COLORS.ink }}>real-time</strong> leads match those filters as of today —
                that&rsquo;s normal. Your ad queues against the <strong style={{ color: COLORS.ink }}>predictive</strong> data
                stack, and we only charge your wallet when someone actually clicks your CTA at the CPA you set.
                Loosen filters (or switch to nationwide / run of network) to see real-time inventory rise.
              </>
            ) : (
              <>Live count across the matched pool. Cached 60s server-side. We deliver against predictive matches over time — you only pay for clicks at your CPA.</>
            )}
          </div>
        </div>
      </Section>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-full px-6 py-3 text-base font-bold disabled:opacity-60"
          style={{
            background: COLORS.accent,
            color: COLORS.ink,
            boxShadow: `0 12px 32px ${COLORS.accent}40`,
          }}
          disabled={cpaInvalid}
        >
          {submitLabel}
        </button>
        {mode === "create" ? (
          <a
            href="/advertise/campaigns"
            className="text-sm font-semibold"
            style={{ color: COLORS.ink3 }}
          >
            Cancel
          </a>
        ) : null}
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: COLORS.surface2,
  color: COLORS.ink,
  border: `1px solid ${COLORS.hairline2}`,
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
};

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border p-6"
      style={{ borderColor: COLORS.hairline, background: COLORS.surface }}
    >
      <h2
        className="text-lg font-black"
        style={{ color: COLORS.ink, letterSpacing: "-0.01em" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 text-xs" style={{ color: COLORS.ink3 }}>
          {subtitle}
        </p>
      )}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block text-xs font-bold uppercase tracking-wider"
        style={{ color: COLORS.ink3 }}
      >
        {label}
        {required && <span style={{ color: COLORS.accent, marginLeft: 4 }}>*</span>}
      </label>
      {children}
      {hint && (
        <div className="mt-1 text-[11px]" style={{ color: COLORS.ink4 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function formatError(code: string): string {
  switch (code) {
    case "name_required":
      return "Campaign name is required.";
    case "subject_required":
      return "Email subject is required.";
    case "cta_url_required":
      return "CTA URL is required.";
    case "cta_url_invalid":
      return "CTA URL is not a valid URL.";
    case "cpa_below_minimum":
      return `Max CPA must be at least $${MIN_CPA_DOLLARS.toFixed(2)}.`;
    default:
      return code;
  }
}

export default CampaignForm;
