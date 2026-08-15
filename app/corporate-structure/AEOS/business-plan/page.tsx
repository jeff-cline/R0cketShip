import type { Metadata } from "next";
import { BusinessPlan } from "../Docs";

export const metadata: Metadata = {
  title: "AEOS — Business Plan",
  description: "Entertainment is the vehicle. The platform is the business.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <BusinessPlan />;
}
