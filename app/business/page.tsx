import type { Metadata } from "next";
import BusinessClient from "./BusinessClient";
export const metadata: Metadata = { title: "R0cketShip — Business Thesis (Private)", robots: { index: false } };
export default function Page() { return <BusinessClient />; }
