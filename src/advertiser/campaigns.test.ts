import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db, pool } from "@/src/db/client";
import { advertiserCampaigns, advertisers } from "@/src/db/schema";
import {
  createCampaign,
  updateCampaign,
  pauseCampaign,
  resumeCampaign,
  listCampaigns,
  getCampaign,
  sanitizeEmailHtml,
  AUTO_APPROVE_USER_ID,
} from "@/src/advertiser/campaigns";

/**
 * The global tests/setup.ts truncate list does not include the advertiser tables.
 * Each test seeds its own advertiser and tears down advertiser_campaigns +
 * advertisers between specs so we get clean isolation without touching shared
 * setup.
 */
async function cleanAdvertiserTables(): Promise<void> {
  await pool.query("TRUNCATE TABLE advertiser_campaigns, advertiser_send_events, advertiser_click_events, advertiser_ledger, advertiser_payments, advertiser_intake, advertiser_sessions, advertiser_referrals, advertiser_referral_payouts, advertisers RESTART IDENTITY CASCADE");
}

async function makeAdvertiser(email = `adv-${Math.random().toString(36).slice(2, 10)}@example.com`): Promise<string> {
  const [row] = await db.insert(advertisers).values({
    email,
    passwordHash: "x",
    status: "approved",
    walletBalanceCents: 10_000,
  }).returning({ id: advertisers.id });
  return row.id;
}

const baseInput = (advertiserId: string) => ({
  advertiserId,
  name: "Test Campaign",
  emailSubject: "Hello",
  emailBodyHtml: "<p>Body</p>",
  ctaUrl: "https://example.com/landing",
  maxCpaCents: 500,
});

describe("sanitizeEmailHtml", () => {
  it("strips <script> blocks", () => {
    expect(sanitizeEmailHtml(`<p>hi</p><script>alert(1)</script>`)).toBe("<p>hi</p>");
  });
  it("strips <iframe> blocks", () => {
    expect(sanitizeEmailHtml(`<iframe src="evil"></iframe><p>ok</p>`)).toBe("<p>ok</p>");
  });
  it("strips on* event handler attributes", () => {
    const out = sanitizeEmailHtml(`<a href="x" onclick="bad()">go</a>`);
    expect(out).not.toMatch(/onclick/i);
    expect(out).toContain("href=\"x\"");
  });
  it("strips javascript: URLs", () => {
    const out = sanitizeEmailHtml(`<a href="javascript:alert(1)">x</a>`);
    expect(out).not.toMatch(/javascript:/i);
  });
});

describe("createCampaign", () => {
  beforeEach(async () => {
    await cleanAdvertiserTables();
  });

  it("creates a pending campaign when autoApprove=false", async () => {
    const advId = await makeAdvertiser();
    const { id, status } = await createCampaign(baseInput(advId), { autoApprove: false });
    expect(status).toBe("pending");
    const row = await getCampaign(id);
    expect(row?.status).toBe("pending");
    expect(row?.approvedAt).toBeNull();
    expect(row?.approvedByUserId).toBeNull();
  });

  it("creates an active campaign with sentinel approver when autoApprove=true", async () => {
    const advId = await makeAdvertiser();
    const { id, status } = await createCampaign(baseInput(advId), { autoApprove: true });
    expect(status).toBe("active");
    const row = await getCampaign(id);
    expect(row?.status).toBe("active");
    expect(row?.approvedAt).toBeInstanceOf(Date);
    expect(row?.approvedByUserId).toBe(AUTO_APPROVE_USER_ID);
  });

  it("enforces the $5 CPA floor on create (499 cents throws)", async () => {
    const advId = await makeAdvertiser();
    await expect(
      createCampaign({ ...baseInput(advId), maxCpaCents: 499 }, { autoApprove: true }),
    ).rejects.toThrow(/500/);
  });

  it("sanitizes <script> tags out of emailBodyHtml at write time", async () => {
    const advId = await makeAdvertiser();
    const { id } = await createCampaign(
      {
        ...baseInput(advId),
        emailBodyHtml: `<p>hi</p><script>alert('xss')</script><p>bye</p>`,
      },
      { autoApprove: true },
    );
    const row = await getCampaign(id);
    expect(row?.emailBodyHtml).not.toMatch(/<script/i);
    expect(row?.emailBodyHtml).toContain("<p>hi</p>");
    expect(row?.emailBodyHtml).toContain("<p>bye</p>");
  });
});

