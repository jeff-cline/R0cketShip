import type { Metadata } from "next";
import { getAuthContext } from "@/src/auth/context";
import { getBdPartnerByUserId, getSalesCode, salesAffiliateLink, opportunityAffiliateLink, recruitLink } from "@/src/bd/partners";
import { partnerLeadCount, listInvestorLeadsForPartner } from "@/src/bd/leads";
import RadarAuth from "./RadarAuth";
import RadarDashboard from "./RadarDashboard";

export const metadata: Metadata = {
  title: { absolute: "R0cketShip Radar" },
  description: "R0cketShip Radar — the partner command center. One login to earn across the network and refer investors into the opportunity.",
  robots: { index: false },
  openGraph: {
    title: "R0cketShip Radar",
    description: "The partner command center — sell across the network and refer investors, from one login.",
    url: "https://r0cketship.com/radar",
    images: [{ url: "/og-rocket.png", width: 1200, height: 630, alt: "R0cketShip" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "R0cketShip Radar",
    description: "The partner command center — sell across the network and refer investors, from one login.",
    images: ["/og-rocket.png"],
  },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ sponsor?: string }> }) {
  const ctx = await getAuthContext();
  if (ctx && ctx.user.role === "bd_partner") {
    const partner = await getBdPartnerByUserId(ctx.user.id);
    if (partner) {
      const code = await getSalesCode(ctx.user.id);
      const leadCount = await partnerLeadCount(ctx.user.id);
      const raw = await listInvestorLeadsForPartner(ctx.user.id);
      const leads = raw.slice(0, 50).map((l) => ({
        name: `${l.firstName ?? ""} ${l.lastName ?? ""}`.trim() || "—",
        at: l.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
      }));
      return (
        <RadarDashboard
          firstName={partner.firstName}
          tier={partner.tier as "manager" | "vp"}
          track={partner.track}
          salesLink={salesAffiliateLink(code)}
          oppLink={opportunityAffiliateLink(partner.slug)}
          recruitLink={recruitLink(partner.slug)}
          videoWatched={!!partner.videoWatchedAt}
          has1099={!!partner.form1099Url}
          leadCount={leadCount}
          leads={leads}
        />
      );
    }
  }
  const sp = await searchParams;
  return <RadarAuth sponsor={sp?.sponsor} />;
}
