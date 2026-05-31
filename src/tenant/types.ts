export interface Offer {
  id: number;
  title: string;
  description: string;
  /** Display price string, e.g. "$1,500/mo per ZIP". */
  price: string;
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
}
