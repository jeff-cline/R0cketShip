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
  primary: "#111827",
  secondary: "#1f2937",
  accent: "#6366f1",
  background: "#0b1020",
  foreground: "#e5e7eb",
  fontFamily: "system-ui, sans-serif",
};

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
    ])
    .onConflictDoNothing({ target: tenants.domain });

  console.log("Seeded roofers.co and r0cketship.com");

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
