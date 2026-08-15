/**
 * Phase 2 Task 16: advertiser detail (god view).
 *
 * Five sections on one page (no tabs — we keep it scroll-paged so god can scan
 * the whole account in one breath):
 *   - Profile (advertiser + intake fields)
 *   - Status controls (approve / freeze / unfreeze / suspend)
 *   - Wallet (balance + ledger + four mutation forms)
 *   - Campaigns (list with per-pending approve/reject)
 *
 * All mutation forms route through `../actions.ts` so the auth + revalidation
 * logic lives in one place.
 */
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import {
  advertiserCampaigns,
  advertiserIntake,
  advertiserLedger,
  advertisers,
} from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  PageHeader,
  Card,
  SectionTitle,
  StatCard,
  Badge,
  Field,
  Table,
  Tr,
  Td,
} from "@/app/_ui/primitives";
import { walletBalance } from "@/src/advertiser/wallet";
import {
  adminGrantAction,
  adminRefundAction,
  applyCouponAction,
  approveAdvertiserAction,
  approveCampaignAction,
  depositManualAction,
  freezeAdvertiserAction,
  rejectCampaignAction,
  suspendAdvertiserAction,
  unfreezeAdvertiserAction,
} from "../actions";

const usd = (cents: number) => "$" + (cents / 100).toFixed(2);

function statusTone(s: string): "neutral" | "pos" | "neg" | "warn" | "accent" {
  if (s === "approved" || s === "active") return "pos";
  if (s === "pending") return "warn";
  if (s === "frozen" || s === "paused" || s === "out_of_budget") return "neutral";
  if (s === "suspended" || s === "rejected") return "neg";
  return "neutral";
}

function ledgerLabel(t: string): string {
  switch (t) {
    case "signup_bonus":
      return "Signup bonus";
    case "deposit":
      return "Deposit";
    case "click_charge":
      return "Click charge";
    case "refund_admin":
      return "Refund (admin)";
    case "coupon_grant":
      return "Coupon grant";
    case "admin_grant":
      return "Admin grant";
    default:
      return t;
  }
}

