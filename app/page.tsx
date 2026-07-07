import { headers } from "next/headers";
import { getCurrentTenant } from "@/src/tenant/context";
import { notFound } from "next/navigation";
import { BoldTemplate, TrustTemplate, DarkTemplate } from "@/app/_marketing/templates";
import { HubLander } from "@/app/_marketing/hub/HubLander";
import { WorldChangersLander } from "@/app/_marketing/worldchangers/WorldChangersLander";
import { CrewHome } from "@/app/_crew/CrewHome";
import { ConsumerHome } from "@/app/_crew/ConsumerHome";

export default async function Page() {
  // Host-routed standalone apps (not lead-gen white-label tenants):
  //   crewperk.com → the crew app · cruise.plus → the consumer master.
  const host = (await headers()).get("host")?.replace(/^www\./, "").split(":")[0] ?? "";
  if (host === "crewperk.com") return <CrewHome />;
  if (host === "cruise.plus") return <ConsumerHome />;

  const tenant = await getCurrentTenant();
  if (!tenant) notFound();

  // worldchangers.ai gets its bespoke Krystalore × R0cketShip lander.
  if (tenant.domain.replace(/^www\./, "") === "worldchangers.ai") return <WorldChangersLander tenant={tenant} />;

  // The r0cketship.com hub gets the bold orange/black statement lander.
  // Every white-label keeps its existing template — unchanged.
  const isHub = tenant.domain.replace(/^www\./, "") === "r0cketship.com";
  if (isHub) return <HubLander tenant={tenant} />;

  if (tenant.style === "trust") return <TrustTemplate tenant={tenant} />;
  if (tenant.style === "dark") return <DarkTemplate tenant={tenant} />;
  return <BoldTemplate tenant={tenant} />;
}
