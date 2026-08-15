"use server";
/**
 * `/advertise/signup` server action.
 *
 * Orchestrates the full advertiser signup flow:
 *   1. Parse + validate the multi-section form.
 *   2. Always record the attempt (rate-limit history is the source of truth).
 *   3. Apply email/IP rate limits and tenant separation.
 *   4. Create the advertiser (status=pending, email_verify_token minted).
 *   5. Best-effort write the long-form intake row (non-fatal if it fails).
 *   6. Best-effort resolve `?ref=` and create an `advertiserReferrals` row.
 *   7. Send the verification email through the platform mailbox pool.
 *   8. Redirect to /advertise/signup/check-email?e=<email>.
 *
 * The $10 signup bonus is NOT granted here — it lives on the verify-click
 * path in `verifyAdvertiserEmail` so unverified mailbombs don't drain budget.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { advertiserIntake, advertiserReferrals, referralCodes, users } from "@/src/db/schema";
import { createAdvertiser } from "@/src/auth/advertiser";
import {
  checkSignupRateLimit,
  checkTenantSeparation,
  recordSignupAttempt,
} from "@/src/auth/advertiser_signup_guards";
import { parseSignupForm, validateSignup } from "@/src/auth/advertiser_signup_form";
import { sendViaPool, platformTenantId } from "@/src/email/mailbox";

export type SignupActionState = { error: string | null };

const VERIFY_BASE_URL = "https://r0cketship.com";
const REFERRAL_WINDOW_MONTHS = 12;
const REFERRAL_COMMISSION_PCT = 15;

function getClientIp(forwardedFor: string | null, fallbackHost: string | null): string | null {
  if (forwardedFor) {
    // First IP in the comma-separated list is the original client.
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return fallbackHost;
}

type ReferrerKind = "customer" | "tenant_manager" | "agent" | "external";

function roleToReferrerKind(role: string): ReferrerKind {
  switch (role) {
    case "customer":
      return "customer";
    case "manager":
    case "god":
      return "tenant_manager";
    case "agent":
      return "agent";
    default:
      return "external";
  }
}

/** Best-effort referral attribution. Never throws. */
async function attachReferralIfAny(advertiserId: string, refCode: string | null): Promise<void> {
  if (!refCode) return;
  try {
    const code = refCode.trim().toUpperCase();
    if (!code) return;
    const rc = (
      await db.select().from(referralCodes).where(eq(referralCodes.code, code)).limit(1)
    )[0];
    if (!rc) return;
    const ownerRows = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, rc.ownerUserId))
      .limit(1);
    const owner = ownerRows[0];
    if (!owner) return;
    const windowEndsAt = new Date();
    windowEndsAt.setMonth(windowEndsAt.getMonth() + REFERRAL_WINDOW_MONTHS);
    await db.insert(advertiserReferrals).values({
      advertiserId,
      referrerUserId: owner.id,
      referrerKind: roleToReferrerKind(owner.role),
      commissionPct: REFERRAL_COMMISSION_PCT,
      windowEndsAt,
    });
  } catch (e) {
    // Referral attribution is supplementary — log and proceed.
    console.error("[advertiser_signup] referral attach failed:", e);
  }
}

function verificationEmailHtml(verifyUrl: string): string {
  // Dark-themed, brand-matched HTML. Inline styles only — most clients strip <style>.
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#050608;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#050608;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;background:#0B0D11;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 32px 16px 32px;">
          <div style="font-size:11px;font-weight:800;letter-spacing:0.32em;color:#FF6B35;text-transform:uppercase;margin-bottom:8px;">r0cketship · #ARTLAB</div>
          <h1 style="font-size:28px;font-weight:900;color:#FFFFFF;letter-spacing:-0.02em;line-height:1.15;margin:0 0 16px 0;">Verify your advertiser account</h1>
          <p style="font-size:15px;line-height:1.6;color:#E5E7EB;margin:0 0 20px 0;">Welcome aboard. Confirm your email to activate your account and claim <strong style="color:#FFFFFF;">$10 in free advertising credit</strong>.</p>
          <p style="margin:24px 0;">
            <a href="${verifyUrl}" style="display:inline-block;background:#FF6B35;color:#FFFFFF;font-weight:800;font-size:15px;text-decoration:none;padding:14px 28px;border-radius:999px;">Verify email →</a>
          </p>
          <p style="font-size:13px;color:#A1A1AA;line-height:1.55;margin:24px 0 0 0;">Or paste this link into your browser:</p>
          <p style="font-size:12px;color:#6B7280;word-break:break-all;margin:6px 0 0 0;"><a href="${verifyUrl}" style="color:#A1A1AA;">${verifyUrl}</a></p>
        </td></tr>
        <tr><td style="padding:20px 32px 28px 32px;border-top:1px solid rgba(255,255,255,0.08);">
          <p style="font-size:11px;color:#6B7280;line-height:1.6;margin:0;">This link expires in 24 hours. If you didn't request this, you can safely ignore the email.</p>
          <p style="font-size:11px;color:#6B7280;line-height:1.6;margin:8px 0 0 0;">Forward and upward only. #ARTLAB · r0cketship</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendVerificationEmail(email: string, token: string): Promise<void> {
  try {
    const verifyUrl = `${VERIFY_BASE_URL}/advertise/verify?token=${encodeURIComponent(token)}`;
    const tenantId = await platformTenantId();
    if (!tenantId) {
      console.warn("[advertiser_signup] platform tenant not found — email skipped:", email);
      return;
    }
    await sendViaPool(
      tenantId,
      {
        to: email,
        subject: "Verify your r0cketship advertiser account",
        html: verificationEmailHtml(verifyUrl),
      },
      "manual",
    );
  } catch (e) {
    console.error("[advertiser_signup] verify email send failed:", e);
  }
}

