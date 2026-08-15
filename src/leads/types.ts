export type LeadSource = "upload" | "webhook";
export type Segment = "residential" | "commercial";

export interface NormalizedLead {
  shaLcHem: string;
  firstName: string | null;
  lastName: string | null;
  businessEmail: string | null;
  personalPhones: string[];
  mobilePhones: string[];
  emails: string[];
  linkedinUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  zip4: string | null;
  gender: string | null;
  ageRange: string | null;
  incomeRange: string | null;
  netWorth: string | null;
  jobTitle: string | null;
  department: string | null;
  companyName: string | null;
  companyDomain: string | null;
  companyRevenue: string | null;
  companyEmployeeCount: string | null;
  companyState: string | null;
  companyLinkedinUrl: string | null;
  businessEmailValidationStatus: string | null;
  contactCountry: string | null;
  scoreCategory: string | null;
  segment: Segment;
  lastUpdated: Date | null;
  extra: Record<string, string>;
}

export type NormalizeResult =
  | { ok: true; lead: NormalizedLead }
  | { ok: false; error: string };

export interface IngestSummary {
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  insertedLeadIds: string[];
}
