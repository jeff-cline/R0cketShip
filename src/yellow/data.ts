import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/src/db/client";
import { yellowUsers, yellowPages, yellowNotes, yellowSubnotes } from "@/src/db/schema";

export type Priority = "high" | "medium" | "low";
export type SubnoteView = { id: string; text: string; createdAt: string };
export type NoteView = {
  id: string; text: string; priority: Priority; done: boolean;
  position: number; completedAt: string | null; createdAt: string;
  contactName: string | null; contactEmail: string | null; contactPhone: string | null;
  photoUrl: string | null;
  subnotes: SubnoteView[];
};
export type PageView = { id: string; title: string; position: number; notes: NoteView[] };
export type UserRow = {
  id: string; name: string; username: string; email: string;
  isAdmin: boolean; status: string; mustReset: boolean; createdAt: string;
};

function group<T, K>(items: T[], keyOf: (t: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const it of items) {
    const k = keyOf(it);
    const arr = m.get(k);
    if (arr) arr.push(it);
    else m.set(k, [it]);
  }
  return m;
}

export async function loadPages(userId: string): Promise<PageView[]> {
  const pages = await db.select().from(yellowPages)
    .where(eq(yellowPages.userId, userId))
    .orderBy(asc(yellowPages.position), asc(yellowPages.createdAt));
  if (pages.length === 0) return [];

  const pageIds = pages.map((p) => p.id);
  const notes = await db.select().from(yellowNotes)
    .where(inArray(yellowNotes.pageId, pageIds))
    .orderBy(asc(yellowNotes.position), asc(yellowNotes.createdAt));
  const noteIds = notes.map((n) => n.id);
  const subs = noteIds.length
    ? await db.select().from(yellowSubnotes)
        .where(inArray(yellowSubnotes.noteId, noteIds))
        .orderBy(asc(yellowSubnotes.createdAt))
    : [];

  const subsByNote = group(subs, (s) => s.noteId);
  const notesByPage = group(notes, (n) => n.pageId);

  return pages.map((p) => ({
    id: p.id,
    title: p.title,
    position: p.position,
    notes: (notesByPage.get(p.id) ?? []).map((n) => ({
      id: n.id,
      text: n.text,
      priority: n.priority as Priority,
      done: n.done,
      position: n.position,
      contactName: n.contactName ?? null,
      contactEmail: n.contactEmail ?? null,
      contactPhone: n.contactPhone ?? null,
      photoUrl: n.photoUrl ?? null,
      completedAt: n.completedAt ? n.completedAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
      subnotes: (subsByNote.get(n.id) ?? []).map((s) => ({
        id: s.id, text: s.text, createdAt: s.createdAt.toISOString(),
      })),
    })),
  }));
}

export async function loadAllUsers(): Promise<UserRow[]> {
  const rows = await db.select().from(yellowUsers).orderBy(asc(yellowUsers.createdAt));
  return rows.map((u) => ({
    id: u.id, name: u.name, username: u.username, email: u.email,
    isAdmin: u.isAdmin, status: u.status, mustReset: u.mustReset,
    createdAt: u.createdAt.toISOString(),
  }));
}