export default async function AdvertiserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  await requireAuth(["god"]);
  const { id } = await params;
  const { ok, err } = await searchParams;

  const adv = (
    await db.select().from(advertisers).where(eq(advertisers.id, id)).limit(1)
  )[0];
  if (!adv) notFound();

  const intake =
    (await db.select().from(advertiserIntake).where(eq(advertiserIntake.advertiserId, id)).limit(1))[0] ??
    null;

  const balance = await walletBalance(id);
  const ledger = await db
    .select()
    .from(advertiserLedger)
    .where(eq(advertiserLedger.advertiserId, id))
    .orderBy(desc(advertiserLedger.createdAt))
    .limit(50);

  const camps = await db
    .select()
    .from(advertiserCampaigns)
    .where(eq(advertiserCampaigns.advertiserId, id))
    .orderBy(desc(advertiserCampaigns.createdAt));

  return (
    <>
      <PageHeader
        title={adv.email}
        subtitle={adv.displayName ?? intake?.businessName ?? "Advertiser account"}
        actions={
          <a className="btn btn-ghost" href="/admin/advertisers">
            ← All advertisers
          </a>
        }
      />

      {ok && (
        <div className="mb-4">
          <Card>
            <div className="flex items-center gap-3 text-sm">
              <Badge tone="pos">Saved</Badge>
              <span>Update applied.</span>
            </div>
          </Card>
        </div>
      )}
      {err && (
        <div className="mb-4">
          <Card>
            <div className="flex items-center gap-3 text-sm" style={{ color: "var(--neg)" }}>
              <Badge tone="neg">Error</Badge>
              <span>{err}</span>
            </div>
          </Card>
        </div>
      )}

      {/* ---- Profile ---- */}
      <Card className="mb-6">
        <SectionTitle>Profile</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileRow label="Email" value={adv.email} />
          <ProfileRow
            label="Status"
            value={<Badge tone={statusTone(adv.status)}>{adv.status}</Badge>}
          />
          <ProfileRow label="Display name" value={adv.displayName ?? "—"} />
          <ProfileRow
            label="Created"
            value={new Date(adv.createdAt).toLocaleString()}
          />
          <ProfileRow
            label="Email verified"
            value={adv.emailVerifiedAt ? new Date(adv.emailVerifiedAt).toLocaleString() : "Not verified"}
          />
          <ProfileRow label="Business name" value={intake?.businessName ?? "—"} />
          <ProfileRow
            label="Business URL"
            value={
              intake?.businessUrl ? (
                <a href={intake.businessUrl} target="_blank" rel="noreferrer" style={{ color: "var(--color-accent)" }}>
                  {intake.businessUrl} ↗
                </a>
              ) : (
                "—"
              )
            }
          />
          <ProfileRow label="Industry" value={intake?.industry ?? "—"} />
          <ProfileRow label="Phone" value={intake?.phone ?? "—"} />
          <ProfileRow label="Employees" value={intake?.employeeCountBand ?? "—"} />
          <ProfileRow label="Annual revenue" value={intake?.annualRevenueBand ?? "—"} />
          <ProfileRow label="Years in business" value={intake?.yearsInBusiness?.toString() ?? "—"} />
          <ProfileRow label="Ownership type" value={intake?.ownershipType ?? "—"} />
          <ProfileRow label="DUNS" value={intake?.dunsNumber ?? "—"} />
          <ProfileRow
            label="Customer LTV"
            value={intake?.customerLtvCents ? usd(intake.customerLtvCents) : "—"}
          />
          <ProfileRow
            label="Typical CAC"
            value={intake?.typicalCacCents ? usd(intake.typicalCacCents) : "—"}
          />
          <ProfileRow label="Target KPI" value={intake?.targetKpi ?? "—"} />
          <ProfileRow
            label="Monthly ad budget"
            value={intake?.monthlyAdBudgetCents ? usd(intake.monthlyAdBudgetCents) : "—"}
          />
          <ProfileRow label="Geography" value={intake?.targetGeographyText ?? "—"} />
          <ProfileRow label="Offer path" value={intake?.offerPath ?? "—"} />
          <ProfileRow label="Referral source" value={intake?.referralSource ?? "—"} />
          {intake?.aboutBusiness && (
            <div className="sm:col-span-2">
              <div className="label">About business</div>
              <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>{intake.aboutBusiness}</p>
            </div>
          )}
        </div>
      </Card>

      {/* ---- Status controls ---- */}
      <Card className="mb-6">
        <SectionTitle hint="Approve to activate · freeze pauses spend · suspend disables login">
          Status controls
        </SectionTitle>
        <div className="flex flex-wrap gap-2">
          {adv.status !== "approved" && (
            <form action={approveAdvertiserAction}>
              <input type="hidden" name="advertiserId" value={adv.id} />
              <button className="btn btn-primary">Approve</button>
            </form>
          )}
          {adv.status !== "frozen" && adv.status !== "suspended" && (
            <form action={freezeAdvertiserAction}>
              <input type="hidden" name="advertiserId" value={adv.id} />
              <button className="btn btn-ghost">Freeze</button>
            </form>
          )}
          {adv.status === "frozen" && (
            <form action={unfreezeAdvertiserAction}>
              <input type="hidden" name="advertiserId" value={adv.id} />
              <button className="btn btn-primary">Unfreeze</button>
            </form>
          )}
          {adv.status !== "suspended" && (
            <form action={suspendAdvertiserAction}>
              <input type="hidden" name="advertiserId" value={adv.id} />
              <button className="btn btn-ghost" style={{ color: "var(--neg)" }}>
                Suspend
              </button>
            </form>
          )}
        </div>
      </Card>

      {/* ---- Wallet ---- */}
      <Card className="mb-6">
        <SectionTitle>Wallet</SectionTitle>
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <StatCard label="Current balance" value={usd(balance)} accent />
          <StatCard label="Ledger entries" value={String(ledger.length)} />
          <StatCard
            label="Account status"
            value={adv.status}
            sub={adv.emailVerifiedAt ? "verified" : "unverified"}
          />
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border p-4" style={{ borderColor: "var(--line)" }}>
            <div className="mb-3 text-sm font-bold" style={{ color: "var(--muted)" }}>
              Mark deposit paid
            </div>
            <form action={depositManualAction} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="advertiserId" value={adv.id} />
              <Field label="Amount (USD)" hint="min $1,000">
                <input
                  type="number"
                  step="0.01"
                  min="1000"
                  name="amount"
                  className="input"
                  required
                />
              </Field>
              <Field label="Invoice / ref">
                <input name="providerRef" className="input" />
              </Field>
              <button className="btn btn-primary">Record deposit</button>
            </form>
          </div>

          <div className="rounded-[var(--radius-lg)] border p-4" style={{ borderColor: "var(--line)" }}>
            <div className="mb-3 text-sm font-bold" style={{ color: "var(--muted)" }}>
              Grant credit (admin grant)
            </div>
            <form action={adminGrantAction} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="advertiserId" value={adv.id} />
              <Field label="Amount (USD)">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="amount"
                  className="input"
                  required
                />
              </Field>
              <Field label="Reason">
                <input name="reason" className="input" />
              </Field>
              <button className="btn btn-primary">Grant</button>
            </form>
          </div>

          <div className="rounded-[var(--radius-lg)] border p-4" style={{ borderColor: "var(--line)" }}>
            <div className="mb-3 text-sm font-bold" style={{ color: "var(--muted)" }}>
              Apply coupon
            </div>
            <form action={applyCouponAction} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="advertiserId" value={adv.id} />
              <Field label="Coupon code">
                <input name="couponCode" className="input" required />
              </Field>
              <button className="btn btn-primary">Apply</button>
            </form>
          </div>

          <div className="rounded-[var(--radius-lg)] border p-4" style={{ borderColor: "var(--line)" }}>
            <div className="mb-3 text-sm font-bold" style={{ color: "var(--muted)" }}>
              Issue refund (admin refund)
            </div>
            <form action={adminRefundAction} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="advertiserId" value={adv.id} />
              <Field label="Amount (USD)">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="amount"
                  className="input"
                  required
                />
              </Field>
              <Field label="Reason">
                <input name="reason" className="input" />
              </Field>
              <button className="btn btn-ghost" style={{ color: "var(--neg)" }}>
                Refund
              </button>
            </form>
          </div>
        </div>

        <SectionTitle>Ledger (last 50)</SectionTitle>
        {ledger.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>No ledger entries yet.</p>
        ) : (
          <Table head={["Date", "Type", "Amount", "Ref"]}>
            {ledger.map((e) => (
              <Tr key={e.id}>
                <Td>
                  <span className="text-xs" style={{ color: "var(--muted-2)" }}>
                    {new Date(e.createdAt).toLocaleString()}
                  </span>
                </Td>
                <Td>{ledgerLabel(e.type)}</Td>
                <Td
                  className="font-semibold tabular-nums"
                  // The Td primitive doesn't accept inline style — wrap.
                >
                  <span style={{ color: e.deltaCents >= 0 ? "var(--pos)" : "var(--neg)" }}>
                    {e.deltaCents >= 0 ? "+" : ""}
                    {usd(e.deltaCents)}
                  </span>
                </Td>
                <Td>
                  <span className="text-xs" style={{ color: "var(--muted-2)" }}>{e.refId ?? "—"}</span>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      {/* ---- Campaigns ---- */}
      <Card>
        <SectionTitle>Campaigns ({camps.length})</SectionTitle>
        {camps.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>No campaigns yet.</p>
        ) : (
          <Table head={["Name", "Status", "Max CPA", "Sends", "Clicks", "Spend", ""]}>
            {camps.map((c) => (
              <Tr key={c.id}>
                <Td>
                  <a
                    href={`/admin/advertisers/${adv.id}/campaigns/${c.id}`}
                    className="font-medium"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {c.name}
                  </a>
                  <div className="text-xs" style={{ color: "var(--muted-2)" }}>{c.emailSubject}</div>
                </Td>
                <Td>
                  <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                </Td>
                <Td className="tabular-nums">{usd(c.maxCpaCents)}</Td>
                <Td className="tabular-nums">{c.totalSends.toLocaleString()}</Td>
                <Td className="tabular-nums">{c.totalClicks.toLocaleString()}</Td>
                <Td className="tabular-nums">{usd(c.totalSpendCents)}</Td>
                <Td>
                  {c.status === "pending" ? (
                    <div className="flex justify-end gap-2">
                      <form action={approveCampaignAction}>
                        <input type="hidden" name="campaignId" value={c.id} />
                        <input type="hidden" name="advertiserId" value={adv.id} />
                        <button className="btn btn-primary" style={{ padding: "6px 10px" }}>
                          Approve
                        </button>
                      </form>
                      <form action={rejectCampaignAction}>
                        <input type="hidden" name="campaignId" value={c.id} />
                        <input type="hidden" name="advertiserId" value={adv.id} />
                        <button className="btn btn-ghost" style={{ padding: "6px 10px" }}>
                          Reject
                        </button>
                      </form>
                    </div>
                  ) : null}
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

function ProfileRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}
