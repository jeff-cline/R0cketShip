"use client";
import { useActionState } from "react";
import { signUpAdvertiserAction, type SignupActionState } from "./actions";

const COLORS = {
  bg: "#050608",
  surface: "rgba(255,255,255,0.025)",
  surface2: "rgba(255,255,255,0.04)",
  ink: "#FFFFFF",
  ink2: "#E5E7EB",
  ink3: "#A1A1AA",
  ink4: "#6B7280",
  accent: "#FF6B35",
  hairline: "rgba(255,255,255,0.08)",
  hairline2: "rgba(255,255,255,0.16)",
  neg: "#F87171",
};

const EMPLOYEE_BANDS = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;
const REVENUE_BANDS = ["<$1M", "$1M-$5M", "$5M-$25M", "$25M-$100M", "$100M+"] as const;
const OWNERSHIP_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "government", label: "Government" },
] as const;
const KPI_OPTIONS = [
  { value: "booking", label: "Booking" },
  { value: "order", label: "Order" },
  { value: "sale", label: "Sale" },
  { value: "site_visit", label: "Site visit" },
  { value: "other", label: "Other" },
] as const;

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: COLORS.surface2,
  border: `1px solid ${COLORS.hairline2}`,
  color: COLORS.ink,
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.04em",
  color: COLORS.ink2,
  marginBottom: 6,
  textTransform: "uppercase",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.32em",
  color: COLORS.accent,
  textTransform: "uppercase",
  marginBottom: 4,
};

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: COLORS.accent, marginLeft: 4 }}>*</span>}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 11, color: COLORS.ink4, marginTop: 4 }}>{hint}</p>
      )}
    </div>
  );
}

function Section({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: `1px solid ${COLORS.hairline}`,
        background: COLORS.surface,
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
      }}
    >
      <div style={sectionTitleStyle}>{kicker}</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: COLORS.ink, marginBottom: 18, letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      <div style={{ display: "grid", gap: 16 }}>{children}</div>
    </div>
  );
}

