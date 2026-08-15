import type { Metadata } from "next";
import { OnePager } from "../Docs";

export const metadata: Metadata = {
  title: "AEOS — Investment Opportunity",
  description: "A content business with an infrastructure cost curve.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <OnePager />;
}
