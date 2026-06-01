import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "../db/client";
import { affiliates } from "../db/schema";

function genCode(): string {
  return randomBytes(6).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
}

export async function getOrCreateCode(customerId: string): Promise<string> {
  const existing = (await db.select().from(affiliates).where(eq(affiliates.customerId, customerId)).limit(1))[0];
  if (existing) return existing.code;
  for (let i = 0; i < 6; i++) {
    try {
      const [row] = await db.insert(affiliates).values({ customerId, code: genCode() }).returning();
      return row.code;
    } catch {
      const again = (await db.select().from(affiliates).where(eq(affiliates.customerId, customerId)).limit(1))[0];
      if (again) return again.code;
    }
  }
  throw new Error("could not generate affiliate code");
}

export async function codeOwner(code: string): Promise<string | null> {
  const row = (await db.select().from(affiliates).where(eq(affiliates.code, code)).limit(1))[0];
  return row?.customerId ?? null;
}
