"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/src/db/client";
import { hashPassword, verifyPassword } from "@/src/auth/password";
import { yellowUsers, yellowPages, yellowNotes, yellowSubnotes } from "@/src/db/schema";
import {
  getYellowAuth, createYellowSession, setYellowCookie, clearYellowCookie,
  destroyYellowSession, countYellowUsers,
} from "@/src/yellow/auth";
import { SEED_NOTES } from "@/src/yellow/seed";

type Priority = "high" | "medium" | "low";
const asPriority = (v: unknown): Priority =>
  v === "high" || v === "low" ? v : "medium";

const RP = () => revalidatePath("/yellow");

// ── helpers ────────────────────────────────────────────────────────────────
async function ownedPage(pageId: string, userId: string) {
  const r = await db.select({ id: yellowPages.id }).from(yellowPages)
    .where(and(eq(yellowPages.id, pageId), eq(yellowPages.userId, userId))).limit(1);
  return r[0]?.id ?? null;
}
async function ownedNote(noteId: string, userId: string) {
  const r = await db.select({ id: yellowNotes.id }).from(yellowNotes)
    .innerJoin(yellowPages, eq(yellowNotes.pageId, yellowPages.id))
    .where(and(eq(yellowNotes.id, noteId), eq(yellowPages.userId, userId))).limit(1);
  return r[0]?.id ?? null;
}

async function seedFirstPage(userId: string) {
  const [page] = await db.insert(yellowPages)
    .values({ userId, title: "To-Do", position: 0 }).returning();
  await db.insert(yellowNotes).values(
    SEED_NOTES.map((n, i) => ({ pageId: page.id, text: n.text, priority: n.priority, position: i })),
  );
  return page;
}

// ── auth ───────────────────────────────────────────────────────────────────
export async function setupAction(_prev: unknown, form: FormData): Promise<{ error?: string }> {
  if ((await countYellowUsers()) > 0) return { error: "Setup already complete — please log in." };
  const name = String(form.get("name") || "").trim();
  const username = String(form.get("username") || "").trim().toLowerCase();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  if (!name || !username || !email || password.length < 6)
    return { error: "All fields required; password ≥ 6 chars." };
  const [user] = await db.insert(yellowUsers).values({
    name, username, email, passwordHash: await hashPassword(password),
    isAdmin: true, mustReset: false,
  }).returning();
  await seedFirstPage(user.id);
  await setYellowCookie(await createYellowSession(user.id));
  RP();
  return {};
}

export async function loginAction(_prev: unknown, form: FormData): Promise<{ error?: string }> {
  const id = String(form.get("username") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const rows = await db.select().from(yellowUsers)
    .where(sql`lower(${yellowUsers.username}) = ${id} or lower(${yellowUsers.email}) = ${id}`).limit(1);
  const user = rows[0];
  if (!user || user.status !== "active" || !(await verifyPassword(password, user.passwordHash)))
    return { error: "Wrong username or password." };
  await setYellowCookie(await createYellowSession(user.id));
  RP();
  return {};
}

export async function resetPasswordAction(_prev: unknown, form: FormData): Promise<{ error?: string }> {
  const auth = await getYellowAuth();
  if (!auth) return { error: "Not signed in." };
  const password = String(form.get("password") || "");
  if (password.length < 6) return { error: "Password must be at least 6 characters." };
  await db.update(yellowUsers)
    .set({ passwordHash: await hashPassword(password), mustReset: false })
    .where(eq(yellowUsers.id, auth.user.id));
  RP();
  return {};
}

export async function logoutAction(): Promise<void> {
  const auth = await getYellowAuth();
  if (auth) await destroyYellowSession(auth.token);
  await clearYellowCookie();
  RP();
}

// ── notes ──────────────────────────────────────────────────────────────────
export async function createNoteAction(pageId: string, text: string, priority: string): Promise<void> {
  const auth = await getYellowAuth(); if (!auth) return;
  if (!(await ownedPage(pageId, auth.user.id))) return;
  const t = text.trim(); if (!t) return;
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${yellowNotes.position}), -1)` })
    .from(yellowNotes).where(eq(yellowNotes.pageId, pageId));
  await db.insert(yellowNotes).values({ pageId, text: t, priority: asPriority(priority), position: Number(max) + 1 });
  RP();
}

export async function toggleDoneAction(noteId: string, done: boolean): Promise<void> {
  const auth = await getYellowAuth(); if (!auth) return;
  if (!(await ownedNote(noteId, auth.user.id))) return;
  await db.update(yellowNotes)
    .set({ done, completedAt: done ? new Date() : null })
    .where(eq(yellowNotes.id, noteId));
  RP();
}

export async function setPriorityAction(noteId: string, priority: string): Promise<void> {
  const auth = await getYellowAuth(); if (!auth) return;
  if (!(await ownedNote(noteId, auth.user.id))) return;
  await db.update(yellowNotes).set({ priority: asPriority(priority) }).where(eq(yellowNotes.id, noteId));
  RP();
}

export async function editNoteAction(noteId: string, text: string): Promise<void> {
  const auth = await getYellowAuth(); if (!auth) return;
  if (!(await ownedNote(noteId, auth.user.id))) return;
  const t = text.trim(); if (!t) return;
  await db.update(yellowNotes).set({ text: t }).where(eq(yellowNotes.id, noteId));
  RP();
}

export async function deleteNoteAction(noteId: string): Promise<void> {
  const auth = await getYellowAuth(); if (!auth) return;
  if (!(await ownedNote(noteId, auth.user.id))) return;
  await db.delete(yellowNotes).where(eq(yellowNotes.id, noteId));
  RP();
}

export async function reorderNotesAction(pageId: string, orderedIds: string[]): Promise<void> {
  const auth = await getYellowAuth(); if (!auth) return;
  if (!(await ownedPage(pageId, auth.user.id))) return;
  await Promise.all(orderedIds.map((id, i) =>
    db.update(yellowNotes).set({ position: i }).where(and(eq(yellowNotes.id, id), eq(yellowNotes.pageId, pageId))),
  ));
  RP();
}

export async function setContactAction(noteId: string, name: string, email: string, phone: string): Promise<void> {
  const auth = await getYellowAuth(); if (!auth) return;
  if (!(await ownedNote(noteId, auth.user.id))) return;
  await db.update(yellowNotes).set({
    contactName: name.trim() || null,
    contactEmail: email.trim() || null,
    contactPhone: phone.trim() || null,
  }).where(eq(yellowNotes.id, noteId));
  RP();
}

export async function addSubnoteAction(noteId: string, text: string): Promise<void> {
  const auth = await getYellowAuth(); if (!auth) return;
  if (!(await ownedNote(noteId, auth.user.id))) return;
  const t = text.trim(); if (!t) return;
  await db.insert(yellowSubnotes).values({ noteId, text: t });
  RP();
}

// ── pages ──────────────────────────────────────────────────────────────────
export async function createPageAction(title: string): Promise<void> {
  const auth = await getYellowAuth(); if (!auth) return;
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${yellowPages.position}), -1)` })
    .from(yellowPages).where(eq(yellowPages.userId, auth.user.id));
  await db.insert(yellowPages).values({ userId: auth.user.id, title: title.trim() || "New page", position: Number(max) + 1 });
  RP();
}

