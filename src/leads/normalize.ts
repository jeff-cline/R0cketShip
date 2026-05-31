import type { NormalizeResult } from "./types";

const KNOWN = new Set([
  "sha256_lc_hem", "first_name", "last_name", "business_email", "personal_phone",
  "mobile_phone", "linkedin_url", "personal_address", "personal_state", "personal_city",
  "personal_zip", "personal_zip4", "gender", "age_range", "income_range", "net_worth",
  "job_title", "department", "company_name", "company_domain", "company_revenue",
  "company_employee_count", "company_linkedin_url", "company_state",
  "business_email_validation_status", "personal_emails", "additional_personal_emails",
  "contact_country", "score_category", "last_updated",
]);

function nn(v: string | undefined): string | null {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

function splitMulti(v: string | undefined): string[] {
  if (!v) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of v.split(",")) {
    const p = part.trim();
    if (p && !seen.has(p)) { seen.add(p); out.push(p); }
  }
  return out;
}

export function normalizeRow(raw: Record<string, string>): NormalizeResult {
  const sha = (raw.sha256_lc_hem ?? "").trim();
  if (!sha) return { ok: false, error: "missing sha256_lc_hem" };

  const emailSet = new Set<string>();
  const emails: string[] = [];
  for (const e of [...splitMulti(raw.personal_emails), ...splitMulti(raw.additional_personal_emails)]) {
    const lc = e.toLowerCase();
    if (!emailSet.has(lc)) { emailSet.add(lc); emails.push(lc); }
  }

  const companyName = nn(raw.company_name);

  const extra: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!KNOWN.has(k) && v != null && String(v).trim() !== "") extra[k] = String(v);
  }

  let lastUpdated: Date | null = null;
  const lu = nn(raw.last_updated);
  if (lu) {
    const d = new Date(lu.replace(" ", "T") + "Z");
    lastUpdated = Number.isNaN(d.getTime()) ? null : d;
  }

  return {
    ok: true,
    lead: {
      shaLcHem: sha,
      firstName: nn(raw.first_name),
      lastName: nn(raw.last_name),
      businessEmail: nn(raw.business_email),
      personalPhones: splitMulti(raw.personal_phone),
      mobilePhones: splitMulti(raw.mobile_phone),
      emails,
      linkedinUrl: nn(raw.linkedin_url),
      address: nn(raw.personal_address),
      city: nn(raw.personal_city),
      state: nn(raw.personal_state),
      zip: nn(raw.personal_zip),
      zip4: nn(raw.personal_zip4),
      gender: nn(raw.gender),
      ageRange: nn(raw.age_range),
      incomeRange: nn(raw.income_range),
      netWorth: nn(raw.net_worth),
      jobTitle: nn(raw.job_title),
      department: nn(raw.department),
      companyName,
      companyDomain: nn(raw.company_domain),
      companyRevenue: nn(raw.company_revenue),
      companyEmployeeCount: nn(raw.company_employee_count),
      companyState: nn(raw.company_state),
      companyLinkedinUrl: nn(raw.company_linkedin_url),
      businessEmailValidationStatus: nn(raw.business_email_validation_status),
      contactCountry: nn(raw.contact_country),
      scoreCategory: nn(raw.score_category),
      segment: companyName ? "commercial" : "residential",
      lastUpdated,
      extra,
    },
  };
}
