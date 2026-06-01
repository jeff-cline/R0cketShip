import {
  pgTable,
  uuid,
  text,
  jsonb,
  numeric,
  timestamp,
  pgEnum,
  boolean,
  uniqueIndex,
  index,
  integer,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { TenantTheme, Offer } from "../tenant/types";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  domain: text("domain").notNull().unique(),
  ip: text("ip"),
  niche: text("niche").notNull(),
  moneyWord: text("money_word").notNull(),
  logoUrl: text("logo_url"),
  theme: jsonb("theme").$type<TenantTheme>().notNull(),
  offers: jsonb("offers").$type<Offer[]>().notNull(),
  monthlyPriceDefault: numeric("monthly_price_default").notNull(),
  footerHtml: text("footer_html").notNull().default(""),
  activePaymentProvider: text("active_payment_provider", {
    enum: ["stripe", "paypal"],
  })
    .notNull()
    .default("stripe"),
  status: text("status", { enum: ["active", "inactive"] })
    .notNull()
    .default("active"),
  ingestKey: text("ingest_key"),
  signupBonusCredits: numeric("signup_bonus_credits").notNull().default("50"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userRole = pgEnum("user_role", ["god", "manager", "customer"]);
export const userStatus = pgEnum("user_status", ["active", "disabled"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull(),
    mustResetPassword: boolean("must_reset_password").notNull().default(true),
    name: text("name"),
    status: userStatus("status").notNull().default("active"),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_tenant_email_uniq").on(t.tenantId, t.email)],
);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  impersonatorUserId: uuid("impersonator_user_id"),
  returnToSessionId: uuid("return_to_session_id"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const leadSegment = pgEnum("lead_segment", ["residential", "commercial"]);
export const leadSource = pgEnum("lead_source", ["upload", "webhook"]);

export const persons = pgTable("persons", {
  id: uuid("id").primaryKey().defaultRandom(),
  shaLcHem: text("sha_lc_hem").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    personId: uuid("person_id").notNull().references(() => persons.id),
    shaLcHem: text("sha_lc_hem").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    businessEmail: text("business_email"),
    personalPhones: text("personal_phones").array().notNull().default(sql`'{}'::text[]`),
    mobilePhones: text("mobile_phones").array().notNull().default(sql`'{}'::text[]`),
    emails: text("emails").array().notNull().default(sql`'{}'::text[]`),
    linkedinUrl: text("linkedin_url"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    zip: text("zip"),
    zip4: text("zip4"),
    gender: text("gender"),
    ageRange: text("age_range"),
    incomeRange: text("income_range"),
    netWorth: text("net_worth"),
    jobTitle: text("job_title"),
    department: text("department"),
    companyName: text("company_name"),
    companyDomain: text("company_domain"),
    companyRevenue: text("company_revenue"),
    companyEmployeeCount: text("company_employee_count"),
    companyState: text("company_state"),
    companyLinkedinUrl: text("company_linkedin_url"),
    businessEmailValidationStatus: text("business_email_validation_status"),
    contactCountry: text("contact_country"),
    scoreCategory: text("score_category"),
    segment: leadSegment("segment").notNull(),
    lastUpdated: timestamp("last_updated"),
    extra: jsonb("extra").$type<Record<string, string>>().notNull().default({}),
    source: leadSource("source").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("leads_tenant_person_uniq").on(t.tenantId, t.personId),
    index("leads_tenant_zip_idx").on(t.tenantId, t.zip),
  ],
);

export const ledgerType = pgEnum("ledger_type", [
  "signup_bonus", "topup", "coupon", "admin_grant", "lead_charge", "refund", "adjustment",
]);
export const paymentProvider = pgEnum("payment_provider", ["manual", "stripe", "paypal"]);
export const paymentStatus = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);
export const couponKind = pgEnum("coupon_kind", ["percent", "fixed_credits"]);
export const paymentPurpose = pgEnum("payment_purpose", ["topup", "subscription"]);

export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userId: uuid("user_id").notNull().references(() => users.id).unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creditLedger = pgTable("credit_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id").notNull().references(() => wallets.id),
  tenantId: uuid("tenant_id").notNull(),
  amount: numeric("amount").notNull(),
  type: ledgerType("type").notNull(),
  description: text("description"),
  refId: uuid("ref_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  walletId: uuid("wallet_id").notNull().references(() => wallets.id),
  provider: paymentProvider("provider").notNull(),
  providerRef: text("provider_ref"),
  amountUsd: numeric("amount_usd").notNull(),
  credits: numeric("credits").notNull(),
  couponCode: text("coupon_code"),
  status: paymentStatus("status").notNull().default("pending"),
  purpose: paymentPurpose("purpose").notNull().default("topup"),
  subscriptionId: uuid("subscription_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
});

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id"),
  code: text("code").notNull().unique(),
  kind: couponKind("kind").notNull(),
  value: numeric("value").notNull(),
  maxRedemptions: integer("max_redemptions"),
  timesRedeemed: integer("times_redeemed").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const deliveryStatus = pgEnum("delivery_status", ["new", "contacted", "booked", "sold", "dead"]);

export const leadDeliveries = pgTable(
  "lead_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    customerId: uuid("customer_id").notNull().references(() => users.id),
    walletId: uuid("wallet_id").notNull().references(() => wallets.id),
    leadId: uuid("lead_id").notNull().references(() => leads.id),
    priceCredits: numeric("price_credits").notNull(),
    tierAtDelivery: text("tier_at_delivery").notNull(),
    status: deliveryStatus("status").notNull().default("new"),
    notes: text("notes"),
    saleValue: numeric("sale_value"),
    deliveredAt: timestamp("delivered_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("lead_deliveries_customer_lead_uniq").on(t.customerId, t.leadId)],
);

export const customerIntegrations = pgTable("customer_integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  customerId: uuid("customer_id").notNull().references(() => users.id).unique(),
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),
  active: boolean("active").notNull().default(true),
  lastStatus: text("last_status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tenantIntegrations = pgTable("tenant_integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id).unique(),
  stripeSecretEnc: text("stripe_secret_enc"),
  stripePublishable: text("stripe_publishable"),
  paypalClientId: text("paypal_client_id"),
  paypalSecretEnc: text("paypal_secret_enc"),
  twilioAccountSid: text("twilio_account_sid"),
  twilioAuthTokenEnc: text("twilio_auth_token_enc"),
  twilioFromNumber: text("twilio_from_number"),
  activePaymentProvider: paymentProvider("active_payment_provider").notNull().default("manual"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const epartnerApplications = pgTable("epartner_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  businessName: text("business_name"),
  location: text("location"),
  roofsLast12mo: text("roofs_last_12mo"),
  seasonsInBusiness: text("seasons_in_business"),
  territories: text("territories"),
  teamW2: text("team_w2"),
  team1099: text("team_1099"),
  canvassers: text("canvassers"),
  techUsed: text("tech_used"),
  annualRevenue: text("annual_revenue"),
  annualEbitda: text("annual_ebitda"),
  approachedBefore: boolean("approached_before"),
  agreeExit: boolean("agree_exit"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscriptionStatus = pgEnum("subscription_status", ["active", "canceled"]);
export const subscriptionOffer = pgEnum("subscription_offer", ["data", "booking", "epartner"]);

export const zipSubscriptions = pgTable("zip_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  customerId: uuid("customer_id").notNull().references(() => users.id),
  zip: text("zip").notNull(),
  offer: subscriptionOffer("offer").notNull().default("data"),
  monthlyPrice: numeric("monthly_price").notNull(),
  status: subscriptionStatus("status").notNull().default("active"),
  paidThrough: timestamp("paid_through"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  canceledAt: timestamp("canceled_at"),
});
