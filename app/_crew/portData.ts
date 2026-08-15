// Port opportunity dataset for the ranking / sales page and the IP geofence.
// Passengers in millions/yr (2024-25, FCCA / port authorities / Wikipedia busiest
// cruise ports; Helsinki outlier dropped). Coordinates ~0.1° for the 50-mile
// auto-port-switch. Revenue model is transparent + conservative.

export type PortStatus = "live" | "building" | "pipeline";

export type PortRow = {
  name: string;        // dropdown-style label
  country: string;
  region: string;
  status: PortStatus;
  pax: number;         // annual cruise passengers, millions
  lat: number;
  lon: number;
};

// Modeled platform revenue we touch per cruise visitor at maturity (~3.4% of the
// ~$104 Caribbean shore-spend/visit baseline — merchant subs + ads + affiliate +
// Rocket Fuel + loyalty). Shore spend per visitor baseline used for the case study.
export const REV_PER_PAX = 3.5;      // $ / cruise visitor / yr
export const SHORE_SPEND_PAX = 104;  // $ / cruise visitor (FCCA, Caribbean baseline)

/** $M annual revenue opportunity for a port. */
export const opportunity = (p: PortRow) => p.pax * REV_PER_PAX;
/** $M annual in-port shore spend for a port (pax millions × $/visitor). */
export const shoreSpend = (p: PortRow) => p.pax * SHORE_SPEND_PAX;

export const REGION_COLOR: Record<string, string> = {
  Caribbean: "#13a8c0",
  Bahamas: "#f59e0b",
  Mexico: "#ef6c4d",
  "USA Gulf/East": "#7c6cf0",
  "USA West": "#8b5cf6",
  Alaska: "#38bdf8",
  Mediterranean: "#ff5b2e",
  Europe: "#a78bfa",
  Asia: "#34d399",
  "Middle East": "#fbbf24",
};

