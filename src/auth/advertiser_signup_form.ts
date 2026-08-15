/**
 * Form parsing + validation helpers for `/advertise/signup`.
 *
 * Kept in `src/auth/` so the server action remains thin. All field parsing,
 * dollar→cents normalization, and enum coercion live here so the action can
 * focus on orchestration (guards → create → intake → referral → email).
 */
// Mirrors of the pgEnum string-literal unions defined in `src/db/schema.ts`.
// Kept inline so this helper has no dependency on Drizzle's enum runtime shape.
type OfferPath = "pay_for_success" | "strategic_partner";
type OwnershipType = "public" | "private" | "nonprofit" | "government";
type TargetKpi = "booking" | "order" | "sale" | "site_visit" | "other";

const EMPLOYEE_BANDS = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;
const REVENUE_BANDS = ["<$1M", "$1M-$5M", "$5M-$25M", "$25M-$100M", "$100M+"] as const;
const OWNERSHIP_TYPES: OwnershipType[] = ["public", "private", "nonprofit", "government"];
const TARGET_KPIS: TargetKpi[] = ["booking", "order", "sale", "site_visit", "other"];

/** Map `?offer=pay-for-success` / `?offer=strategic-partner` → enum value. */
export function parseOfferPath(raw: string | null | undefined): OfferPath {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "strategic-partner" || v === "strategic_partner") return "strategic_partner";
  // Default to pay_for_success for missing/unknown so a stray bad URL still funnels.
  return "pay_for_success";
}

/** Strip "$", ",", and whitespace, then parse dollars → integer cents. Null if blank or non-numeric. */
export function parseDollarsToCents(raw: FormDataEntryValue | null): number | null {
  if (raw == null) return null;
  const s = String(raw).replace(/[$,\s]/g, "");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function parseIntOrNull(raw: FormDataEntryValue | null): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function str(raw: FormDataEntryValue | null): string {
  return raw == null ? "" : String(raw).trim();
}

function strOrNull(raw: FormDataEntryValue | null): string | null {
  const v = str(raw);
  return v ? v : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ParsedSignup {
  // Account
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string | null;
  // Business identity
  phone: string;
  businessName: string;
  businessUrl: string | null;
  industry: string | null;
  employeeCountBand: string | null;
  annualRevenueBand: string | null;
  yearsInBusiness: number | null;
  dunsNumber: string | null;
  ownershipType: OwnershipType | null;
  // Economics + campaign intent
  customerLtvCents: number | null;
  typicalCacCents: number | null;
  targetKpi: TargetKpi | null;
  targetGeographyText: string | null;
  monthlyAdBudgetCents: number | null;
  referralSource: string | null;
  aboutBusiness: string | null;
  // Programmatic
  offerPath: OfferPath;
  refCode: string | null;
  tosAccepted: boolean;
}

export function parseSignupForm(fd: FormData): ParsedSignup {
  const employeeBand = str(fd.get("employeeCountBand"));
  const revenueBand = str(fd.get("annualRevenueBand"));
  const ownership = str(fd.get("ownershipType")).toLowerCase();
  const kpi = str(fd.get("targetKpi")).toLowerCase();

  return {
    email: str(fd.get("email")).toLowerCase(),
    password: str(fd.get("password")),
    confirmPassword: str(fd.get("confirmPassword")),
    displayName: strOrNull(fd.get("displayName")),
    phone: str(fd.get("phone")),
    businessName: str(fd.get("businessName")),
    businessUrl: strOrNull(fd.get("businessUrl")),
    industry: strOrNull(fd.get("industry")),
    employeeCountBand: (EMPLOYEE_BANDS as readonly string[]).includes(employeeBand) ? employeeBand : null,
    annualRevenueBand: (REVENUE_BANDS as readonly string[]).includes(revenueBand) ? revenueBand : null,
    yearsInBusiness: parseIntOrNull(fd.get("yearsInBusiness")),
    dunsNumber: strOrNull(fd.get("dunsNumber")),
    ownershipType: (OWNERSHIP_TYPES as readonly string[]).includes(ownership)
      ? (ownership as OwnershipType)
      : null,
    customerLtvCents: parseDollarsToCents(fd.get("customerLtv")),
    typicalCacCents: parseDollarsToCents(fd.get("typicalCac")),
    targetKpi: (TARGET_KPIS as readonly string[]).includes(kpi) ? (kpi as TargetKpi) : null,
    targetGeographyText: strOrNull(fd.get("targetGeography")),
    monthlyAdBudgetCents: parseDollarsToCents(fd.get("monthlyAdBudget")),
    referralSource: strOrNull(fd.get("referralSource")),
    aboutBusiness: strOrNull(fd.get("aboutBusiness")),
    offerPath: parseOfferPath(str(fd.get("offer"))),
    refCode: strOrNull(fd.get("ref")),
    tosAccepted: fd.get("tos") != null,
  };
}

/**
 * Field-level validation. Returns the first user-facing error message, or null
 * if everything is OK. Keeps the action's error surface simple.
 */
export function validateSignup(parsed: ParsedSignup): string | null {
  if (!parsed.email || !EMAIL_RE.test(parsed.email)) return "Please enter a valid email address.";
  if (!parsed.password || parsed.password.length < 8) return "Password must be at least 8 characters.";
  if (parsed.password !== parsed.confirmPassword) return "Passwords do not match.";
  if (!parsed.phone) return "Phone number is required.";
  if (!parsed.businessName) return "Business name is required.";
  if (!parsed.tosAccepted) return "Please acknowledge the terms to continue.";
  return null;
}

export const SIGNUP_FORM_BANDS = {
  employee: EMPLOYEE_BANDS,
  revenue: REVENUE_BANDS,
} as const;

export const OWNERSHIP_OPTIONS = OWNERSHIP_TYPES;
export const TARGET_KPI_OPTIONS = TARGET_KPIS;
