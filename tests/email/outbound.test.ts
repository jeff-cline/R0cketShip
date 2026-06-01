import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, emailMailboxes } from "@/src/db/schema";
import { remainingToday, pickMailbox, poolCapacity } from "@/src/email/mailbox";
import { requestPasswordReset, verifyResetToken, completePasswordReset } from "@/src/email/reset";
import { createUser } from "@/src/auth/users";
import { encryptSecret } from "@/src/crypto/secrets";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
const todayStr = () => new Date().toISOString().slice(0, 10);
let tId: string;
beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "roofing leads", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tId = t.id;
});

describe("mailbox pool rotation", () => {
  it("remainingToday resets when the date rolls over", () => {
    const base = { dailyCap: 50, sentToday: 50, sentDate: todayStr() } as Parameters<typeof remainingToday>[0];
    expect(remainingToday(base)).toBe(0);
    expect(remainingToday({ ...base, sentDate: "2000-01-01" })).toBe(50);
  });

  it("picks an active mailbox with capacity and SMTP creds; skips capped/credential-less ones", async () => {
    await db.insert(emailMailboxes).values({ tenantId: tId, address: "capped@roofers.co", status: "active", smtpHost: "smtp.x", smtpUser: "u", smtpPassEnc: encryptSecret("p"), dailyCap: 5, sentToday: 5, sentDate: todayStr() });
    await db.insert(emailMailboxes).values({ tenantId: tId, address: "nocreds@roofers.co", status: "active", dailyCap: 50 });
    await db.insert(emailMailboxes).values({ tenantId: tId, address: "good@roofers.co", status: "active", smtpHost: "smtp.x", smtpUser: "u", smtpPassEnc: encryptSecret("p"), dailyCap: 50 });

    const picked = await pickMailbox(tId);
    expect(picked?.address).toBe("good@roofers.co");

    const cap = await poolCapacity(tId);
    expect(cap.mailboxes).toBe(3);
    expect(cap.remaining).toBe(100); // good=50 + nocreds=50 + capped=0
  });

  it("returns null when no mailbox has capacity", async () => {
    await db.insert(emailMailboxes).values({ tenantId: tId, address: "x@roofers.co", status: "active", smtpHost: "s", smtpUser: "u", smtpPassEnc: encryptSecret("p"), dailyCap: 1, sentToday: 1, sentDate: todayStr() });
    expect(await pickMailbox(tId)).toBeNull();
  });
});

describe("password reset", () => {
  it("issues, verifies, and consumes a reset token", async () => {
    const user = await createUser({ role: "god", tenantId: tId }, { tenantId: tId, email: "owner@roofers.co", role: "manager", tempPassword: "x" });
    const r = await requestPasswordReset(tId, "owner@roofers.co", "https://roofers.co");
    expect(r.sent).toBe(true);
    const v = await verifyResetToken(r.token!);
    expect(v?.userId).toBe(user.id);
    expect(await completePasswordReset(r.token!, "newpassword123")).toBe(true);
    // token is single-use
    expect(await verifyResetToken(r.token!)).toBeNull();
  });

  it("does not reveal whether an email exists", async () => {
    const r = await requestPasswordReset(tId, "nobody@roofers.co", "https://roofers.co");
    expect(r.sent).toBe(false);
  });
});
