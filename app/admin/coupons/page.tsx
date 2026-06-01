import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { listDiscountCoupons } from "@/src/billing/discount-coupons";
import { PageHeader, Card, SectionTitle, Field, Badge, Table, Tr, Td } from "@/app/_ui/primitives";
import { createCouponAction, toggleCouponAction } from "./actions";

export default async function CouponsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  await requireAuth(["god"]);
  const { err } = await searchParams;

  const [couponRows, tenantRows] = await Promise.all([
    listDiscountCoupons(),
    db.select({ id: tenants.id, domain: tenants.domain }).from(tenants),
  ]);

  const domainOf = new Map(tenantRows.map((t) => [t.id, t.domain]));

  return (
    <>
      <PageHeader title="Coupons" subtitle="Issue % discount codes — only you manage these." />

      {err && (
        <p className="mb-4 text-sm" style={{ color: "var(--neg)" }}>
          {err}
        </p>
      )}

      <Card className="mb-6">
        <SectionTitle>Create coupon</SectionTitle>
        <form action={createCouponAction} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input name="name" required className="input" />
          </Field>
          <Field label="Code" hint="what customers type at checkout">
            <input name="code" required className="input" />
          </Field>
          <Field label="White-label">
            <select name="tenantId" className="input">
              <option value="">Any white-label</option>
              {tenantRows.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.domain}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Percent off">
            <input type="number" name="percent" min={0} max={100} className="input" />
          </Field>
          <Field label="Duration">
            <select name="duration" className="input">
              <option value="1">1 month</option>
              <option value="2">2 months</option>
              <option value="3">3 months</option>
              <option value="forever">Forever</option>
            </select>
          </Field>
          <Field label="Max redemptions" hint="blank = unlimited">
            <input type="number" name="maxRedemptions" className="input" />
          </Field>
          <div className="sm:col-span-2">
            <button className="btn btn-primary">Create coupon</button>
          </div>
        </form>
      </Card>

      <Card>
        <SectionTitle>Coupons</SectionTitle>
        {couponRows.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No coupons yet. Create one above to start offering discounts.
          </p>
        ) : (
          <Table head={["Name", "Code", "White-label", "% off", "Duration", "Used", "Status", ""]}>
            {couponRows.map((c) => (
              <Tr key={c.id}>
                <Td>{c.name}</Td>
                <Td>
                  <span className="chip">{c.code}</span>
                </Td>
                <Td>{c.tenantId ? domainOf.get(c.tenantId) ?? "Any" : "Any"}</Td>
                <Td>{Number(c.value) * 100}%</Td>
                <Td>{c.durationMonths == null ? "Forever" : `${c.durationMonths} mo`}</Td>
                <Td>
                  {c.timesRedeemed}
                  {c.maxRedemptions != null ? "/" + c.maxRedemptions : ""}
                </Td>
                <Td>
                  <Badge tone={c.active ? "pos" : "neutral"}>{c.active ? "active" : "off"}</Badge>
                </Td>
                <Td>
                  <form action={toggleCouponAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="active" value={(!c.active).toString()} />
                    <button className="btn btn-ghost">{c.active ? "Disable" : "Enable"}</button>
                  </form>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
