import type { AgeTier } from "../leads/age-tier";

export interface LeadFilters {
  zips?: string[];
  segment?: "residential" | "commercial";
  tier?: AgeTier;
  score?: string;
}

export interface LeadPreview {
  leadId: string;
  zip: string | null;
  city: string | null;
  state: string | null;
  segment: "residential" | "commercial";
  scoreCategory: string | null;
  tier: AgeTier;
  price: number;
}

export interface PurchaseResult {
  delivered: { deliveryId: string; leadId: string; price: number }[];
  totalCharged: number;
  skipped: number;
}

export interface DeliveryStats {
  delivered: number;
  conversions: number;
  revenue: number;
  creditsSpent: number;
}
