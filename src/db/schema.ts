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
  // Sales rep who landed this white-label (god sales org), for landed-commission accrual.
  landedByUserId: uuid("landed_by_user_id"),
  landedAt: timestamp("landed_at"),
  // Whether this white-label is listed on the r0cketship.com /niches directory.
  showOnNiches: boolean("show_on_niches").notNull().default(false),
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
export const couponKind = pgEnum("coupon_kind", ["percent", "fixed_credits", "percent_off"]);
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
  name: text("name"), // display name (god-assigned)
  kind: couponKind("kind").notNull(),
  value: numeric("value").notNull(),
  durationMonths: integer("duration_months"), // null = forever; else 1/2/3… discounted months
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
  // Outreach autoscaling: buy more Zapmail mailboxes automatically to hit the drip deadline.
  outreachAutoBuy: boolean("outreach_auto_buy").notNull().default(false),
  outreachMaxMailboxes: integer("outreach_max_mailboxes").notNull().default(0),
  activePaymentProvider: paymentProvider("active_payment_provider").notNull().default("manual"),
  // Phase 2 marketplace: dedicated Stripe key set for advertiser deposits.
  // Stored only on the r0cketship.com tenant row; used by `/advertise` billing.
  advertisingStripeSecretEnc: text("advertising_stripe_secret_enc"),
  advertisingStripePublishable: text("advertising_stripe_publishable"),
  advertisingStripeWebhookSecretEnc: text("advertising_stripe_webhook_secret_enc"),
  // God-level auto-approve toggles for the advertising marketplace.
  godAutoApproveAdvertisers: boolean("god_auto_approve_advertisers").notNull().default(true),
  godAutoApproveCampaigns: boolean("god_auto_approve_campaigns").notNull().default(true),
  // "CC the founder on every advertiser test-send" — god toggle, default ON
  // for early QA. Set to empty string to disable.
  marketplaceCcFounderEmail: text("marketplace_cc_founder_email").notNull().default("jeff.cline@me.com"),
  // Fallback URL when a tracked click can't be routed cleanly (offer inactive,
  // tenant frozen, malformed cta_url, etc.). Default points at the /trending
  // monetization lander so we still capture revenue from those clicks.
  marketplaceDefaultLander: text("marketplace_default_lander").notNull().default("https://r0cketship.com/trending"),
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
  // Active coupon discount on this subscription (god-issued % off for N months / forever).
  couponCode: text("coupon_code"),
  discountPercent: numeric("discount_percent"),
  discountMonthsLeft: integer("discount_months_left"), // null = forever; decrements per invoice
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

// ---- Phase 1: White-label automated outreach (drip the tenant's offer to its incoming leads) ----

