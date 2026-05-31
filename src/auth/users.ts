import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "./password";
import { tenantFilter } from "../tenant/scope";

type Role = "god" | "manager" | "customer";
export interface Actor {
  role: Role;
  tenantId: string;
}
export type UserRow = typeof users.$inferSelect;

export function canCreateUser(
  actor: Actor,
  target: { tenantId: string; role: Role },
): boolean {
  if (actor.role === "god") return target.role !== "god";
  if (actor.role === "manager") {
    return target.role === "customer" && target.tenantId === actor.tenantId;
  }
  return false;
}

export function canResetPassword(actor: Actor, target: { tenantId: string; role: Role }): boolean {
  if (actor.role === "god") return target.role !== "god";
  if (actor.role === "manager") {
    return target.role === "customer" && target.tenantId === actor.tenantId;
  }
  return false;
}

export async function findUserByEmail(tenantId: string, email: string): Promise<UserRow | null> {
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.tenantId, tenantId), eq(users.email, email.toLowerCase())))
    .limit(1);
  return rows[0] ?? null;
}

export async function createUser(
  actor: Actor,
  input: { tenantId: string; email: string; role: Role; tempPassword: string; name?: string },
): Promise<UserRow> {
  if (!canCreateUser(actor, { tenantId: input.tenantId, role: input.role })) {
    throw new Error("Not authorized to create this user");
  }
  const passwordHash = await hashPassword(input.tempPassword);
  const [row] = await db
    .insert(users)
    .values({
      tenantId: input.tenantId,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
      mustResetPassword: true,
      name: input.name ?? null,
      createdBy: null,
    })
    .returning();
  return row;
}

export async function resetUserPassword(actor: Actor, userId: string, tempPassword: string): Promise<UserRow> {
  const target = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!target) throw new Error("User not found");
  if (!canResetPassword(actor, { tenantId: target.tenantId, role: target.role })) {
    throw new Error("Not authorized");
  }
  const passwordHash = await hashPassword(tempPassword);
  const [row] = await db
    .update(users)
    .set({ passwordHash, mustResetPassword: true })
    .where(eq(users.id, userId))
    .returning();
  return row;
}

export async function listUsers(actor: Actor): Promise<UserRow[]> {
  const filter = tenantFilter(actor);
  if (filter === null) return db.select().from(users);
  return db.select().from(users).where(eq(users.tenantId, filter));
}
