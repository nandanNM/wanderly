import "server-only";

import { and, desc, eq, type InferSelectModel } from "drizzle-orm";
import { db } from "@/db";
import { media, mediaAccess } from "@/db/schema";
import { assertEventViewable, assertEventMember } from "./events";

type MediaRow = InferSelectModel<typeof media>;

export type MediaDTO = {
  id: string;
  eventId: string;
  mediaType: MediaRow["mediaType"];
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  caption: string | null;
  createdAt: Date;
};

function toMediaDTO(row: MediaRow): MediaDTO {
  // storage_key is an internal object-store path and is deliberately omitted;
  // serve files through a signed-URL endpoint rather than exposing the key.
  return {
    id: row.id,
    eventId: row.eventId,
    mediaType: row.mediaType,
    fileName: row.fileName,
    mimeType: row.mimeType,
    fileSizeBytes: row.fileSizeBytes,
    caption: row.caption,
    createdAt: row.createdAt,
  };
}

/**
 * Media the current viewer may see in an event: all 'event'-visible items,
 * plus 'restricted' items explicitly granted to them via media_access.
 */
export async function listEventMedia(eventId: string): Promise<MediaDTO[]> {
  const user = await assertEventViewable(eventId);

  const shared = await db
    .select()
    .from(media)
    .where(and(eq(media.eventId, eventId), eq(media.visibility, "event")))
    .orderBy(desc(media.createdAt));

  let restricted: MediaRow[] = [];
  if (user) {
    const rows = await db
      .select()
      .from(media)
      .innerJoin(mediaAccess, eq(mediaAccess.mediaId, media.id))
      .where(
        and(
          eq(media.eventId, eventId),
          eq(media.visibility, "restricted"),
          eq(mediaAccess.userId, user.id),
        ),
      )
      .orderBy(desc(media.createdAt));
    restricted = rows.map((r) => r.media);
  }

  return [...shared, ...restricted]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map(toMediaDTO);
}

/**
 * Adds a media record to an event. The current user must be an approved
 * member; plan quotas (type / file size / storage) are enforced by DB triggers.
 */
export async function addMedia(input: {
  eventId: string;
  mediaType: MediaRow["mediaType"];
  storageKey: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  caption?: string | null;
  visibility?: MediaRow["visibility"];
}): Promise<MediaDTO> {
  const user = await assertEventMember(input.eventId);
  const [row] = await db
    .insert(media)
    .values({
      eventId: input.eventId,
      uploadedBy: user.id,
      mediaType: input.mediaType,
      storageKey: input.storageKey,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      caption: input.caption ?? null,
      visibility: input.visibility ?? "event",
    })
    .returning();
  return toMediaDTO(row);
}
