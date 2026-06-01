import { and, or, eq, ilike, sql, desc, asc, count } from "drizzle-orm";
import { db } from "../db/client";
import { leads } from "../db/schema";

export interface BrowseParams {
  q?: string;
  segment?: "residential" | "commercial" | "";
  sort?: string; // one of the allowed sort keys below
  dir?: "asc" | "desc";
  page?: number; // 1-based
  pageSize?: number; // default 50, max 200
}

export interface BrowseResult {
  rows: typeof leads.$inferSelect[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

// Whitelist of sortable columns. Raw input is never interpolated — we only ever
// resolve to one of these known Drizzle column refs (or the default).
const SORT_COLUMNS = {
  updated: leads.lastUpdated,
  name: leads.lastName,
  city: leads.city,
  zip: leads.zip,
  score: leads.scoreCategory,
  segment: leads.segment,
  company: leads.companyName,
  created: leads.createdAt,
} as const;

const DEFAULT_SORT: keyof typeof SORT_COLUMNS = "updated";

export async function browseLeads(
  tenantId: string,
  params: BrowseParams,
): Promise<BrowseResult> {
  const sortKey: keyof typeof SORT_COLUMNS =
    params.sort && params.sort in SORT_COLUMNS
      ? (params.sort as keyof typeof SORT_COLUMNS)
      : DEFAULT_SORT;
  const sortCol = SORT_COLUMNS[sortKey];
  const dir: "asc" | "desc" = params.dir === "asc" ? "asc" : "desc";

  const pageSize = Math.min(200, Math.max(1, params.pageSize ?? 50));
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * pageSize;

  const filters = [eq(leads.tenantId, tenantId)];

  if (params.segment === "residential" || params.segment === "commercial") {
    filters.push(eq(leads.segment, params.segment));
  }

  const q = params.q?.trim();
  if (q) {
    const like = `%${q}%`;
    const searchExpr = or(
      ilike(leads.firstName, like),
      ilike(leads.lastName, like),
      ilike(leads.businessEmail, like),
      ilike(leads.city, like),
      ilike(leads.zip, like),
      ilike(leads.companyName, like),
      ilike(leads.jobTitle, like),
      ilike(leads.state, like),
      sql`array_to_string(${leads.emails}, ',') ilike ${like}`,
      sql`array_to_string(${leads.personalPhones}, ',') ilike ${like}`,
      sql`array_to_string(${leads.mobilePhones}, ',') ilike ${like}`,
    );
    if (searchExpr) filters.push(searchExpr);
  }

  const whereExpr = and(...filters);

  const totalRow = await db
    .select({ c: count() })
    .from(leads)
    .where(whereExpr);
  const total = Number(totalRow[0]?.c ?? 0);

  const rows = await db
    .select()
    .from(leads)
    .where(whereExpr)
    .orderBy(dir === "asc" ? asc(sortCol) : desc(sortCol))
    .limit(pageSize)
    .offset(offset);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return { rows, total, page, pageSize, pages };
}
