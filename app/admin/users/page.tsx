import { requireAuth } from "@/src/auth/guard";
import { listUsers } from "@/src/auth/users";
import { createUserAction } from "@/app/admin/user-actions";
import { PageHeader, Card, SectionTitle, Field, Badge, Table, Tr, Td } from "@/app/_ui/primitives";

export default async function UsersPage() {
  const ctx = await requireAuth(["god", "manager"]);
  const all = await listUsers({ role: ctx.user.role, tenantId: ctx.user.tenantId });

  return (
    <>
      <PageHeader
        title="Users"
        subtitle={`${all.length} users${ctx.user.role === "god" ? " across all tenants" : ""}.`}
      />

      <Card>
        <SectionTitle>Create user</SectionTitle>
        <form action={createUserAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Email">
            <input className="input" type="email" name="email" required placeholder="user@email" />
          </Field>
          <Field label="Tenant">
            <input className="input" name="tenantId" required placeholder="tenant uuid" />
          </Field>
          <Field label="Temp password">
            <input className="input" name="tempPassword" required placeholder="temp password" />
          </Field>
          <Field label="Role">
            <select className="input" name="role">
              <option value="manager">manager</option>
              <option value="customer">customer</option>
              <option value="agent">agent</option>
            </select>
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <button className="btn btn-primary">Create user</button>
          </div>
        </form>
      </Card>

      <Card className="mt-6">
        <SectionTitle>All users</SectionTitle>
        <Table head={["Email", "Role", "Tenant"]}>
          {all.map((u) => (
            <Tr key={u.id}>
              <Td>{u.email}</Td>
              <Td>
                <Badge tone={u.role === "god" ? "accent" : "neutral"}>{u.role}</Badge>
              </Td>
              <Td>
                <span className="text-xs" style={{ color: "var(--muted-2)" }}>{u.tenantId}</span>
              </Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
