// Comprehensive cruise ports of call worldwide, grouped by region for the
// crewperk.com port selector (rendered as <optgroup>s). Sourced via research
// across major cruise lines' itineraries (homeports + ports of call + private
// islands). ~230 ports.

export type PortGroup = { region: string; ports: string[] };

export const PORT_GROUPS: PortGroup[] = [
  { region: "Caribbean — Eastern", ports: [
    "San Juan, Puerto Rico", "Charlotte Amalie (St. Thomas), USVI", "Christiansted (St. Croix), USVI", "Philipsburg, St. Maarten", "Marigot, St. Martin", "Road Town (Tortola), BVI", "St. John's, Antigua", "Basseterre, St. Kitts & Nevis", "Gustavia, St. Barthélemy", "Pointe-à-Pitre, Guadeloupe", "Fort-de-France, Martinique", "Roseau, Dominica", "Castries, St. Lucia", "Kingstown, St. Vincent", "St. George's, Grenada", "Bridgetown, Barbados", "King's Wharf, Bermuda",
  ]},
  { region: "Caribbean — Western", ports: [
    "Cozumel, Mexico", "Costa Maya, Mexico", "Mahogany Bay (Roatán), Honduras", "Coxen Hole (Roatán), Honduras", "Belize City, Belize", "Harvest Caye, Belize", "Santo Tomás, Guatemala", "Puerto Limón, Costa Rica", "Colón, Panama", "George Town, Grand Cayman", "Montego Bay, Jamaica", "Ocho Rios, Jamaica", "Falmouth, Jamaica", "Port Royal (José Santos Guardiola), Honduras",
  ]},
  { region: "Caribbean — Southern", ports: [
    "Oranjestad, Aruba", "Willemstad, Curaçao", "Kralendijk, Bonaire", "La Romana, Dominican Republic", "Amber Cove (Puerto Plata), Dominican Republic", "Cartagena, Colombia", "Port of Spain, Trinidad & Tobago",
  ]},
  { region: "Bahamas & Private Islands", ports: [
    "Nassau, Bahamas", "Freeport, Bahamas", "Bimini, Bahamas", "Perfect Day at CocoCay, Bahamas", "Castaway Cay, Bahamas", "Half Moon Cay, Bahamas", "Celebration Key, Bahamas", "Princess Cays, Bahamas", "Great Stirrup Cay, Bahamas", "Ocean Cay MSC Reserve, Bahamas", "Labadee, Haiti",
  ]},
  { region: "Mexico — Pacific (Riviera)", ports: [
    "Cabo San Lucas, Mexico", "Puerto Vallarta, Mexico", "Mazatlán, Mexico", "Ensenada, Mexico", "Manzanillo, Mexico", "Acapulco, Mexico", "Huatulco, Mexico", "La Paz, Mexico", "Progreso, Mexico",
  ]},
  { region: "USA — Homeports & Calls", ports: [
    "Miami, Florida", "Fort Lauderdale, Florida", "Port Canaveral, Florida", "Tampa, Florida", "Jacksonville, Florida", "Key West, Florida", "New Orleans, Louisiana", "Galveston, Texas", "Mobile, Alabama", "Charleston, South Carolina", "Baltimore, Maryland", "New York City, New York", "Cape Liberty (Bayonne), New Jersey", "Boston, Massachusetts", "Norfolk, Virginia", "Los Angeles, California", "Long Beach, California", "San Diego, California", "San Francisco, California", "Seattle, Washington",
  ]},
  { region: "Hawaii", ports: [
    "Honolulu (Oahu), Hawaii", "Kahului (Maui), Hawaii", "Hilo (Big Island), Hawaii", "Kailua-Kona (Big Island), Hawaii", "Nawiliwili (Kauai), Hawaii",
  ]},
  { region: "Alaska", ports: [
    "Juneau, Alaska", "Ketchikan, Alaska", "Skagway, Alaska", "Sitka, Alaska", "Icy Strait Point, Alaska", "Seward, Alaska", "Whittier, Alaska", "Haines, Alaska", "Anchorage, Alaska", "Glacier Bay, Alaska", "Hubbard Glacier, Alaska",
  ]},
  { region: "Canada & New England", ports: [
    "Vancouver, BC, Canada", "Victoria, BC, Canada", "Halifax, NS, Canada", "Sydney, NS, Canada", "Saint John, NB, Canada", "Charlottetown, PEI, Canada", "Quebec City, QC, Canada", "Montreal, QC, Canada", "Bar Harbor, Maine", "Portland, Maine", "Newport, Rhode Island", "St. John's, NL, Canada",
  ]},
  { region: "Mediterranean — Western", ports: [
    "Barcelona, Spain", "Palma de Mallorca, Spain", "Valencia, Spain", "Málaga, Spain", "Ibiza, Spain", "Civitavecchia (Rome), Italy", "Livorno (Florence), Italy", "Naples, Italy", "Genoa, Italy", "La Spezia, Italy", "Salerno (Amalfi), Italy", "Marseille, France", "Cannes, France", "Nice (Villefranche), France", "Monte Carlo, Monaco", "Ajaccio (Corsica), France", "Cagliari (Sardinia), Italy", "Palermo (Sicily), Italy", "Messina (Sicily), Italy", "Valletta, Malta", "Tunis, Tunisia",
  ]},
  { region: "Mediterranean — Eastern & Greek Isles", ports: [
    "Piraeus (Athens), Greece", "Santorini, Greece", "Mykonos, Greece", "Rhodes, Greece", "Heraklion (Crete), Greece", "Corfu, Greece", "Katakolon (Olympia), Greece", "Istanbul, Turkey", "Kuşadası (Ephesus), Turkey", "Bodrum, Turkey", "Limassol, Cyprus", "Haifa, Israel", "Ashdod, Israel", "Alexandria, Egypt",
  ]},
  { region: "Adriatic", ports: [
    "Venice, Italy", "Trieste, Italy", "Ravenna, Italy", "Bari, Italy", "Dubrovnik, Croatia", "Split, Croatia", "Zadar, Croatia", "Koper, Slovenia", "Kotor, Montenegro",
  ]},
  { region: "Atlantic Europe & Islands", ports: [
    "Lisbon, Portugal", "Porto (Leixões), Portugal", "Funchal (Madeira), Portugal", "Cádiz (Seville), Spain", "Vigo, Spain", "A Coruña, Spain", "Bilbao, Spain", "Gibraltar, UK", "Las Palmas (Gran Canaria), Spain", "Santa Cruz de Tenerife, Spain", "Lanzarote, Spain",
  ]},
  { region: "Northern Europe — Baltic", ports: [
    "Copenhagen, Denmark", "Stockholm, Sweden", "Helsinki, Finland", "Tallinn, Estonia", "Riga, Latvia", "Klaipėda, Lithuania", "Gdynia (Gdańsk), Poland", "Warnemünde (Berlin), Germany", "Kiel, Germany", "Visby, Sweden",
  ]},
  { region: "British Isles & Western Europe", ports: [
    "Southampton, UK", "Dover, UK", "Liverpool, UK", "Greenock (Glasgow), UK", "Edinburgh, UK", "Invergordon, UK", "Kirkwall (Orkney), UK", "Belfast, UK", "Dublin, Ireland", "Cork (Cobh), Ireland", "Amsterdam, Netherlands", "Rotterdam, Netherlands", "Zeebrugge (Bruges), Belgium", "Le Havre (Paris), France", "Hamburg, Germany", "Bremerhaven, Germany",
  ]},
  { region: "Norwegian Fjords & Scandinavia", ports: [
    "Oslo, Norway", "Bergen, Norway", "Stavanger, Norway", "Flåm, Norway", "Geiranger, Norway", "Ålesund, Norway", "Olden, Norway", "Tromsø, Norway", "Honningsvåg (North Cape), Norway", "Gothenburg, Sweden",
  ]},
  { region: "Iceland & North Atlantic", ports: [
    "Reykjavík, Iceland", "Akureyri, Iceland", "Ísafjörður, Iceland", "Tórshavn, Faroe Islands", "Qaqortoq, Greenland", "Nuuk, Greenland",
  ]},
  { region: "South America", ports: [
    "Buenos Aires, Argentina", "Ushuaia, Argentina", "Puerto Madryn, Argentina", "Montevideo, Uruguay", "Punta del Este, Uruguay", "Rio de Janeiro, Brazil", "Santos (São Paulo), Brazil", "Búzios, Brazil", "Punta Arenas, Chile", "Puerto Montt, Chile", "Valparaíso (Santiago), Chile", "Lima (Callao), Peru", "Stanley, Falkland Islands",
  ]},
  { region: "Panama Canal & Central America", ports: [
    "Colón (Cristóbal), Panama", "Fuerte Amador (Panama City), Panama", "Puntarenas, Costa Rica", "Corinto, Nicaragua", "Puerto Quetzal, Guatemala",
  ]},
  { region: "Asia — East Asia", ports: [
    "Tokyo (Yokohama), Japan", "Osaka, Japan", "Kobe, Japan", "Nagasaki, Japan", "Fukuoka, Japan", "Hiroshima, Japan", "Okinawa (Naha), Japan", "Busan, South Korea", "Jeju, South Korea", "Incheon (Seoul), South Korea", "Shanghai, China", "Hong Kong, China", "Tianjin (Beijing), China", "Keelung (Taipei), Taiwan",
  ]},
  { region: "Asia — Southeast Asia", ports: [
    "Singapore", "Phu My (Ho Chi Minh City), Vietnam", "Ha Long Bay, Vietnam", "Chan May (Da Nang), Vietnam", "Laem Chabang (Bangkok), Thailand", "Phuket, Thailand", "Ko Samui, Thailand", "Penang, Malaysia", "Port Klang (Kuala Lumpur), Malaysia", "Kota Kinabalu, Malaysia", "Bali (Benoa), Indonesia", "Manila, Philippines",
  ]},
  { region: "South Asia", ports: [
    "Mumbai, India", "Cochin (Kochi), India", "Chennai, India", "Goa, India", "Colombo, Sri Lanka",
  ]},
  { region: "Middle East / Arabian Gulf", ports: [
    "Dubai, UAE", "Abu Dhabi, UAE", "Sir Bani Yas Island, UAE", "Doha, Qatar", "Muscat, Oman", "Khasab, Oman", "Manama, Bahrain", "Aqaba (Petra), Jordan", "Safaga (Luxor), Egypt", "Sharm El Sheikh, Egypt",
  ]},
  { region: "Australia", ports: [
    "Sydney, Australia", "Brisbane, Australia", "Melbourne, Australia", "Cairns, Australia", "Airlie Beach, Australia", "Darwin, Australia", "Adelaide, Australia", "Fremantle (Perth), Australia", "Hobart, Australia",
  ]},
  { region: "New Zealand", ports: [
    "Auckland, New Zealand", "Wellington, New Zealand", "Lyttelton (Christchurch), New Zealand", "Port Chalmers (Dunedin), New Zealand", "Tauranga, New Zealand", "Bay of Islands, New Zealand", "Napier, New Zealand", "Milford Sound, New Zealand",
  ]},
  { region: "South Pacific", ports: [
    "Nouméa, New Caledonia", "Lifou, New Caledonia", "Port Vila, Vanuatu", "Mystery Island, Vanuatu", "Suva, Fiji", "Lautoka, Fiji", "Papeete (Tahiti), French Polynesia", "Moorea, French Polynesia", "Bora Bora, French Polynesia", "Pago Pago, American Samoa",
  ]},
  { region: "Africa & Indian Ocean", ports: [
    "Cape Town, South Africa", "Durban, South Africa", "Port Elizabeth, South Africa", "Walvis Bay, Namibia", "Mombasa, Kenya", "Zanzibar, Tanzania", "Port Louis, Mauritius", "Victoria (Mahé), Seychelles", "Nosy Be, Madagascar", "Le Port (Réunion), France", "Dakar, Senegal", "Casablanca, Morocco", "Agadir, Morocco", "Tangier, Morocco",
  ]},
];

// ── Port slug system for cruise.plus/<Port-Slug> per-port pages ──────────────
export const ALL_PORTS: string[] = PORT_GROUPS.flatMap((g) => g.ports);

/** "San Juan, Puerto Rico" → "San-Juan-Puerto-Rico" (clean, crawlable). */
export function portSlug(name: string): string {
  return name
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // strip accents for clean URLs
    .replace(/[()]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SLUG_TO_PORT: Record<string, string> = Object.fromEntries(ALL_PORTS.map((p) => [portSlug(p).toLowerCase(), p]));

/** Resolve a slug (case-insensitive) back to its canonical port name, or null. */
export function portFromSlug(slug: string): string | null {
  return SLUG_TO_PORT[slug.toLowerCase()] ?? null;
}