export function SignupForm({ offer, refCode }: { offer: string; refCode: string }) {
  const [state, action, pending] = useActionState<SignupActionState, FormData>(
    signUpAdvertiserAction,
    { error: null },
  );

  const offerHeading =
    offer === "strategic-partner"
      ? "Apply as a strategic partner"
      : "Create your advertiser account";
  const offerSubheading =
    offer === "strategic-partner"
      ? "One strategic partner per industry. Tell us about your business."
      : "Pay only for success. Tell us about your business — we'll send a verification link.";

  return (
    <form action={action} style={{ display: "block" }}>
      {/* Hidden programmatic fields */}
      <input type="hidden" name="offer" value={offer} />
      <input type="hidden" name="ref" value={refCode} />

      <div style={{ marginBottom: 24 }}>
        <div style={sectionTitleStyle}>Sign up · #ARTLAB</div>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: COLORS.ink,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          {offerHeading}
        </h1>
        <p style={{ color: COLORS.ink2, marginTop: 12, fontSize: 16, lineHeight: 1.55 }}>
          {offerSubheading}
        </p>
      </div>

      {state?.error && (
        <div
          style={{
            border: `1px solid ${COLORS.neg}`,
            background: "rgba(248,113,113,0.08)",
            color: COLORS.neg,
            padding: "12px 14px",
            borderRadius: 10,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {state.error}
        </div>
      )}

      <Section kicker="Step 01" title="Account">
        <Field label="Email" required>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            style={inputStyle}
          />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Password" required hint="8+ characters">
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              style={inputStyle}
            />
          </Field>
          <Field label="Confirm password" required>
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              style={inputStyle}
            />
          </Field>
        </div>
        <Field label="Display name (optional)">
          <input name="displayName" type="text" placeholder="How we should address you" style={inputStyle} />
        </Field>
      </Section>

      <Section kicker="Step 02" title="Business identity">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Phone" required>
            <input name="phone" type="tel" required placeholder="+1 (555) 555-5555" style={inputStyle} />
          </Field>
          <Field label="Business name" required>
            <input name="businessName" type="text" required placeholder="Acme Co." style={inputStyle} />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Business URL">
            <input name="businessUrl" type="url" placeholder="https://acme.com" style={inputStyle} />
          </Field>
          <Field label="Industry">
            <input name="industry" type="text" placeholder="e.g. Solar, HVAC, Insurance" style={inputStyle} />
          </Field>
        </div>
        <Field label="Employee count">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {EMPLOYEE_BANDS.map((band) => (
              <label
                key={band}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 12px",
                  border: `1px solid ${COLORS.hairline2}`,
                  borderRadius: 999,
                  background: COLORS.surface2,
                  color: COLORS.ink2,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <input type="radio" name="employeeCountBand" value={band} style={{ accentColor: COLORS.accent }} />
                {band}
              </label>
            ))}
          </div>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Annual revenue">
            <select name="annualRevenueBand" style={inputStyle} defaultValue="">
              <option value="">Select…</option>
              {REVENUE_BANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Years in business">
            <input name="yearsInBusiness" type="number" min={0} placeholder="0" style={inputStyle} />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="DUNS number (optional)">
            <input name="dunsNumber" type="text" placeholder="00-000-0000" style={inputStyle} />
          </Field>
          <Field label="Ownership type">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {OWNERSHIP_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 12px",
                    border: `1px solid ${COLORS.hairline2}`,
                    borderRadius: 999,
                    background: COLORS.surface2,
                    color: COLORS.ink2,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  <input type="radio" name="ownershipType" value={o.value} style={{ accentColor: COLORS.accent }} />
                  {o.label}
                </label>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      <Section kicker="Step 03" title="Economics & campaign intent">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Customer LTV (USD, optional)" hint="Lifetime value of a typical customer">
            <input name="customerLtv" type="text" inputMode="decimal" placeholder="$5,000" style={inputStyle} />
          </Field>
          <Field label="Typical CAC (USD, optional)" hint="Current customer acquisition cost">
            <input name="typicalCac" type="text" inputMode="decimal" placeholder="$250" style={inputStyle} />
          </Field>
        </div>
        <Field label="Target KPI">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {KPI_OPTIONS.map((k) => (
              <label
                key={k.value}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 12px",
                  border: `1px solid ${COLORS.hairline2}`,
                  borderRadius: 999,
                  background: COLORS.surface2,
                  color: COLORS.ink2,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <input type="radio" name="targetKpi" value={k.value} style={{ accentColor: COLORS.accent }} />
                {k.label}
              </label>
            ))}
          </div>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Target geography">
            <input
              name="targetGeography"
              type="text"
              placeholder="e.g. Texas, NYC metro, US nationwide"
              style={inputStyle}
            />
          </Field>
          <Field label="Monthly ad budget (USD)">
            <input
              name="monthlyAdBudget"
              type="text"
              inputMode="decimal"
              placeholder="$10,000"
              style={inputStyle}
            />
          </Field>
        </div>
        <Field label="Where did you hear about us?">
          <input name="referralSource" type="text" placeholder="Friend, search, podcast…" style={inputStyle} />
        </Field>
        <Field label="About your business">
          <textarea
            name="aboutBusiness"
            rows={5}
            placeholder="What do you sell? Who's your customer? What does success look like?"
            style={{ ...inputStyle, resize: "vertical", minHeight: 100, fontFamily: "inherit" }}
          />
        </Field>
      </Section>

      <div
        style={{
          border: `1px solid ${COLORS.hairline}`,
          background: COLORS.surface,
          borderRadius: 16,
          padding: 24,
          marginBottom: 16,
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            color: COLORS.ink2,
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          <input
            type="checkbox"
            name="tos"
            required
            style={{ accentColor: COLORS.accent, marginTop: 3, flexShrink: 0 }}
          />
          <span>
            I acknowledge: <strong style={{ color: COLORS.ink }}>no refunds on deposits</strong>, r0cketship may{" "}
            <strong style={{ color: COLORS.ink }}>pause or reject content</strong>, my CPA is a{" "}
            <strong style={{ color: COLORS.ink }}>maximum not a guarantee</strong>, and I am responsible for the legality
            of my CTA destination.
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        style={{
          width: "100%",
          background: COLORS.accent,
          color: COLORS.ink,
          fontWeight: 800,
          fontSize: 16,
          padding: "14px 20px",
          borderRadius: 999,
          border: "none",
          cursor: pending ? "not-allowed" : "pointer",
          opacity: pending ? 0.7 : 1,
          boxShadow: `0 12px 32px ${COLORS.accent}40`,
        }}
      >
        {pending ? "Submitting…" : "Create account & send verification →"}
      </button>

      <p style={{ marginTop: 16, fontSize: 13, color: COLORS.ink3, textAlign: "center" }}>
        Already verified?{" "}
        <a href="/advertise/login" style={{ color: COLORS.accent, fontWeight: 700 }}>
          Sign in
        </a>
      </p>
    </form>
  );
}
