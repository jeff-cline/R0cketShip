import "dotenv/config";
import { eq, isNull } from "drizzle-orm";
import { db, pool } from "./client";
import { tenants, users } from "./schema";
import { hashPassword } from "../auth/password";
import { generateIngestKey } from "../leads/ingest-key";
import type { TenantTheme, Offer } from "../tenant/types";

const roofersTheme: TenantTheme = {
  primary: "#0a3d62",
  secondary: "#3c6382",
  accent: "#e58e26",
  background: "#ffffff",
  foreground: "#0b132b",
  fontFamily: "system-ui, sans-serif",
};

const roofersOffers: Offer[] = [
  { id: 1, title: "Data / Leads", description: "All new high-intent leads in your ZIP, delivered daily.", price: "$1,500/mo per ZIP" },
  { id: 2, title: "Booking", description: "We email your leads and drive them to your booking link.", price: "$4,500/mo" },
  { id: 3, title: "E-Partnership", description: "Full done-for-you sales. Application only.", price: "Let's talk" },
];

const godTheme: TenantTheme = {
  primary: "#0e7490",
  secondary: "#155e75",
  accent: "#f97316",
  background: "#ffffff",
  foreground: "#0f2a33",
  fontFamily: "system-ui, sans-serif",
};

// worldchangers.ai — the joint Krystalore × R0cketShip landing site.
// Krystalore's brand teal leads; R0cketShip orange is the partner accent.
const worldChangersTheme: TenantTheme = {
  primary: "#0d7377", // Krystalore teal
  secondary: "#0f5257", // deep teal
  accent: "#ff5b2e", // R0cketShip orange
  background: "#ffffff",
  foreground: "#0b2a2c",
  fontFamily: "system-ui, sans-serif",
};

// The six THRIVE tiers, in ascending order. Rendered on the lander; also stored
// on the tenant so the offer data has one source of truth.
const worldChangersOffers: Offer[] = [
  { id: 1, title: "TRY", price: "$1,500/mo", description: "Zip predictive data — start seeing who's in-market in your ZIP.", features: ["ZIP predictive data", "Unlimited email support"] },
  { id: 2, title: "HELP", price: "$3,000/mo", description: "Consulting on top of your data — we help you act on it.", features: ["Everything in TRY", "Business + tech consulting"] },
  { id: 3, title: "RESPONSE", price: "$7,500/mo", description: "Predictive-data marketing that responds for you.", features: ["Everything in HELP", "Predictive-data marketing"] },
  { id: 4, title: "INTEGRATE", price: "$15,500/mo", description: "Keyword calls in a ZIP code, integrated into your funnel.", features: ["Everything in RESPONSE", "Keyword calls (ZIP code)"] },
  { id: 5, title: "VELOCITY", price: "$32,500/mo", description: "Quick-start. Keyword calls up to an entire state, plus immersive in-person live at our location.", features: ["Everything in INTEGRATE", "Keyword calls up to a full state", "Immersive in-person, live at our location"] },
  { id: 6, title: "EXPLODE", price: "$55,000/mo", description: "The Secret Weapon. Exclusive keyword calls (a new revenue stream) with in-person / onsite live consulting included.", features: ["Everything in VELOCITY", "Secret Weapon", "Exclusive keyword calls (+ new revenue stream)", "In-person / onsite live consulting included"] },
];

async function seed() {
  await db
    .insert(tenants)
    .values([
      {
        domain: "roofers.co",
        ip: "137.220.56.129",
        niche: "roofing",
        moneyWord: "roofing leads",
        logoUrl: null,
        theme: roofersTheme,
        offers: roofersOffers,
        monthlyPriceDefault: "1500",
        footerHtml: "<p>roofers.co — exclusive roofing leads by ZIP.</p>",
        activePaymentProvider: "stripe",
        status: "active",
      },
      {
        domain: "r0cketship.com",
        ip: "137.220.56.129",
        niche: "platform",
        moneyWord: "business leads",
        logoUrl: null,
        theme: godTheme,
        offers: [],
        monthlyPriceDefault: "0",
        footerHtml: "<p>R0cketShip — the white-label lead engine.</p>",
        activePaymentProvider: "stripe",
        status: "active",
      },
      {
        domain: "worldchangers.ai",
        ip: "137.220.56.129",
        niche: "founder growth",
        moneyWord: "high-intent leads",
        logoUrl: null,
        theme: worldChangersTheme,
        offers: worldChangersOffers,
        monthlyPriceDefault: "1500",
        footerHtml: "<p>worldchangers.ai — Krystalore × R0cketShip. People First. Tech-Backed.</p>",
        activePaymentProvider: "stripe",
        status: "active",
      },
    ])
    .onConflictDoNothing({ target: tenants.domain });

  console.log("Seeded roofers.co, r0cketship.com, worldchangers.ai");

  const [platform] = await db.select().from(tenants).where(eq(tenants.domain, "r0cketship.com")).limit(1);
  if (platform) {
    const existing = await db.select().from(users).where(eq(users.email, "jeff.cline@me.com")).limit(1);
    if (existing.length === 0) {
      await db.insert(users).values({
        tenantId: platform.id,
        email: "jeff.cline@me.com",
        passwordHash: await hashPassword("TEMP!234"),
        role: "god",
        mustResetPassword: true,
        name: "Jeff Cline",
      });
      console.log("Seeded God account jeff.cline@me.com (temp password, must reset)");
    } else {
      console.log("God account already present");
    }

    // Krystalore is the joint God partner — she manages Opportunities alongside Jeff.
    const kExisting = await db.select().from(users).where(eq(users.email, "krystalore@thecrewscoach.com")).limit(1);
    if (kExisting.length === 0) {
      await db.insert(users).values({
        tenantId: platform.id,
        email: "krystalore@thecrewscoach.com",
        passwordHash: await hashPassword("TEMP!234"),
        role: "god",
        mustResetPassword: true,
        name: "Krystalore Crews",
      });
      console.log("Seeded God account krystalore@thecrewscoach.com (temp password, must reset)");
    } else {
      console.log("Krystalore God account already present");
    }
  }

  const keyless = await db.select().from(tenants).where(isNull(tenants.ingestKey));
  for (const t of keyless) {
    await db.update(tenants).set({ ingestKey: generateIngestKey() }).where(eq(tenants.id, t.id));
  }
  if (keyless.length) console.log(`Backfilled ingest keys for ${keyless.length} tenant(s)`);

  await db.update(tenants).set({ signupBonusCredits: "50" }).where(isNull(tenants.signupBonusCredits));

  await pool.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