export async function signUpAdvertiserAction(
  _prev: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {
  // 1. Parse + validate.
  const parsed = parseSignupForm(formData);
  const validationError = validateSignup(parsed);
  if (validationError) return { error: validationError };

  // 2. Get IP for rate-limit + audit.
  const h = await headers();
  const ip = getClientIp(h.get("x-forwarded-for"), h.get("host"));

  // 3. Always record the attempt BEFORE evaluating rate limit — abuse attempts
  //    that fail validation/guards should still count toward the per-IP cap.
  await recordSignupAttempt({ email: parsed.email, ip });

  // 4. Apply guards: rate limit + tenant separation.
  const rateLimit = await checkSignupRateLimit({ email: parsed.email, ip });
  if (!rateLimit.ok) {
    if (rateLimit.reason === "email_already_registered") {
      return { error: "An account already exists for this email. Try signing in." };
    }
    return {
      error: "Too many signup attempts from this network. Please try again in 24 hours.",
    };
  }

  const tenantSep = await checkTenantSeparation({ email: parsed.email });
  if (!tenantSep.ok) {
    return {
      error:
        "This email is already associated with a tenant account at r0cketship. Advertiser accounts must use a separate email.",
    };
  }

  // 5. Create the advertiser account (status=pending, verify token minted).
  let advertiserId: string;
  let emailVerifyToken: string;
  try {
    const created = await createAdvertiser({
      email: parsed.email,
      password: parsed.password,
      displayName: parsed.displayName ?? undefined,
    });
    advertiserId = created.advertiserId;
    emailVerifyToken = created.emailVerifyToken;
  } catch (e) {
    console.error("[advertiser_signup] createAdvertiser failed:", e);
    return { error: "We couldn't create your account. Please try again in a moment." };
  }

  // 6. Best-effort intake row. The advertiser already exists at this point, so
  //    a failure here should not block the user from getting a verify email.
  try {
    await db.insert(advertiserIntake).values({
      advertiserId,
      phone: parsed.phone || null,
      businessName: parsed.businessName || null,
      businessUrl: parsed.businessUrl,
      industry: parsed.industry,
      employeeCountBand: parsed.employeeCountBand,
      annualRevenueBand: parsed.annualRevenueBand,
      yearsInBusiness: parsed.yearsInBusiness,
      dunsNumber: parsed.dunsNumber,
      ownershipType: parsed.ownershipType,
      customerLtvCents: parsed.customerLtvCents,
      typicalCacCents: parsed.typicalCacCents,
      targetKpi: parsed.targetKpi,
      targetGeographyText: parsed.targetGeographyText,
      monthlyAdBudgetCents: parsed.monthlyAdBudgetCents,
      referralSource: parsed.referralSource,
      offerPath: parsed.offerPath,
      aboutBusiness: parsed.aboutBusiness,
    });
  } catch (e) {
    console.error("[advertiser_signup] intake insert failed:", e);
  }

  // 7. Best-effort referral attribution.
  await attachReferralIfAny(advertiserId, parsed.refCode);

  // 8. Best-effort verification email send (logged + non-fatal so god-admin can resend).
  await sendVerificationEmail(parsed.email, emailVerifyToken);

  // 9. Redirect to confirmation page. `redirect` throws to abort the action.
  redirect(`/advertise/signup/check-email?e=${encodeURIComponent(parsed.email)}`);
}
