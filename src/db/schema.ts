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

export const siteStyle = pgEnum("site_style", ["trust", "bold", "dark"]);

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
  style: siteStyle("style").notNull().default("bold"),
  // Economics: r0cketship's cut of each white-label sale, and the data cost rate
  // used to compute r0cketship's gross profit. Both fractions in [0,1].
  platformFeeRate: numeric("platform_fee_rate").notNull().default("0.60"),
  dataCostRate: numeric("data_cost_rate").notNull().default("0.00"),
  // Hero overrides (fall back to generated marketing content when null).
  heroImage: text("hero_image"),
  heroVideo: text("hero_video"),
  heroHeadline: text("hero_headline"),
  heroSubhead: text("hero_subhead"),
  // Partner program (per white-label).
  partnerProgramEnabled: boolean("partner_program_enabled").notNull().default(false),
  partnerRate: numeric("partner_rate").notNull().default("0.20"),
  showBecomeAPartner: boolean("show_become_a_partner").notNull().default(false),
  customerFundingPolicy: text("customer_funding_policy").notNull().default("self"), // self | owner
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userRole = pgEnum("user_role", ["god", "manager", "customer", "agent", "partner", "sales_manager"]);
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
  "signup_bonus", "topup", "coupon", "admin_grant", "lead_charge", "refund", "adjustment", "affiliate",
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