describe("updateCampaign", () => {
  beforeEach(async () => {
    await cleanAdvertiserTables();
  });

  it("blocks cross-advertiser edits with a 'not found' error", async () => {
    const advA = await makeAdvertiser("a@x.com");
    const advB = await makeAdvertiser("b@x.com");
    const { id } = await createCampaign(baseInput(advA), { autoApprove: true });
    await expect(updateCampaign(advB, id, { name: "stolen" })).rejects.toThrow(/not found/);
    const row = await getCampaign(id);
    expect(row?.name).toBe("Test Campaign");
  });

  it("applies a patch when the advertiser matches", async () => {
    const advA = await makeAdvertiser();
    const { id } = await createCampaign(baseInput(advA), { autoApprove: true });
    await updateCampaign(advA, id, { name: "renamed", maxCpaCents: 750 });
    const row = await getCampaign(id);
    expect(row?.name).toBe("renamed");
    expect(row?.maxCpaCents).toBe(750);
  });

  it("re-enforces the CPA floor on update", async () => {
    const advA = await makeAdvertiser();
    const { id } = await createCampaign(baseInput(advA), { autoApprove: true });
    await expect(updateCampaign(advA, id, { maxCpaCents: 100 })).rejects.toThrow(/500/);
  });

  it("re-sanitizes emailBodyHtml on update", async () => {
    const advA = await makeAdvertiser();
    const { id } = await createCampaign(baseInput(advA), { autoApprove: true });
    await updateCampaign(advA, id, { emailBodyHtml: `<p>x</p><iframe src="e"></iframe>` });
    const row = await getCampaign(id);
    expect(row?.emailBodyHtml).not.toMatch(/<iframe/i);
    expect(row?.emailBodyHtml).toContain("<p>x</p>");
  });
});

describe("pauseCampaign / resumeCampaign", () => {
  beforeEach(async () => {
    await cleanAdvertiserTables();
  });

  it("pause flips active → paused; resume flips it back", async () => {
    const advA = await makeAdvertiser();
    const { id } = await createCampaign(baseInput(advA), { autoApprove: true });
    await pauseCampaign(advA, id);
    expect((await getCampaign(id))?.status).toBe("paused");
    await resumeCampaign(advA, id);
    expect((await getCampaign(id))?.status).toBe("active");
  });

  it("pause refuses cross-advertiser access", async () => {
    const advA = await makeAdvertiser("a@x.com");
    const advB = await makeAdvertiser("b@x.com");
    const { id } = await createCampaign(baseInput(advA), { autoApprove: true });
    await expect(pauseCampaign(advB, id)).rejects.toThrow(/not found/);
  });

  it("resume refuses to lift a rejected/frozen status", async () => {
    const advA = await makeAdvertiser();
    const { id } = await createCampaign(baseInput(advA), { autoApprove: true });
    // Force the campaign into "rejected" via raw update — simulates god-side action.
    await db.update(advertiserCampaigns).set({ status: "rejected" }).where(eq(advertiserCampaigns.id, id));
    await expect(resumeCampaign(advA, id)).rejects.toThrow(/cannot resume/);
  });
});

describe("listCampaigns", () => {
  beforeEach(async () => {
    await cleanAdvertiserTables();
  });

  it("returns advertiser-scoped campaigns newest first", async () => {
    const advA = await makeAdvertiser("a@x.com");
    const advB = await makeAdvertiser("b@x.com");
    const c1 = await createCampaign({ ...baseInput(advA), name: "first" }, { autoApprove: true });
    // Force a different createdAt to guarantee ordering.
    await db.update(advertiserCampaigns)
      .set({ createdAt: new Date(Date.now() - 60_000) })
      .where(eq(advertiserCampaigns.id, c1.id));
    await createCampaign({ ...baseInput(advA), name: "second" }, { autoApprove: true });
    await createCampaign({ ...baseInput(advB), name: "other-advertiser" }, { autoApprove: true });

    const rows = await listCampaigns(advA);
    expect(rows.map((r) => r.name)).toEqual(["second", "first"]);
  });
});
