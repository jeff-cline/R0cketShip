import type { Metadata } from "next";
import LaunchClient from "./LaunchClient";

export const metadata: Metadata = {
  title: { absolute: "Ready to Launch" },
  description: "Join the Movement. Every industry is a geek away from being uberized — a rising tide lifts all boats. Bring your business into the R0cketShip network.",
  openGraph: {
    title: "Ready to Launch",
    description: "Join the Movement — bring your business into the R0cketShip network.",
    url: "https://r0cketship.com/launch",
    images: [{ url: "/og-rocket.png", width: 1200, height: 630, alt: "R0cketShip" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ready to Launch",
    description: "Join the Movement — bring your business into the R0cketShip network.",
    images: ["/og-rocket.png"],
  },
};

export default function Page() {
  return <LaunchClient />;
}