// Timestamped CRM activity log per delivered lead (notes + disposition changes).
export const leadNotes = pgTable("lead_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  deliveryId: uuid("delivery_id").notNull().references(() => leadDeliveries.id),
  tenantId: uuid("tenant_id").notNull(),
  customerId: uuid("customer_id").notNull().references(() => users.id),
  body: text("body"),
  disposition: text("disposition"), // status set alongside this note, if any
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customerIntegrations = pgTable("customer_integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  customerId: uuid("customer_id").notNull().references(() => users.id).unique(),
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),
  active: boolean("active").notNull().default(true),
  bookingUrl: text("booking_url"),
  emailSubject: text("email_subject"),
  emailBodyHtml: text("email_body_html"),
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
  hotTransferNumber: text("hot_transfer_number"),
  stripeWebhookSecretEnc: text("stripe_webhook_secret_enc"),
  smtpHost: text("smtp_host"),
  smtpPort: text("smtp_port"),
  smtpUser: text("smtp_user"),
  smtpPassEnc: text("smtp_pass_enc"),
  smtpFrom: text("smtp_from"),
  // Outbound email (mailbox pool) settings.
  zapmailApiKeyEnc: text("zapmail_api_key_enc"),
  zapmailWorkspaceKey: text("zapmail_workspace_key"),
  bookingUrl: text("booking_url"),
  autoReplyEnabled: boolean("auto_reply_enabled").notNull().default(true),
  autoReplyHtml: text("auto_reply_html"),
  activePaymentProvider: paymentProvider("active_payment_provider").notNull().default("manual"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---- Outbound email: mailbox pool + logs (Zapmail/Google mailboxes, ~50/day each) ----
export const mailboxStatus = pgEnum("mailbox_status", ["active", "paused"]);

export const emailMailboxes = pgTable("email_mailboxes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  address: text("address").notNull(),
  displayName: text("display_name"),
  provider: text("provider").notNull().default("smtp"), // smtp | zapmail-google | zapmail-microsoft
  smtpHost: text("smtp_host"),
  smtpPort: text("smtp_port"),
  smtpUser: text("smtp_user"),
  smtpPassEnc: text("smtp_pass_enc"),
  dailyCap: integer("daily_cap").notNull().default(50),
  sentToday: integer("sent_today").notNull().default(0),
  sentDate: text("sent_date"), // YYYY-MM-DD; counter resets when the date rolls
  status: mailboxStatus("status").notNull().default("active"),
  zapmailId: text("zapmail_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const emailOutbound = pgTable("email_outbound", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  mailboxId: uuid("mailbox_id"),
  toAddr: text("to_addr").notNull(),
  subject: text("subject"),
  kind: text("kind").notNull().default("manual"), // campaign | auto_reply | password_reset | manual
  status: text("status").notNull(), // sent | failed | skipped
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const emailInbound = pgTable("email_inbound", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  mailboxId: uuid("mailbox_id"),
  fromAddr: text("from_addr").notNull(),
  toAddr: text("to_addr"),
  subject: text("subject"),
  bodyText: text("body_text"),
  autoReplied: boolean("auto_replied").notNull().default(false),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
});

// ---- Partner / franchise referral program ----
export const referralScope = pgEnum("referral_scope", ["platform", "tenant"]);
export const payoutForm = pgEnum("payout_form", ["cash", "credit"]);
export const commissionStatus = pgEnum("commission_status", ["accrued", "owed", "paid", "void"]);

export const referralCodes = pgTable("referral_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  ownerUserId: uuid("owner_user_id").notNull().references(() => users.id),
  scope: referralScope("scope").notNull(),
  tenantId: uuid("tenant_id"), // null for platform-scope (sales reps)
  customerRate: numeric("customer_rate").notNull().default("0.20"),
  whitelabelRate: numeric("whitelabel_rate"), // platform scope only — landing new white-labels
  payoutFormChoice: payoutForm("payout_form").notNull().default("cash"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const partnerReferrals = pgTable("partner_referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referredUserId: uuid("referred_user_id").notNull().references(() => users.id).unique(),
  referralCodeId: uuid("referral_code_id").notNull().references(() => referralCodes.id),
  scope: referralScope("scope").notNull(),
  tenantId: uuid("tenant_id"),
  activatedAt: timestamp("activated_at"), // first free-credit spend
  upgradedAt: timestamp("upgraded_at"), // first real payment
  windowEndsAt: timestamp("window_ends_at"), // upgradedAt + 12 months
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const commissionLedger = pgTable("commission_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  referralCodeId: uuid("referral_code_id").notNull(),
  ownerUserId: uuid("owner_user_id").notNull(),
  referredUserId: uuid("referred_user_id"),
  paymentId: uuid("payment_id"),
  kind: text("kind").notNull().default("customer"), // customer | whitelabel
  basisAmount: numeric("basis_amount").notNull(),
  rate: numeric("rate").notNull(),
  amount: numeric("amount").notNull(),
  scope: referralScope("scope").notNull(),
  tenantId: uuid("tenant_id"),
  periodMonth: text("period_month").notNull(), // YYYY-MM
  status: commissionStatus("status").notNull().default("accrued"),
  payoutBatchId: uuid("payout_batch_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const payoutSettings = pgTable("payout_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id).unique(),
  method: text("method").notNull().default("manual"), // paypal | stripe_connect | manual
  paypalEmail: text("paypal_email"),
  stripeConnectId: text("stripe_connect_id"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const payoutBatches = pgTable("payout_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  runMonth: text("run_month").notNull(), // YYYY-MM being paid out
  scope: referralScope("scope"),
  createdBy: uuid("created_by"),
  status: text("status").notNull().default("queued"), // queued | sent | failed
  totalAmount: numeric("total_amount").notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const platformSettings = pgTable("platform_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  salesRepRate: numeric("sales_rep_rate").notNull().default("0.20"),
  defaultPartnerRate: numeric("default_partner_rate").notNull().default("0.20"),
  partnerRateCap: numeric("partner_rate_cap").notNull().default("0.30"),
  whitelabelLandedRate: numeric("whitelabel_landed_rate").notNull().default("0.10"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const passwordResets = pgTable("password_resets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  tenantId: uuid("tenant_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

export const affiliates = pgTable("affiliates", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull().references(() => users.id).unique(),
  code: text("code").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referredCustomerId: uuid("referred_customer_id").notNull().references(() => users.id).unique(),
  affiliateCustomerId: uuid("affiliate_customer_id").notNull().references(() => users.id),
  code: text("code").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const emailSendStatus = pgEnum("email_send_status", ["sent", "failed", "skipped"]);

export const emailSends = pgTable("email_sends", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  customerId: uuid("customer_id").notNull().references(() => users.id),
  deliveryId: uuid("delivery_id").notNull(),
  leadEmail: text("lead_email"),
  status: emailSendStatus("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const callDisposition = pgEnum("call_disposition", ["no_answer", "left_message", "callback", "hot_transfer", "booked", "sold", "dead"]);

export const calls = pgTable("calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  leadId: uuid("lead_id").notNull().references(() => leads.id),
  agentId: uuid("agent_id").notNull().references(() => users.id),
  disposition: callDisposition("disposition").notNull(),
  notes: text("notes"),
  callbackAt: timestamp("callback_at"),
  saleValue: numeric("sale_value"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
