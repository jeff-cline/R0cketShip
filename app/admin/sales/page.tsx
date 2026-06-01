import { requireAuth } from "@/src/auth/guard";
import { allReps } from "@/src/referral/reports";
import { getPlatformSettings } from "@/src/referral/core";
import { listPayoutBatches } from "@/src/referral/payouts";
import { payoutRailsConfigured } from "@/src/referral/disburse";
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
import {
  saveRatesAction,
  addRepAction,
  addSalesManagerAction,
  runPayoutAction,
  markPaidAction,
  disburseAction,
} from "./actions";

export const dynamic = "force-dynamic";

const usd = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (s: string) => {
  const n = Number(s);
  return Number.isFinite(n) ? String(Math.round(n * 1000) / 10) : "";
};

export default async function SalesPage() {
  const ctx = await requireAuth(["god", "sales_manager"]);
  const isGod = ctx.user.role === "god";

  const [reps, settings, batches, rails] = await Promise.all([
    allReps(),
    getPlatformSettings(),
    listPayoutBatches(),
    payoutRailsConfigured(),
  ]);

  const totalReferred = reps.reduce((s, r) => s + r.funnel.referred, 0);
  const totalUpgraded = reps.reduce((s, r) => s + r.funnel.upgraded, 0);
  const totalOwed = reps.reduce((s, r) => s + r.earnings.owed, 0);

  return (
    <div>
      <PageHeader
        title="Sales team"
        subtitle="Your reps, their referrals, and commission payouts."
      />

      {/* Totals */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sales reps" value={String(reps.length)} />
        <StatCard label="Total referred" value={String(totalReferred)} />
        <StatCard label="Total upgraded" value={String(totalUpgraded)} />
        <StatCard label="Total owed" value={usd(totalOwed)} accent />
      </div>

      {/* Rates — god only */}
      {isGod && (
        <Card className="mb-6">
          <SectionTitle hint="Stored as fractions; entered as percents.">
            Commission rates
          </SectionTitle>
          <form action={saveRatesAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Sales-rep rate %">
              <input
                className="input"
                type="number"
                step="0.1"
                name="salesRepRate"
                defaultValue={pct(settings.salesRepRate)}
              />
            </Field>
            <Field label="Default partner rate %">
              <input
                className="input"
                type="number"
                step="0.1"
                name="defaultPartnerRate"
                defaultValue={pct(settings.defaultPartnerRate)}
              />
            </Field>
            <Field label="Partner rate cap %">
              <input
                className="input"
                type="number"
                step="0.1"
                name="partnerRateCap"
                defaultValue={pct(settings.partnerRateCap)}
              />
            </Field>
            <Field label="White-label-landed rate %">
              <input
                className="input"
                type="number"
                step="0.1"
                name="whitelabelLandedRate"
                defaultValue={pct(settings.whitelabelLandedRate)}
              />
            </Field>
            <div className="sm:col-span-2 lg:col-span-4">
              <button type="submit" className="btn btn-primary">
                Save rates
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Add a rep (+ add sales manager for god) */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle hint="Role: partner + platform rep code.">Add a rep</SectionTitle>
          <form action={addRepAction} className="flex flex-col gap-4">
            <Field label="Email">
              <input className="input" type="email" name="email" required placeholder="rep@example.com" />
            </Field>
            <Field label="Temp password" hint="They use this for first login.">
              <input className="input" type="text" name="tempPassword" required />
            </Field>
            <div>
              <button type="submit" className="btn btn-primary">
                Create rep
              </button>
            </div>
          </form>
        </Card>

        {isGod && (
          <Card>
            <SectionTitle hint="Role: sales_manager (god's tenant).">Add sales manager</SectionTitle>
            <form action={addSalesManagerAction} className="flex flex-col gap-4">
              <Field label="Email">
                <input className="input" type="email" name="email" required placeholder="manager@example.com" />
              </Field>
              <Field label="Temp password">
                <input className="input" type="text" name="tempPassword" required />
              </Field>
              <div>
                <button type="submit" className="btn btn-primary">
                  Create sales manager
                </button>
              </div>
            </form>
          </Card>
        )}
      </div>

      {/* Reps table */}
      <Card className="mb-6">
        <SectionTitle hint="Rep links work on any white-label.">Reps</SectionTitle>
        {reps.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No reps yet. Add one above to generate a platform rep code.
          </p>
        ) : (
          <Table head={["Rep", "Code", "Referred", "Activated", "Upgraded", "Earned", "Owed"]}>
            {reps.map((r) => (
              <Tr key={r.userId}>
                <Td>
                  <div className="font-medium">{r.email}</div>
                  <div className="mt-0.5 text-xs" style={{ color: "var(--muted-2)" }}>
                    r0cketship.com/?ref={r.code}{" "}
                    <span style={{ color: "var(--muted)" }}>· works on any white-label</span>
                  </div>
                </Td>
                <Td>
                  <span className="chip">{r.code}</span>
                </Td>
                <Td>{r.funnel.referred}</Td>
                <Td>{r.funnel.activated}</Td>
                <Td>{r.funnel.upgraded}</Td>
                <Td>{usd(r.earnings.earned)}</Td>
                <Td>{usd(r.earnings.owed)}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      {/* Payout runs */}
      <Card>
        <SectionTitle hint="Run on the 21st for the prior month.">Payout runs</SectionTitle>
        <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
          Run on the 21st for the prior month; this rolls accrued commissions into a batch.
        </p>
        <form action={runPayoutAction} className="mb-5 flex flex-wrap items-end gap-4">
          <Field label="Month">
            <input className="input" type="month" name="month" required />
          </Field>
          <Field label="Scope">
            <select className="input" name="scope" defaultValue="platform">
              <option value="platform">Platform (reps)</option>
              <option value="tenant">Tenant (partners)</option>
              <option value="all">All</option>
            </select>
          </Field>
          <div>
            <button type="submit" className="btn btn-primary">
              Queue payout run
            </button>
          </div>
        </form>

        <p className="mb-3 text-sm" style={{ color: "var(--muted)" }}>
          PayPal {rails.paypal ? "✓ ready" : "✗ add keys"} · Stripe{" "}
          {rails.stripe ? "✓ ready" : "✗ add keys"}
          <span style={{ color: "var(--muted-2)" }}> — Configure keys under Admin → Integrations.</span>
        </p>

        {batches.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No payout runs yet.
          </p>
        ) : (
          <Table head={["Month", "Scope", "Status", "Total", "Created", ""]}>
            {batches.map((b) => (
              <Tr key={b.id}>
                <Td>{b.runMonth}</Td>
                <Td>{b.scope ?? "all"}</Td>
                <Td>
                  <Badge tone={b.status === "sent" ? "pos" : b.status === "failed" ? "neg" : "warn"}>
                    {b.status}
                  </Badge>
                </Td>
                <Td>{usd(Number(b.totalAmount))}</Td>
                <Td>{new Date(b.createdAt).toLocaleDateString()}</Td>
                <Td>
                  {b.status !== "sent" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={markPaidAction}>
                        <input type="hidden" name="batchId" value={b.id} />
                        <button type="submit" className="btn btn-ghost">
                          Mark paid
                        </button>
                      </form>
                      <form action={disburseAction}>
                        <input type="hidden" name="batchId" value={b.id} />
                        <button type="submit" className="btn btn-primary">
                          Pay via PayPal/Stripe
                        </button>
                      </form>
                    </div>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
