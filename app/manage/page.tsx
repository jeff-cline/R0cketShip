import { redirect } from "next/navigation";

// The manager "team" page is retired — owners now use the full console at /admin
// (members, leads, billing, email, users). Team management lives under /admin/users.
export default async function ManagePage() {
  redirect("/admin/users");
}
