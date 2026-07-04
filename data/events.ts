import "server-only";

import { and, desc, eq, type InferSelectModel } from "drizzle-orm";
import { db } from "@/db";
import { events, eventMembers } from "@/db/schema";
import { getCurrentUser, requireUser } from "./auth";

type EventRow = InferSelectModel<typeof events>;

export type EventDTO = {
  id: string;
  name: string;
  description: string | null;
  visibility: "public" | "private";
  logoUrl: string | null;
  bannerUrl: string | null;
  storageUsedBytes: number;
  createdAt: Date;
};

function toEventDTO(row: EventRow): EventDTO {
  // Note: share_token is intentionally NOT in the DTO — expose it only to the
  // owner via getEventShareToken().
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    visibility: row.visibility,
    logoUrl: row.logoUrl,
    bannerUrl: row.bannerUrl,
    storageUsedBytes: row.storageUsedBytes,
    createdAt: row.createdAt,
  };
}

/** Whether `userId` is an approved member of `eventId`. */
async function isApprovedMember(eventId: string, userId: string) {
  const [row] = await db
    .select({ userId: eventMembers.userId })
    .from(eventMembers)
    .where(
      and(
        eq(eventMembers.eventId, eventId),
        eq(eventMembers.userId, userId),
        eq(eventMembers.status, "approved"),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/**
 * Loads an event the current viewer is allowed to see. Public events are
 * visible to anyone; private events require an approved membership.
 * Throws "Not found" / "Forbidden" — callers should not leak which one.
 */
export async function getEvent(eventId: string): Promise<EventDTO> {
  const [row] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!row || !row.isActive) {
    throw new Error("Not found");
  }
  if (row.visibility === "private") {
    const user = await getCurrentUser();
    if (!user || !(await isApprovedMember(eventId, user.id))) {
      throw new Error("Forbidden");
    }
  }
  return toEventDTO(row);
}

/** The current user's own events. */
export async function listMyEvents(): Promise<EventDTO[]> {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.creatorId, user.id))
    .orderBy(desc(events.createdAt));
  return rows.map(toEventDTO);
}

export async function createEvent(input: {
  name: string;
  description?: string;
  visibility?: "public" | "private";
}): Promise<EventDTO> {
  const user = await requireUser();
  const [row] = await db
    .insert(events)
    .values({
      creatorId: user.id,
      name: input.name,
      description: input.description,
      visibility: input.visibility ?? "private",
    })
    .returning();
  // A DB trigger adds the creator as an 'owner' member automatically.
  return toEventDTO(row);
}

/** Deletes an event the current user owns. Checks ownership (prevents IDOR). */
export async function deleteEvent(eventId: string): Promise<void> {
  const user = await requireUser();
  const [row] = await db
    .select({ creatorId: events.creatorId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!row) {
    throw new Error("Not found");
  }
  if (row.creatorId !== user.id) {
    throw new Error("Forbidden");
  }
  await db.delete(events).where(eq(events.id, eventId));
}

/** The shareable token — owner only. */
export async function getEventShareToken(eventId: string): Promise<string> {
  const user = await requireUser();
  const [row] = await db
    .select({ creatorId: events.creatorId, shareToken: events.shareToken })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!row) {
    throw new Error("Not found");
  }
  if (row.creatorId !== user.id) {
    throw new Error("Forbidden");
  }
  return row.shareToken;
}

/** Internal: assert the current viewer can access an event; returns the user (or null for public). */
export async function assertEventViewable(eventId: string) {
  const [row] = await db
    .select({ visibility: events.visibility, isActive: events.isActive })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!row || !row.isActive) {
    throw new Error("Not found");
  }
  const user = await getCurrentUser();
  if (row.visibility === "private") {
    if (!user || !(await isApprovedMember(eventId, user.id))) {
      throw new Error("Forbidden");
    }
  }
  return user;
}

/** Internal: assert the current user is an approved member; returns the user. */
export async function assertEventMember(eventId: string) {
  const user = await requireUser();
  if (!(await isApprovedMember(eventId, user.id))) {
    throw new Error("Forbidden");
  }
  return user;
}