export const PORTS: PortRow[] = [
  { name: "Cozumel, Mexico", country: "Mexico", region: "Mexico", status: "live", pax: 4.73, lat: 20.51, lon: -86.95 },
  { name: "San Juan, Puerto Rico", country: "Puerto Rico", region: "Caribbean", status: "building", pax: 1.62, lat: 18.46, lon: -66.11 },
  { name: "Roatán, Honduras", country: "Honduras", region: "Caribbean", status: "building", pax: 1.40, lat: 16.31, lon: -86.53 },

  { name: "Port Canaveral, Florida", country: "USA", region: "USA Gulf/East", status: "pipeline", pax: 8.60, lat: 28.41, lon: -80.62 },
  { name: "Miami, Florida", country: "USA", region: "USA Gulf/East", status: "pipeline", pax: 8.56, lat: 25.77, lon: -80.17 },
  { name: "Nassau, Bahamas", country: "Bahamas", region: "Bahamas", status: "pipeline", pax: 6.07, lat: 25.08, lon: -77.34 },
  { name: "Fort Lauderdale, Florida", country: "USA", region: "USA Gulf/East", status: "pipeline", pax: 4.77, lat: 26.09, lon: -80.12 },
  { name: "Barcelona, Spain", country: "Spain", region: "Mediterranean", status: "pipeline", pax: 3.66, lat: 41.36, lon: 2.18 },
  { name: "Galveston, Texas", country: "USA", region: "USA Gulf/East", status: "pipeline", pax: 3.60, lat: 29.31, lon: -94.79 },
  { name: "Civitavecchia (Rome), Italy", country: "Italy", region: "Mediterranean", status: "pipeline", pax: 3.56, lat: 42.09, lon: 11.80 },
  { name: "Warnemünde (Rostock), Germany", country: "Germany", region: "Europe", status: "pipeline", pax: 3.20, lat: 54.18, lon: 12.08 },
  { name: "Perfect Day at CocoCay, Bahamas", country: "Bahamas", region: "Bahamas", status: "pipeline", pax: 3.00, lat: 25.82, lon: -77.94 },
  { name: "Southampton, UK", country: "UK", region: "Europe", status: "pipeline", pax: 3.00, lat: 50.90, lon: -1.41 },
  { name: "Marseille, France", country: "France", region: "Mediterranean", status: "pipeline", pax: 2.54, lat: 43.34, lon: 5.32 },
  { name: "Palma de Mallorca, Spain", country: "Spain", region: "Mediterranean", status: "pipeline", pax: 2.50, lat: 39.57, lon: 2.65 },
  { name: "Costa Maya, Mexico", country: "Mexico", region: "Mexico", status: "pipeline", pax: 2.40, lat: 18.73, lon: -87.70 },
  { name: "Seattle, Washington", country: "USA", region: "USA West", status: "pipeline", pax: 1.90, lat: 47.61, lon: -122.34 },
  { name: "Las Palmas, Spain", country: "Spain", region: "Europe", status: "pipeline", pax: 1.87, lat: 28.14, lon: -15.42 },
  { name: "Piraeus (Athens), Greece", country: "Greece", region: "Mediterranean", status: "pipeline", pax: 1.85, lat: 37.94, lon: 23.65 },
  { name: "Singapore", country: "Singapore", region: "Asia", status: "pipeline", pax: 1.85, lat: 1.26, lon: 103.86 },
  { name: "Naples, Italy", country: "Italy", region: "Mediterranean", status: "pipeline", pax: 1.74, lat: 40.84, lon: 14.26 },
  { name: "Juneau, Alaska", country: "USA", region: "Alaska", status: "pipeline", pax: 1.69, lat: 58.30, lon: -134.42 },
  { name: "Tampa, Florida", country: "USA", region: "USA Gulf/East", status: "pipeline", pax: 1.66, lat: 27.94, lon: -82.45 },
  { name: "Los Angeles, California", country: "USA", region: "USA West", status: "pipeline", pax: 1.62, lat: 33.73, lon: -118.27 },
  { name: "Philipsburg, St. Maarten", country: "St. Maarten", region: "Caribbean", status: "pipeline", pax: 1.60, lat: 18.02, lon: -63.05 },
  { name: "Charlotte Amalie (St. Thomas), USVI", country: "USVI", region: "Caribbean", status: "pipeline", pax: 1.55, lat: 18.34, lon: -64.93 },
  { name: "Grand Turk, Turks & Caicos", country: "Turks & Caicos", region: "Caribbean", status: "pipeline", pax: 1.30, lat: 21.46, lon: -71.14 },
  { name: "Ensenada, Mexico", country: "Mexico", region: "Mexico", status: "pipeline", pax: 1.30, lat: 31.86, lon: -116.62 },
  { name: "George Town, Grand Cayman", country: "Cayman Islands", region: "Caribbean", status: "pipeline", pax: 1.27, lat: 19.29, lon: -81.38 },
  { name: "Mykonos, Greece", country: "Greece", region: "Mediterranean", status: "pipeline", pax: 1.22, lat: 37.45, lon: 25.33 },
  { name: "Santorini, Greece", country: "Greece", region: "Mediterranean", status: "pipeline", pax: 1.20, lat: 36.42, lon: 25.43 },
  { name: "Vancouver, BC, Canada", country: "Canada", region: "USA West", status: "pipeline", pax: 1.20, lat: 49.29, lon: -123.11 },
  { name: "Cabo San Lucas, Mexico", country: "Mexico", region: "Mexico", status: "pipeline", pax: 1.10, lat: 22.89, lon: -109.91 },
  { name: "New Orleans, Louisiana", country: "USA", region: "USA Gulf/East", status: "pipeline", pax: 1.07, lat: 29.95, lon: -90.07 },
  { name: "Ketchikan, Alaska", country: "USA", region: "Alaska", status: "pipeline", pax: 0.95, lat: 55.34, lon: -131.65 },
  { name: "Bridgetown, Barbados", country: "Barbados", region: "Caribbean", status: "pipeline", pax: 0.85, lat: 13.10, lon: -59.62 },
  { name: "Dubrovnik, Croatia", country: "Croatia", region: "Mediterranean", status: "pipeline", pax: 0.75, lat: 42.64, lon: 18.11 },
  { name: "Falmouth, Jamaica", country: "Jamaica", region: "Caribbean", status: "pipeline", pax: 0.71, lat: 18.49, lon: -77.66 },
  { name: "Dubai, UAE", country: "UAE", region: "Middle East", status: "pipeline", pax: 0.63, lat: 25.28, lon: 55.27 },
  { name: "Cartagena, Colombia", country: "Colombia", region: "Caribbean", status: "pipeline", pax: 0.40, lat: 10.40, lon: -75.52 },
];

/** Great-circle distance in miles. */
export function milesBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Nearest port within `maxMiles` of a coordinate, else null. */
export function nearestPort(loc: { lat: number; lon: number }, maxMiles = 50): PortRow | null {
  let best: PortRow | null = null;
  let bestD = Infinity;
  for (const p of PORTS) {
    const d = milesBetween(loc, p);
    if (d < bestD) { bestD = d; best = p; }
  }
  return best && bestD <= maxMiles ? best : null;
}

/** Display order: live → building → pipeline by opportunity desc. */
export function rankedPorts(): PortRow[] {
  const order: Record<PortStatus, number> = { live: 0, building: 1, pipeline: 2 };
  return [...PORTS].sort((a, b) => order[a.status] - order[b.status] || b.pax - a.pax);
}
