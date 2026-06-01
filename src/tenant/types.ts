export interface Offer {
  id: number;
  title: string;
  description: string;
  /** Display price string, e.g. "$1,500/mo per ZIP". */
  price: string;
  /** "What you get" bullet points shown on the offer card. */
  features?: string[];
}

export interface TenantTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  fontFamily: string;
}

export type PaymentProvider = "stripe" | "paypal";
export type TenantStatus = "active" | "inactive";

export interface Tenant {
  id: string;
  domain: string;
  ip: string | null;
  niche: string;
  moneyWord: string;
  logoUrl: string | null;
  theme: TenantTheme;
  offers: Offer[];
  /** Default monthly subscription price for one ZIP, as a decimal string. */
  monthlyPriceDefault: string;
  footerHtml: string;
  activePaymentProvider: PaymentProvider;
  status: TenantStatus;
  style: "trust" | "bold" | "dark";
  /** r0cketship's cut of each sale (fraction). White-label keeps 1 - this. */
  platformFeeRate: string;
  /** Data cost rate (fraction of sales) used for r0cketship gross-profit. */
  dataCostRate: string;
  heroImage: string | null;
  heroVideo: string | null;
  heroHeadline: string | null;
  heroSubhead: string | null;
}