export async function renamePageAction(pageId: string, title: string): Promise<void> {
  const auth = await getYellowAuth(); if (!auth) return;
  if (!(await ownedPage(pageId, auth.user.id))) return;
  await db.update(yellowPages).set({ title: title.trim() || "Untitled" }).where(eq(yellowPages.id, pageId));
  RP();
}

export async function deletePageAction(pageId: string): Promise<void> {
  const auth = await getYellowAuth(); if (!auth) return;
  if (!(await ownedPage(pageId, auth.user.id))) return;
  const pages = await db.select({ id: yellowPages.id }).from(yellowPages).where(eq(yellowPages.userId, auth.user.id));
  if (pages.length <= 1) return; // keep at least one page
  await db.delete(yellowPages).where(eq(yellowPages.id, pageId));
  RP();
}

// ── admin: users + impersonation ─────────────────────────────────────────────
export async function createUserAction(_prev: unknown, form: FormData): Promise<{ error?: string; ok?: string }> {
  const auth = await getYellowAuth();
  if (!auth || !auth.user.isAdmin || auth.impersonatorUserId) return { error: "Admins only." };
  const name = String(form.get("name") || "").trim();
  const username = String(form.get("username") || "").trim().toLowerCase();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  if (!name || !username || !email || password.length < 6)
    return { error: "All fields required; temp password ≥ 6 chars." };
  const exists = await db.select({ id: yellowUsers.id }).from(yellowUsers)
    .where(sql`lower(${yellowUsers.username}) = ${username}`).limit(1);
  if (exists[0]) return { error: `Username "${username}" is taken.` };
  const [user] = await db.insert(yellowUsers).values({
    name, username, email, passwordHash: await hashPassword(password), mustReset: true,
  }).returning();
  await db.insert(yellowPages).values({ userId: user.id, title: "To-Do", position: 0 });
  RP();
  return { ok: `Created ${username}. They'll reset the password on first login.` };
}

export async function impersonateAction(userId: string): Promise<void> {
  const auth = await getYellowAuth();
  if (!auth || !auth.user.isAdmin || auth.impersonatorUserId) return;
  const target = await db.select({ id: yellowUsers.id }).from(yellowUsers).where(eq(yellowUsers.id, userId)).limit(1);
  if (!target[0]) return;
  await setYellowCookie(await createYellowSession(userId, auth.user.id));
  RP();
}

export async function exitImpersonationAction(): Promise<void> {
  const auth = await getYellowAuth();
  if (!auth || !auth.impersonatorUserId) return;
  await destroyYellowSession(auth.token);
  await setYellowCookie(await createYellowSession(auth.impersonatorUserId));
  RP();
}
