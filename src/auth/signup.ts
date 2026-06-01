import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "./password";
import { ensureWalletWithBonus } from "../billing/wallet";

/** Public self-service signup → creates a customer (own password, no forced reset) + $50 wallet. */
export async function signupCustomer(
  tenantId: string,
  input: { email: string; password: string; name?: string; businessName?: string },
) {
  const email = input.email.toLowerCase().trim();
  if (!email.includes("@")) throw new Error("invalid email");
  if (!input.password || input.password.length < 8) throw new Error("password must be at least 8 characters");
  const existing = await db.select().from(users).where(and(eq(users.tenantId, tenantId), eq(users.email, email))).limit(1);
  if (existing.length) throw new Error("an account with that email already exists");
  const displayName = input.businessName
    ? `${input.name ?? ""}${input.name ? " — " : ""}${input.businessName}`
    : (input.name ?? null);
  const [row] = await db
    .insert(users)
    .values({ tenantId, email, passwordHash: await hashPassword(input.password), role: "customer", mustResetPassword: false, name: displayName })
    .returning();
  await ensureWalletWithBonus(row.id);
  return row;
}
