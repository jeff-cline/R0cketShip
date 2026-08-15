import type { Metadata } from "next";
import DeckClient from "./DeckClient";

export const metadata: Metadata = {
  title: "R0cketShip — Interactive Investor Presentation",
  description: "A commercial-intelligence holding company connecting a portfolio of businesses through a shared intelligence layer. Own the relationship. Own the intelligence. Compound the value.",
};

export default function Page() {
  return <DeckClient />;
}
