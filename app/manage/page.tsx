import { requireAuth } from "@/src/auth/guard";
import { listUsers } from "@/src/auth/users";
import { logoutAction } from "@/app/logout/actions";
import { ImpersonationBanner } from "@/app/_components/ImpersonationBanner";
import { createUserAction, resetUserAction, impersonateAction } from "@/app/admin/user-actions";
import { PageHeader, Card, SectionTitle, Table, Tr, Td } from "@/app/_ui/primitives";

export default async function ManagePage() {
  const ctx = await requireAuth(["manager"]);
  const team = await listUsers({ role: ctx.user.role, tenantId: ctx.user.tenantId });
  const customers = team.filter((u) => u.role === "customer");
  return (
    <>
      <ImpersonationBanner />
      <div className="min-h-screen" style={{ background: "var(--bg-app)" }}>
        <div className="mx-auto max-w-4xl px-6 py-10">
          <PageHeader
            title={`Manager — ${ctx.tenant.domain}`}
            subtitle="Your team."
            actions={
              <form action={logoutAction}>
                <button className="btn btn-ghost">Log out</button>
              </form>
            }
          />

          <Card pad className="mb-6">
            <SectionTitle>Add customer</SectionTitle>
            <form action={createUserAction} className="flex flex-wrap items-end gap-3">
              <input name="email" type="email" placeholder="customer@email" required className="input flex-1" style={{ minWidth: "16rem" }} />
              <input name="tempPassword" placeholder="temp password" required className="input" />
              <input type="hidden" name="role" value="customer" />
              <button className="btn btn-primary">Add customer</button>
            </form>
          </Card>

          <Card pad={false}>
            <Table head={["Customer", "Actions"]}>
              {customers.map((u) => (
                <Tr key={u.id}>
                  <Td>{u.email}</Td>
                  <Td>
                    <div className="flex flex-wrap items-center gap-3">
                      <form action={impersonateAction}>
                        <input type="hidden" name="userId" value={u.id} />
                        <button className="btn btn-ghost">Impersonate</button>
                      </form>
                      <form action={resetUserAction} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={u.id} />
                        <input name="tempPassword" placeholder="new temp" className="input" />
                        <button className="btn btn-ghost">Reset</button>
                      </form>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
          </Card>
        </div>
      </div>
    </>
  );
}
