import {
  pgTable,
  uuid,
  text,
  jsonb,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