/** One outreach offer per white-label — the message dripped to every lead that enters its database. */
export const outreachOffers = pgTable("outreach_offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id).unique(),
  logoUrl: text("logo_url"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  ctaUrl: text("cta_url").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const outreachStatus = pgEnum("outreach_status", ["queued", "sent", "skipped", "suppressed", "failed"]);

/** One row per (tenant, lead): the scheduled outreach send, paced to clear the batch within ~7 days. */
export const outreachQueue = pgTable(
  "outreach_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    leadId: uuid("lead_id").notNull().references(() => leads.id),
    toAddr: text("to_addr").notNull(),
    status: outreachStatus("status").notNull().default("queued"),
    scheduledFor: timestamp("scheduled_for").notNull(),
    batchDeadline: timestamp("batch_deadline").notNull(),
    clickToken: text("click_token").notNull().unique(),
    clicks: integer("clicks").notNull().default(0),
    clickedAt: timestamp("clicked_at"),
    mailboxId: uuid("mailbox_id"),
    sentAt: timestamp("sent_at"),
    error: text("error"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("outreach_queue_tenant_lead_uniq").on(t.tenantId, t.leadId),
    index("outreach_queue_due_idx").on(t.status, t.scheduledFor),
    index("outreach_queue_tenant_idx").on(t.tenantId),
  ],
);

export const suppressionReason = pgEnum("suppression_reason", ["bounce", "unsubscribe", "complaint", "invalid"]);

/** Global do-not-email list. Checked before every send; populated by bounces, unsubscribes, complaints. */
export const emailSuppression = pgTable("email_suppression", {
  id: uuid("id").primaryKey().defaultRandom(),
  address: text("address").notNull().unique(),
  reason: suppressionReason("reason").notNull(),
  tenantId: uuid("tenant_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Missed-opportunity log. Every tracked click that we CAN'T route cleanly to
 * a real CTA target (offer inactive, malformed cta_url, tenant frozen, etc.)
 * gets a row here so god can show white-labels how much real intent they're
 * losing. Drives the "Missed opportunities — fund your account" nudges.
 */
export const missedOpportunitySource = pgEnum("missed_opportunity_source", [
  "invalid_cta_url",
  "offer_inactive",
  "no_offer",
  "tenant_frozen",
  "out_of_budget",
  "expired_token",
  "unknown_token",
]);

export const missedOpportunities = pgTable(
  "missed_opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id"), // nullable — we don't always know the tenant
    sourceToken: text("source_token"), // the click token from /c/<token>
    source: missedOpportunitySource("source").notNull(),
    redirectedTo: text("redirected_to").notNull(), // where we sent them instead
    userAgent: text("user_agent"),
    ip: text("ip"),
    referrer: text("referrer"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("missed_opps_tenant_idx").on(t.tenantId, t.createdAt),
    index("missed_opps_created_idx").on(t.createdAt),
  ],
);

/**
 * Offer Box — a smart embeddable that shows top offers anywhere on the web
 * (other sites, email templates via Klaviyo, etc.). Each box is configured
 * once and gets a stable key used in the embed snippets.
 */
export const offerBoxMode = pgEnum("offer_box_mode", [
  "main_only",        // single hero offer chosen by optimizer
  "by_niche",         // one offer pulled from a specific niche
  "niche_plus_n",     // a niche-led hero + N additional offers
  "top_n_all",        // top N offers across the whole network
]);

export const offerBoxFormat = pgEnum("offer_box_format", [
  "html",     // pre-rendered HTML snapshot for email (no JS)
  "iframe",   // live iframe (best for web pages with JS allowed)
  "js",       // <script> tag that writes HTML into a div
  "popup",    // modal/popup overlay on host page
]);

export const offerBoxes = pgTable("offer_boxes", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),     // e.g. "obx_a1b2c3" — used in embed URLs
  name: text("name").notNull(),
  mode: offerBoxMode("mode").notNull().default("main_only"),
  niches: jsonb("niches").$type<string[]>().notNull().default([]),
  maxOffers: integer("max_offers").notNull().default(1),
  format: offerBoxFormat("format").notNull().default("iframe"),
  active: boolean("active").notNull().default(true),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Tracked clicks originating from an embedded offer box. */
/**
 * Click attribution for the public /trending lander. Every click on an offer
 * card 302s through `/c/trending/<offerId>` and lands one row here so we can
 * (a) see which offers earn impressions on the public hub and (b) build a
 * monetization layer on top — the analog of `offer_box_clicks` but rooted in
 * the trending page rather than an embedded box.
 */
export const trendingClicks = pgTable(
  "trending_clicks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offerId: uuid("offer_id").notNull(),
    /** Denormalized — saves a join when reporting per-tenant. */
    tenantId: uuid("tenant_id"),
    redirectedTo: text("redirected_to"),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    ip: text("ip"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("trending_clicks_offer_idx").on(t.offerId, t.createdAt),
    index("trending_clicks_tenant_idx").on(t.tenantId, t.createdAt),
  ],
);

export const offerBoxClicks = pgTable(
  "offer_box_clicks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offerBoxId: uuid("offer_box_id").notNull().references(() => offerBoxes.id, { onDelete: "cascade" }),
    /** Which offer was actually clicked. Polymorphic by kind so future
     *  expansion to advertiser ads or affiliate offers slots in. */
    offerKind: text("offer_kind", { enum: ["outreach", "advertiser"] }).notNull(),
    offerId: text("offer_id").notNull(),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    ip: text("ip"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("offer_box_clicks_box_idx").on(t.offerBoxId, t.createdAt),
  ],
);

/**
 * God-defined custom canonical column keys for lead ingestion.
 *
 * Phase 1 hard-codes a `KNOWN_COLUMNS` set in `src/leads/normalize.ts`. As new
 * data sources arrive with novel fields (opt-in source, verification level,
 * UTM tracking, etc.) god can register additional column keys here so the
 * import preview stops flagging them as unrecognized.
 *
 * Data still lands in `leads.extra` JSONB (no schema migration per new column),
 * but the system "knows" about the key so the mapping check accepts it and
 * downstream queries can target it via `extra->>'key'`.
 */
export const leadCustomColumns = pgTable("lead_custom_columns", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  description: text("description"),
  kind: text("kind", { enum: ["string", "number", "date", "boolean"] }).notNull().default("string"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Audit log of autoscaling mailbox purchases. */
export const mailboxPurchases = pgTable("mailbox_purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull(),
  count: integer("count").notNull(),
  monthlyCost: numeric("monthly_cost").notNull().default("0"),
  reason: text("reason"),
  createdBy: text("created_by").notNull().default("system"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// Phase 2: /advertise marketplace — third-party advertisers buying access to
// the outbound pool via CPA, separate from tenants and customers.
// ============================================================================

export const advertiserStatus = pgEnum("advertiser_status", [
  "pending",
  "approved",
  "frozen",
  "suspended",
]);

export const referrerKind = pgEnum("referrer_kind", [
  "customer",
  "tenant_manager",
  "agent",
  "external",
]);

export const ownershipType = pgEnum("ownership_type", [
  "public",
  "private",
  "nonprofit",
  "government",
]);

export const targetKpi = pgEnum("target_kpi", [
  "booking",
  "order",
  "sale",
  "site_visit",
  "other",
]);

export const offerPath = pgEnum("offer_path", [
  "pay_for_success",
  "strategic_partner",
]);

export const advCampaignStatus = pgEnum("adv_campaign_status", [
  "pending",
  "active",
  "paused",
  "out_of_budget",
  "rejected",
  "frozen",
]);

export const advPaymentPurpose = pgEnum("adv_payment_purpose", [
  "signup_bonus",
  "deposit",
  "coupon_grant",
  "admin_grant",
]);

export const advPaymentProvider = pgEnum("adv_payment_provider", [
  "stripe",
  "paypal",
  "manual",
  "coupon",
]);

export const advLedgerType = pgEnum("adv_ledger_type", [
  "signup_bonus",
  "deposit",
  "click_charge",
  "refund_admin",
  "coupon_grant",
  "admin_grant",
]);

export const paidToAccountKind = pgEnum("paid_to_account_kind", [
  "customer_wallet",
  "manager_wallet",
  "agent_balance",
]);

export const managerWalletLedgerType = pgEnum("manager_wallet_ledger_type", [
  "advertiser_referral",
  "admin_adjustment",
  "withdrawal",
]);

/** Top-level advertiser account — separate auth scope from tenants/customers. */
export const advertisers = pgTable("advertisers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  status: advertiserStatus("status").notNull().default("pending"),
  // Cached wallet balance in cents (authoritative source = SUM of advertiser_ledger).
  walletBalanceCents: integer("wallet_balance_cents").notNull().default(0),
  // Referral attribution.
  referrerUserId: uuid("referrer_user_id"),
  referrerKind: referrerKind("referrer_kind"),
  referrerWindowStartsAt: timestamp("referrer_window_starts_at"),
  referrerWindowEndsAt: timestamp("referrer_window_ends_at"),
  // Email verification (gated $10 grant).
  emailVerifiedAt: timestamp("email_verified_at"),
  emailVerifyToken: text("email_verify_token"),
  emailVerifyTokenExpiresAt: timestamp("email_verify_token_expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Separate session table for advertisers — isolates auth scope. */
export const advertiserSessions = pgTable("advertiser_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  advertiserId: uuid("advertiser_id")
    .notNull()
    .references(() => advertisers.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Comprehensive business intel captured at signup. One row per advertiser. */
export const advertiserIntake = pgTable("advertiser_intake", {
  id: uuid("id").primaryKey().defaultRandom(),
  advertiserId: uuid("advertiser_id")
    .notNull()
    .references(() => advertisers.id, { onDelete: "cascade" })
    .unique(),
  // Contact.
  phone: text("phone"),
  // Business identity.
  businessName: text("business_name"),
  businessUrl: text("business_url"),
  industry: text("industry"),
  // Scale.
  employeeCountBand: text("employee_count_band"), // "1-10" | "11-50" | "51-200" | "201-1000" | "1000+"
  annualRevenueBand: text("annual_revenue_band"),
  yearsInBusiness: integer("years_in_business"),
  // Identity-of-record.
  dunsNumber: text("duns_number"),
  ownershipType: ownershipType("ownership_type"),
  // Economics.
  customerLtvCents: integer("customer_ltv_cents"),
  typicalCacCents: integer("typical_cac_cents"),
  // Campaign intent.
  targetKpi: targetKpi("target_kpi"),
  targetGeographyText: text("target_geography_text"),
  monthlyAdBudgetCents: integer("monthly_ad_budget_cents"),
  // Source / context.
  referralSource: text("referral_source"),
  offerPath: offerPath("offer_path").notNull(),
  aboutBusiness: text("about_business"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Rate-limit log for advertiser signups (per-email + per-IP). */
export const advertiserSignupAttempts = pgTable(
  "advertiser_signup_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email"),
    ip: text("ip"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("adv_signup_attempts_email_idx").on(t.email, t.createdAt),
    index("adv_signup_attempts_ip_idx").on(t.ip, t.createdAt),
  ],
);

/** One campaign per advertiser-product. Creative + CPA + targeting. */
export const advertiserCampaigns = pgTable(
  "advertiser_campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    advertiserId: uuid("advertiser_id")
      .notNull()
      .references(() => advertisers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    status: advCampaignStatus("status").notNull().default("pending"),
    // Creative.
    emailSubject: text("email_subject").notNull(),
    emailBodyHtml: text("email_body_html").notNull(),
    ctaUrl: text("cta_url").notNull(),
    ctaLabel: text("cta_label").notNull().default("Learn more"),
    // Pricing — min CPA enforced server-side at $5 = 500 cents.
    maxCpaCents: integer("max_cpa_cents").notNull(),
    dailyBudgetCents: integer("daily_budget_cents"),
    // Targeting filters (JSON shape: zip[], segments[], age_tiers[], niches[], income_min, income_max).
    targetingFilters: jsonb("targeting_filters").notNull().default({}),
    // Denormalized stats for dashboard speed.
    totalSends: integer("total_sends").notNull().default(0),
    totalClicks: integer("total_clicks").notNull().default(0),
    totalSpendCents: integer("total_spend_cents").notNull().default(0),
    todaySends: integer("today_sends").notNull().default(0),
    todayClicks: integer("today_clicks").notNull().default(0),
    todaySpendCents: integer("today_spend_cents").notNull().default(0),
    approvedAt: timestamp("approved_at"),
    approvedByUserId: uuid("approved_by_user_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("adv_campaigns_status_idx").on(t.status, t.advertiserId),
    index("adv_campaigns_advertiser_idx").on(t.advertiserId),
  ],
);

/** Deposits + grants into an advertiser wallet. */
export const advertiserPayments = pgTable("advertiser_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  advertiserId: uuid("advertiser_id")
    .notNull()
    .references(() => advertisers.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  provider: advPaymentProvider("provider").notNull(),
  providerPaymentId: text("provider_payment_id"),
  purpose: advPaymentPurpose("purpose").notNull(),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Immutable ledger — every wallet credit or debit. SUM equals current balance. */
export const advertiserLedger = pgTable(
  "advertiser_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    advertiserId: uuid("advertiser_id")
      .notNull()
      .references(() => advertisers.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id"),
    // Positive = credit, negative = spend.
    deltaCents: integer("delta_cents").notNull(),
    type: advLedgerType("type").notNull(),
    refId: text("ref_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("adv_ledger_advertiser_idx").on(t.advertiserId, t.createdAt)],
);

/** Every advertiser ad email that goes out. Dedup ensures one ad per (campaign, lead). */
export const advertiserSendEvents = pgTable(
  "advertiser_send_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => advertiserCampaigns.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id),
    mailboxId: uuid("mailbox_id"),
    sentAt: timestamp("sent_at").notNull().defaultNow(),
    trackingToken: text("tracking_token").notNull().unique(),
  },
  (t) => [
    uniqueIndex("adv_send_events_campaign_lead_uniq").on(t.campaignId, t.leadId),
    index("adv_send_events_sent_at_idx").on(t.sentAt),
    index("adv_send_events_campaign_sent_idx").on(t.campaignId, t.sentAt),
  ],
);

/** Click events on advertiser CTA — triggers wallet charge + referral payout. */
export const advertiserClickEvents = pgTable(
  "advertiser_click_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sendEventId: uuid("send_event_id")
      .notNull()
      .references(() => advertiserSendEvents.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => advertiserCampaigns.id, { onDelete: "cascade" }),
    clickedAt: timestamp("clicked_at").notNull().defaultNow(),
    chargeCents: integer("charge_cents").notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("adv_click_events_campaign_idx").on(t.campaignId, t.clickedAt)],
);

/** Referral attribution — one row per advertiser at signup if ?ref=<code> resolved. */
export const advertiserReferrals = pgTable("advertiser_referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  advertiserId: uuid("advertiser_id")
    .notNull()
    .references(() => advertisers.id, { onDelete: "cascade" })
    .unique(),
  referrerUserId: uuid("referrer_user_id").notNull(),
  referrerKind: referrerKind("referrer_kind").notNull(),
  commissionPct: integer("commission_pct").notNull().default(15),
  windowEndsAt: timestamp("window_ends_at").notNull(),
  totalPaidOutCents: integer("total_paid_out_cents").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Each commission payout triggered by a click charge during the referral window. */
export const advertiserReferralPayouts = pgTable("advertiser_referral_payouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  referralId: uuid("referral_id")
    .notNull()
    .references(() => advertiserReferrals.id, { onDelete: "cascade" }),
  triggeringClickId: uuid("triggering_click_id")
    .notNull()
    .references(() => advertiserClickEvents.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  paidToAccountKind: paidToAccountKind("paid_to_account_kind").notNull(),
  paidToAccountId: uuid("paid_to_account_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Personal wallet for tenant managers — receives advertiser-referral payouts. */
export const managerWallets = pgTable("manager_wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  balanceCents: integer("balance_cents").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Manager wallet immutable ledger. */
export const managerWalletLedger = pgTable(
  "manager_wallet_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => managerWallets.id, { onDelete: "cascade" }),
    deltaCents: integer("delta_cents").notNull(),
    type: managerWalletLedgerType("type").notNull(),
    refId: text("ref_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("manager_wallet_ledger_wallet_idx").on(t.walletId, t.createdAt)],
);

/**
 * Business Leads CRM — inbound contact / investor / partner form submissions
 * from the r0cketship.com hub, managed by god in /admin/business-leads.
 * Platform-level (tenantId nullable; hub submissions). Notes are timestamped
 * and attributed; leads can be assigned out to other platform users.
 */
export const businessLeads = pgTable(
  "business_leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id"),
    source: text("source").notNull().default("contact"),
    name: text("name"),
    company: text("company"),
    email: text("email"),
    workPhone: text("work_phone"),
    cellPhone: text("cell_phone"),
    message: text("message"),
    predictive: text("predictive"),
    meta: jsonb("meta"),
    status: text("status").notNull().default("new"),
    assignedToUserId: uuid("assigned_to_user_id").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("business_leads_created_idx").on(t.createdAt),
    index("business_leads_assigned_idx").on(t.assignedToUserId),
  ],
);

/** Timestamped, attributed notes on a business lead. */
export const businessLeadNotes = pgTable(
  "business_lead_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id").notNull().references(() => businessLeads.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id),
    authorEmail: text("author_email"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("business_lead_notes_lead_idx").on(t.leadId, t.createdAt)],
);

// ============================================================================
// OPPORTUNITIES — the joint Krystalore × R0cketShip deal board (God-only CRM).
// Visible from any core/white-label host, but ONLY to god accounts. Each row is a
// deal we work together; notes are color-attributed (orange = Jeff, teal =
// Krystalore) and every change notifies the other partner by email. `priority`
// drives the drag-and-drop top-to-bottom ordering; `stage` (0..5) is the count of
// R0cketShip "values to close" checked off, shown as pips on the board card.
// ============================================================================
export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id"), // origin host (nullable — the board is cross-tenant)
    title: text("title").notNull(),
    businessName: text("business_name"),
    address: text("address"),
    keyPeople: text("key_people"),
    entryValue: numeric("entry_value").notNull().default("0"),
    monthlyValue: numeric("monthly_value").notNull().default("0"),
    // How many of the 5 R0cketShip values-to-close are checked (0..5).
    stage: integer("stage").notNull().default(0),
    // Drag-and-drop ordering. Lower = higher priority (top of the board).
    priority: numeric("priority").notNull().default("1000"),
    status: text("status").notNull().default("open"), // open | won | lost
    createdByEmail: text("created_by_email"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("opportunities_priority_idx").on(t.priority)],
);

/** Timestamped, color-attributed notes on an opportunity (orange=Jeff, teal=Krystalore). */
export const opportunityNotes = pgTable(
  "opportunity_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    opportunityId: uuid("opportunity_id").notNull().references(() => opportunities.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id),
    authorEmail: text("author_email"),
    authorColor: text("author_color").notNull().default("teal"), // orange | teal
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("opportunity_notes_opp_idx").on(t.opportunityId, t.createdAt)],
);

/**
 * Operating Entity Pitch Decks — JV / operating-entity opportunities featured at
 * the END of a corporate-structure division deck (slug = division). Self-served
 * by god in /admin/upload-decks (title, description, image, PDF). Surfaces as a
 * featured "Operating Entity Pitch Deck" slide with a big download button.
 */
export const operatingDecks = pgTable(
  "operating_decks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug"), // corporate-structure division slug this attaches to (nullable)
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description"),
    highlight: text("highlight"), // headline numbers, e.g. "$164B -> $295B market"
    imageUrl: text("image_url"),
    pdfUrl: text("pdf_url").notNull(),
    active: boolean("active").notNull().default(true),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("operating_decks_slug_idx").on(t.slug)],
);

// ============================================================================
// CrewPerk — the cruise-crew destination marketplace (crewperk.com). Merchants
// are Yelp-style local partners per port, with rocket reviews and click tracking.
// God-managed in /admin/crewperk for the MVP; merchant self-login is a later phase.
// ============================================================================

export const crewMerchants = pgTable(
  "crew_merchants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    category: text("category").notNull().default("Food & Drink"),
    port: text("port").notNull().default("San Juan, Puerto Rico"),
    tier: text("tier").notNull().default("community_builder"), // community_builder | advanced | free
    description: text("description"),
    phone: text("phone"),
    address: text("address"),
    website: text("website"),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    perk: text("perk"),
    priceLevel: text("price_level").notNull().default("$$"),
    lat: numeric("lat"),
    lon: numeric("lon"),
    rating: numeric("rating").notNull().default("0"),
    reviewCount: integer("review_count").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    featured: boolean("featured").notNull().default(false),
    status: text("status").notNull().default("active"),
    couponCode: text("coupon_code"),
    couponType: text("coupon_type"), // one_time | for_life
    couponNote: text("coupon_note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("crew_merchants_port_idx").on(t.port, t.status)],
);

export const crewMerchantReviews = pgTable(
  "crew_merchant_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    merchantId: uuid("merchant_id").notNull().references(() => crewMerchants.id, { onDelete: "cascade" }),
    authorName: text("author_name"),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("crew_merchant_reviews_merchant_idx").on(t.merchantId, t.createdAt)],
);

export const crewClicks = pgTable(
  "crew_clicks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    merchantId: uuid("merchant_id").notNull().references(() => crewMerchants.id, { onDelete: "cascade" }),
    port: text("port"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("crew_clicks_merchant_idx").on(t.merchantId, t.createdAt)],
);

/** CrewPerk advertiser ad units — pay-per-click boost. Highest live bid (with
 *  balance) wins the slot for its target port; each click decrements balance. */
export const crewAds = pgTable(
  "crew_ads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    advertiser: text("advertiser").notNull(),
    port: text("port").notNull().default("all"), // target port, or "all"
    headline: text("headline").notNull(),
    body: text("body"),
    imageUrl: text("image_url"),
    linkUrl: text("link_url").notNull(),
    bidCents: integer("bid_cents").notNull().default(50), // cost per click
    balanceCents: integer("balance_cents").notNull().default(0), // prepaid Rocket Fuel
    clicks: integer("clicks").notNull().default(0),
    spentCents: integer("spent_cents").notNull().default(0),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("crew_ads_port_idx").on(t.port, t.status)],
);

export const crewAdClicks = pgTable(
  "crew_ad_clicks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adId: uuid("ad_id").notNull().references(() => crewAds.id, { onDelete: "cascade" }),
    port: text("port"),
    chargeCents: integer("charge_cents").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("crew_ad_clicks_ad_idx").on(t.adId, t.createdAt)],
);

/** Crew accounts — lightweight (email + name), each with a unique pass code that
 *  powers the QR / paper pass and ties redemptions back to the holder. */
export const crewUsers = pgTable(
  "crew_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    name: text("name"),
    ship: text("ship"),
    port: text("port"),
    passCode: text("pass_code").notNull().unique(),
    points: integer("points").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
);

/** Crew referral log — a consumer signed up via a crew member's share link. */
export const crewReferrals = pgTable(
  "crew_referrals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    crewUserId: uuid("crew_user_id").references(() => crewUsers.id, { onDelete: "set null" }),
    consumerEmail: text("consumer_email"),
    port: text("port"),
    pointsAwarded: integer("points_awarded").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("crew_referrals_user_idx").on(t.crewUserId, t.createdAt)],
);

/** Pass shown / redeemed events — ties a crew member to a merchant perk. */
export const crewPassEvents = pgTable(
  "crew_pass_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    crewUserId: uuid("crew_user_id").references(() => crewUsers.id, { onDelete: "set null" }),
    merchantId: uuid("merchant_id").references(() => crewMerchants.id, { onDelete: "set null" }),
    kind: text("kind").notNull().default("shown"), // shown | redeem
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("crew_pass_events_user_idx").on(t.crewUserId, t.createdAt)],
);

/** Ticketed events / excursions with an adjustable per-venue revenue share. */
export const crewTickets = pgTable(
  "crew_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    merchantId: uuid("merchant_id").references(() => crewMerchants.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    description: text("description"),
    port: text("port").notNull().default("San Juan, Puerto Rico"),
    priceCents: integer("price_cents").notNull().default(0),
    revSharePct: integer("rev_share_pct").notNull().default(20), // CrewPerk's cut, per venue
    capacity: integer("capacity"),
    sold: integer("sold").notNull().default(0),
    imageUrl: text("image_url"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("crew_tickets_port_idx").on(t.port, t.status)],
);

export const crewTicketOrders = pgTable(
  "crew_ticket_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id").notNull().references(() => crewTickets.id, { onDelete: "cascade" }),
    crewUserId: uuid("crew_user_id").references(() => crewUsers.id, { onDelete: "set null" }),
    email: text("email"),
    qty: integer("qty").notNull().default(1),
    amountCents: integer("amount_cents").notNull().default(0),
    revShareCents: integer("rev_share_cents").notNull().default(0),
    status: text("status").notNull().default("reserved"), // reserved | paid | cancelled
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("crew_ticket_orders_ticket_idx").on(t.ticketId, t.createdAt)],
);
