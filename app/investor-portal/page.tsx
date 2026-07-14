import type { Metadata } from "next";
import { InvestorPortal } from "./InvestorPortal";

export const metadata: Metadata = {
  title: "Investor Portal — R0cketShip",
  description: "Accredited investors, family offices, private equity firms, and venture funds — request access to the R0cketShip data room.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <InvestorPortal />;
}
