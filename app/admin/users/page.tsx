import { requireAuth } from "@/src/auth/guard";
import { listUsers } from "@/src/auth/users";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { createUserAction, setUserPasswordAction } from "@/app/admin/user-actions";
import { PageHeader, Card, SectionTitle, Field, Badge, Table, Tr, Td } from "@/app/_ui/primitives";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ set?: string }> }) {
  const ctx = await requireAuth(["god", "manager"]);
  const sp = await searchParams;
  const all = await listUsers({ role: ctx.user.role, tenantId: ctx.user.tenantId });
  const tlist = await db.select({ id: tenants.id, domain: tenants.domain }).from(tenants);
  const domainById = new Map(tlist.map((t) => [t.id, t.domain]));

  return (
    <>
      <PageHeader title="Users" subtitle={`${all.length} users${ctx.user.role === "god" ? " across all tenants" : ""}.`} />

      {sp.set && (
        <Card className="mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Badge tone="pos">Saved</Badge>
            <span>Password set. Share it with the owner — they can sign in immediately at their site&rsquo;s <code>/login</code>.</span>
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>Create user</SectionTitle>
        <form action={createUserAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Email"><input className="input" type="email" name="email" required placeholder="user@email" /></Field>
          <Field label="Tenant"><input className="input" name="tenantId" required placeholder="tenant uuid" /></Field>
          <Field label="Temp password"><input className="input" name="tempPassword" required placeholder="temp password" /></Field>
          <Field label="Role">
            <select className="input" name="role">
              <option value="manager">manager</option>
              <option value="customer">customer</option>
              <option value="agent">agent</option>
            </select>
          </Field>
          <div className="sm:col-span-2 lg:col-span-4"><button className="btn btn-primary">Create user</button></div>
        </form>
      </Card>

      <Card className="mt-6">
        <SectionTitle hint="passwords are hashed — they can't be viewed, only set">All users</SectionTitle>
        <Table head={["Email", "Role", "White-label", "Set login password"]}>
          {all.map((u) => (
            <Tr key={u.id}>
              <Td>
                <div className="font-medium">{u.email}</div>
                {u.mustResetPassword && <div className="text-xs" style={{ color: "var(--warn)" }}>must reset on next login</div>}
              </Td>
              <Td><Badge tone={u.role === "god" ? "accent" : "neutral"}>{u.role}</Badge></Td>
              <Td><span className="text-xs" style={{ color: "var(--muted)" }}>{domainById.get(u.tenantId) ?? u.tenantId}</span></Td>
              <Td>
                {u.role === "god" ? (
                  <span className="text-xs" style={{ color: "var(--muted-2)" }}>—</span>
                ) : (
                  <form action={setUserPasswordAction} className="flex items-center gap-1.5">
                    <input type="hidden" name="userId" value={u.id} />
                    <input name="password" type="text" placeholder="new password (≥6)" className="input" style={{ padding: "5px 8px", width: "180px" }} />
                    <button className="btn btn-ghost" style={{ padding: "5px 11px" }}>Set</button>
                  </form>
                )}
              </Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
