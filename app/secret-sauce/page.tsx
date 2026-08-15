import type { Metadata } from "next";
import { SecretSauce } from "./SecretSauce";

export const metadata: Metadata = {
  title: "The Secret Sauce — R0cketShip",
  description: "How R0cketShip turns any niche into a category-defining machine. By invitation.",
  robots: { index: false, follow: false },
};

export default function SecretSaucePage() {
  return <SecretSauce />;
}
