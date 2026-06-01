import { redirect } from "next/navigation";

// The old customer affiliate is retired — referrals now run through the Partner program.
export default function AffiliatePage() {
  redirect("/leads");
}
