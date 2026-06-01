import { getCurrentTenant } from "@/src/tenant/context";
import { notFound } from "next/navigation";
import { BoldTemplate, TrustTemplate, DarkTemplate } from "@/app/_marketing/templates";

export default async function Page() {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  if (tenant.style === "trust") return <TrustTemplate tenant={tenant} />;
  if (tenant.style === "dark") return <DarkTemplate tenant={tenant} />;
  return <BoldTemplate tenant={tenant} />;
}
