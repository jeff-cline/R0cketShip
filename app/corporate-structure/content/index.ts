// ──────────────────────────────────────────────────────────────────────────
// Division deck content registry: slug → Deck.
// One ./<slug>.ts file per industry (default-exports a Deck). Regenerated to
// import every content file present. A slug absent here 404s its page.
// ──────────────────────────────────────────────────────────────────────────

import type { Deck } from "@/app/_components/deck/types";

import agtech from "./agtech";
import ai from "./ai";
import automotive from "./automotive";
import big_data from "./big-data";
import biotech from "./biotech";
import connectivity from "./connectivity";
import construction from "./construction";
import cozumel from "./cozumel";
import cruise_ports from "./cruise-ports";
import cybersecurity from "./cybersecurity";
import education from "./education";
import entertainment from "./entertainment";
import excursions from "./excursions";
import eyecare from "./eyecare";
import film from "./film";
import finance from "./finance";
import firearms from "./firearms";
import franchise from "./franchise";
import gaming from "./gaming";
import green_energy from "./green-energy";
import healthcare from "./healthcare";
import home_services from "./home-services";
import hospitality from "./hospitality";
import insurance from "./insurance";
import legal from "./legal";
import lime_key from "./lime-key";
import logistics_ip from "./logistics-ip";
import manufacturing from "./manufacturing";
import media from "./media";
import medtech from "./medtech";
import mining from "./mining";
import non_profit from "./non-profit";
import oil_gas from "./oil-gas";
import outdoors from "./outdoors";
import pharmacy from "./pharmacy";
import private_label from "./private-label";
import puerto_rico from "./puerto-rico";
import real_estate from "./real-estate";
import roatan from "./roatan";
import security from "./security";
import senior from "./senior";
import telecom from "./telecom";
import transportation from "./transportation";
import travel from "./travel";
import wealth from "./wealth";

export const CONTENT: Record<string, Deck> = {
  "agtech": agtech,
  "ai": ai,
  "automotive": automotive,
  "big-data": big_data,
  "biotech": biotech,
  "connectivity": connectivity,
  "construction": construction,
  "cozumel": cozumel,
  "cruise-ports": cruise_ports,
  "cybersecurity": cybersecurity,
  "education": education,
  "entertainment": entertainment,
  "excursions": excursions,
  "eyecare": eyecare,
  "film": film,
  "finance": finance,
  "firearms": firearms,
  "franchise": franchise,
  "gaming": gaming,
  "green-energy": green_energy,
  "healthcare": healthcare,
  "home-services": home_services,
  "hospitality": hospitality,
  "insurance": insurance,
  "legal": legal,
  "lime-key": lime_key,
  "logistics-ip": logistics_ip,
  "manufacturing": manufacturing,
  "media": media,
  "medtech": medtech,
  "mining": mining,
  "non-profit": non_profit,
  "oil-gas": oil_gas,
  "outdoors": outdoors,
  "pharmacy": pharmacy,
  "private-label": private_label,
  "puerto-rico": puerto_rico,
  "real-estate": real_estate,
  "roatan": roatan,
  "security": security,
  "senior": senior,
  "telecom": telecom,
  "transportation": transportation,
  "travel": travel,
  "wealth": wealth,
};
