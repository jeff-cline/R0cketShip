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
