import "server-only";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray, type InferSelectModel } from "drizzle-orm";
import { db } from "@/db";
import {
  trips,
  tripMembers,
  destinations,
  places,
  itinerary,
  notes,
  events,
  eventMembers,
  media,
  invitations,
  user as users,
  plans,
} from "@/db/schema";
import { getCurrentUser, requireUser } from "./auth";
import { assertEventMember, assertEventViewable } from "./events";
import {
  createPresignedUpload,
  deleteFolder,
  deleteObject,
  isS3Configured,
  presignedGetUrl,
  publicObjectUrl,
} from "@/lib/s3";

type TripRow = InferSelectModel<typeof trips>;
type MemberRow = InferSelectModel<typeof tripMembers>;
type DestRow = InferSelectModel<typeof destinations>;
type PlaceRow = InferSelectModel<typeof places>;
type ItinRow = InferSelectModel<typeof itinerary>;
type NoteRow = InferSelectModel<typeof notes>;

// ---- helpers ---------------------------------------------------------------

/** Best-effort geocode via OpenStreetMap Nominatim (server-side, no key). */
async function geocode(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { "User-Agent": "Wanderly/1.0 (trip planner)" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data?.[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function durationDays(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  if (Number.isNaN(ms)) return null;
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

// ---- DTOs ------------------------------------------------------------------

export type TripSummary = {
  id: string;
  title: string;
  destination: string | null;
  type: TripRow["type"];
  startDate: string | null;
  endDate: string | null;
  durationDays: number | null;
  status: TripRow["status"];
  /** Up to 3 recent photo URLs for the card's photo stack. */
  coverImages: string[];
};

export type TripDetail = TripSummary & {
  summary: string | null;
  isOwner: boolean;
  isMember: boolean;
  members: { id: string; name: string; role: MemberRow["role"] }[];
  destinations: {
    id: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
  }[];
  places: {
    id: string;
    name: string;
    category: PlaceRow["category"];
    latitude: number | null;
    longitude: number | null;
  }[];
  itinerary: {
    id: string;
    dayDate: string | null;
    dayNumber: number | null;
    title: string;
    placeId: string | null;
    notes: string | null;
  }[];
  notes: { id: string; body: string; dayDate: string | null }[];
  event: {
    id: string;
    shareToken: string | null;
    visibility: "public" | "private";
  } | null;
  pendingInvites: { id: string; email: string; role: string }[];
};

function toSummary(t: TripRow): TripSummary {
  return {
    id: t.id,
    title: t.title,
    destination: t.destination,
    type: t.type,
    startDate: t.startDate,
    endDate: t.endDate,
    durationDays: durationDays(t.startDate, t.endDate),
    status: t.status,
    coverImages: [],
  };
}

// ---- reads -----------------------------------------------------------------

export async function listMyTrips(): Promise<TripSummary[]> {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(trips)
    .where(eq(trips.ownerId, user.id))
    .orderBy(desc(trips.createdAt));

  const summaries = rows.map(toSummary);

  // Attach up to 3 recent photos per trip (for the card's photo stack).
  const eventIds = rows
    .map((t) => t.eventId)
    .filter((id): id is string => Boolean(id));
  if (eventIds.length > 0) {
    const imgs = await db
      .select({
        eventId: media.eventId,
        storageKey: media.storageKey,
        createdAt: media.createdAt,
      })
      .from(media)
      .where(
        and(inArray(media.eventId, eventIds), eq(media.mediaType, "image")),
      )
      .orderBy(desc(media.createdAt));

    // Group the newest 3 keys per event, then resolve their display URLs.
    const keysByEvent = new Map<string, string[]>();
    for (const m of imgs) {
      const list = keysByEvent.get(m.eventId) ?? [];
      if (list.length < 3) {
        list.push(m.storageKey);
        keysByEvent.set(m.eventId, list);
      }
    }
    const urlsByEvent = new Map<string, string[]>();
    await Promise.all(
      Array.from(keysByEvent.entries()).map(async ([eventId, keys]) => {
        urlsByEvent.set(eventId, await Promise.all(keys.map(mediaUrl)));
      }),
    );
    for (let i = 0; i < rows.length; i++) {
      const eventId = rows[i].eventId;
      if (eventId) summaries[i].coverImages = urlsByEvent.get(eventId) ?? [];
    }
  }

  return summaries;
}

export async function getTrip(id: string): Promise<TripDetail> {
  const user = await getCurrentUser();
  const [trip] = await db.select().from(trips).where(eq(trips.id, id)).limit(1);
  if (!trip) throw new Error("Not found");

  // Authorization: owner, a trip member, or (via the linked event) public.
  let allowed = user?.id === trip.ownerId;
  const isOwner = allowed;
  let isMember = isOwner; // owners count as members for contribution rights
  if (!allowed && user) {
    const [m] = await db
      .select({ id: tripMembers.id })
      .from(tripMembers)
      .where(and(eq(tripMembers.tripId, id), eq(tripMembers.userId, user.id)))
      .limit(1);
    allowed = Boolean(m);
    isMember = Boolean(m);
  }
  let eventRow: InferSelectModel<typeof events> | undefined;
  if (trip.eventId) {
    [eventRow] = await db
      .select()
      .from(events)
      .where(eq(events.id, trip.eventId))
      .limit(1);
    if (!allowed && eventRow?.visibility === "public") allowed = true;
  }
  if (!allowed) throw new Error("Forbidden");

  const [memberRows, destRows, placeRows, itinRows, noteRows] =
    await Promise.all([
      db.select().from(tripMembers).where(eq(tripMembers.tripId, id)),
      db
        .select()
        .from(destinations)
        .where(eq(destinations.tripId, id))
        .orderBy(destinations.orderIndex),
      db
        .select()
        .from(places)
        .where(eq(places.tripId, id))
        .orderBy(places.orderIndex),
      db
        .select()
        .from(itinerary)
        .where(eq(itinerary.tripId, id))
        .orderBy(itinerary.dayDate, itinerary.orderIndex),
      db
        .select()
        .from(notes)
        .where(eq(notes.tripId, id))
        .orderBy(desc(notes.createdAt)),
    ]);

  return {
    ...toSummary(trip),
    summary: trip.summary,
    isOwner,
    isMember,
    members: memberRows.map((m: MemberRow) => ({
      id: m.id,
      name: m.name,
      role: m.role,
    })),
    destinations: destRows.map((d: DestRow) => ({
      id: d.id,
      name: d.name,
      latitude: d.latitude,
      longitude: d.longitude,
    })),
    places: placeRows.map((p: PlaceRow) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      latitude: p.latitude,
      longitude: p.longitude,
    })),
    itinerary: itinRows.map((i: ItinRow) => ({
      id: i.id,
      dayDate: i.dayDate,
      dayNumber: i.dayNumber,
      title: i.title,
      placeId: i.placeId,
      notes: i.notes,
    })),
    notes: noteRows.map((n: NoteRow) => ({
      id: n.id,
      body: n.body,
      dayDate: n.dayDate,
    })),
    event:
      trip.eventId && eventRow
        ? {
            id: eventRow.id,
            shareToken: isOwner ? eventRow.shareToken : null,
            visibility: eventRow.visibility,
          }
        : null,
    pendingInvites: isOwner
      ? (
          await db
            .select({
              id: invitations.id,
              email: invitations.email,
              role: invitations.role,
            })
            .from(invitations)
            .where(
              and(
                eq(invitations.tripId, id),
                eq(invitations.status, "pending"),
              ),
            )
        ).map((iv) => ({ id: iv.id, email: iv.email, role: iv.role }))
      : [],
  };
}

// ---- trip media (via the linked event) ------------------------------------

export type TripMediaItem = {
  id: string;
  mediaType: string;
  fileName: string;
  url: string;
  dayDate: string | null;
  createdAt: Date;
  canDelete: boolean;
};

/**
 * Resolve a media row's display URL. Seed/demo rows store an absolute URL
 * (e.g. a Picsum image) directly in storageKey and are returned as-is; real
 * uploads store a private S3 object key, for which we mint a short-lived
 * presigned GET URL (the bucket isn't publicly readable). Falls back to the
 * plain bucket URL if S3 credentials aren't configured.
 */
async function mediaUrl(storageKey: string): Promise<string> {
  if (/^https?:\/\//.test(storageKey)) return storageKey;
  if (!isS3Configured()) return publicObjectUrl(storageKey);
  return presignedGetUrl(storageKey);
}

function mediaTypeFor(
  contentType: string,
): (typeof media.$inferInsert)["mediaType"] {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType === "application/pdf" || contentType.includes("document"))
    return "document";
  return "other";
}

/** Turn a filename into a safe object-key segment. */
function safeName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

export async function listTripMedia(tripId: string): Promise<TripMediaItem[]> {
  const [trip] = await db
    .select({ eventId: trips.eventId, ownerId: trips.ownerId })
    .from(trips)
    .where(eq(trips.id, tripId))
    .limit(1);
  if (!trip?.eventId) return [];
  const viewer = await assertEventViewable(trip.eventId); // authz (member or public)
  const rows = await db
    .select()
    .from(media)
    .where(eq(media.eventId, trip.eventId))
    .orderBy(desc(media.createdAt));
  return Promise.all(
    rows.map(async (m) => ({
      id: m.id,
      mediaType: m.mediaType,
      fileName: m.fileName,
      url: await mediaUrl(m.storageKey),
      dayDate: m.dayDate,
      createdAt: m.createdAt,
      // The uploader or the trip owner can remove an item.
      canDelete: Boolean(
        viewer && (m.uploadedBy === viewer.id || viewer.id === trip.ownerId),
      ),
    })),
  );
}

// ---- storage quota ---------------------------------------------------------

export type TripStorage = {
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  maxFileBytes: number;
  /** Media types allowed on the owner's plan, e.g. ["image"]. */
  allowedTypes: string[];
  /** Whether the owner's plan permits downloading media. */
  allowDownloads: boolean;
};

/**
 * Storage usage + limits for a trip's backing event, derived from the event
 * owner's plan. Powers the "space remaining" display and client-side upload
 * validation (the DB triggers remain the source of truth).
 */
export async function getTripStorage(
  tripId: string,
): Promise<TripStorage | null> {
  const [trip] = await db
    .select({ eventId: trips.eventId })
    .from(trips)
    .where(eq(trips.id, tripId))
    .limit(1);
  if (!trip?.eventId) return null;
  await assertEventViewable(trip.eventId); // authz (member or public)

  const [row] = await db
    .select({
      usedBytes: events.storageUsedBytes,
      limitBytes: plans.maxStoragePerEventBytes,
      maxFileBytes: plans.maxFileSizeBytes,
      allowedTypes: plans.allowedMediaTypes,
      allowDownloads: plans.allowDownloads,
    })
    .from(events)
    .innerJoin(users, eq(users.id, events.creatorId))
    .innerJoin(plans, eq(plans.id, users.planId))
    .where(eq(events.id, trip.eventId))
    .limit(1);
  if (!row) return null;

  return {
    usedBytes: row.usedBytes,
    limitBytes: row.limitBytes,
    remainingBytes: Math.max(0, row.limitBytes - row.usedBytes),
    maxFileBytes: row.maxFileBytes,
    allowedTypes: row.allowedTypes as string[],
    allowDownloads: row.allowDownloads,
  };
}

/**
 * A short-lived URL for downloading a media file. Requires the owner's plan to
 * allow downloads. For real S3 objects the URL forces a file download
 * (Content-Disposition: attachment); demo/external URLs are returned as-is.
 */
export async function getMediaDownloadUrl(mediaId: string): Promise<string> {
  const [row] = await db
    .select({
      eventId: media.eventId,
      storageKey: media.storageKey,
      fileName: media.fileName,
    })
    .from(media)
    .where(eq(media.id, mediaId))
    .limit(1);
  if (!row) throw new Error("Not found");
  await assertEventViewable(row.eventId); // authz (member or public)

  // Gate on the event owner's plan.
  const [event] = await db
    .select({ allowDownloads: plans.allowDownloads })
    .from(events)
    .innerJoin(users, eq(users.id, events.creatorId))
    .innerJoin(plans, eq(plans.id, users.planId))
    .where(eq(events.id, row.eventId))
    .limit(1);
  if (!event?.allowDownloads) throw new Error("Downloads not allowed on plan");

  if (/^https?:\/\//.test(row.storageKey)) return row.storageKey;
  if (!isS3Configured()) return publicObjectUrl(row.storageKey);
  return presignedGetUrl(row.storageKey, 3600, row.fileName);
}

/**
 * A presigned target for uploading trip media. Objects land under
 * `events/<eventId>/` so every trip's files are grouped by their backing event
 * (and are removed together when the event/trip is deleted, via S3 lifecycle
 * or cascade cleanup). Membership is asserted before a URL is minted.
 */
export async function tripMediaUploadTarget(
  tripId: string,
  fileName: string,
  contentType: string,
): Promise<{ signedUrl: string; key: string; url: string }> {
  const [trip] = await db
    .select({ eventId: trips.eventId })
    .from(trips)
    .where(eq(trips.id, tripId))
    .limit(1);
  if (!trip?.eventId) throw new Error("This trip has no event.");
  await assertEventMember(trip.eventId); // must be an approved member
  const key = `events/${trip.eventId}/${crypto.randomUUID()}-${safeName(fileName)}`;
  return createPresignedUpload(key, contentType);
}

/** Save an uploaded object as trip media. Plan quotas are enforced by DB triggers. */
export async function addTripMedia(
  tripId: string,
  input: {
    storageKey: string;
    fileName: string;
    contentType: string;
    fileSizeBytes: number;
    dayDate?: string | null;
  },
): Promise<void> {
  const [trip] = await db
    .select({ eventId: trips.eventId })
    .from(trips)
    .where(eq(trips.id, tripId))
    .limit(1);
  if (!trip?.eventId) throw new Error("This trip has no event.");
  const member = await assertEventMember(trip.eventId); // must be an approved member
  await db.insert(media).values({
    eventId: trip.eventId,
    uploadedBy: member.id,
    mediaType: mediaTypeFor(input.contentType),
    storageKey: input.storageKey,
    fileName: input.fileName,
    mimeType: input.contentType,
    fileSizeBytes: input.fileSizeBytes,
    dayDate: input.dayDate || null,
  });
  revalidatePath(`/trips/${tripId}`);
}

/** Add a memory note pinned to a specific roadmap day. Members only. */
export async function addTripDayNote(
  tripId: string,
  dayDate: string,
  body: string,
): Promise<void> {
  const text = body.trim();
  if (!text) throw new Error("Note is empty");
  const [trip] = await db
    .select({ eventId: trips.eventId })
    .from(trips)
    .where(eq(trips.id, tripId))
    .limit(1);
  if (!trip?.eventId) throw new Error("This trip has no event.");
  const member = await assertEventMember(trip.eventId); // must be an approved member
  await db.insert(notes).values({
    tripId,
    authorId: member.id,
    dayDate,
    body: text,
  });
  revalidatePath(`/trips/${tripId}`);
}

/**
 * Delete a media item and its underlying S3 object. Only the uploader or the
 * trip owner may do this; the storage object is removed first so we don't leave
 * orphans behind the deleted row.
 */
export async function deleteTripMedia(mediaId: string): Promise<void> {
  const viewer = await requireUser();
  const [row] = await db
    .select({
      id: media.id,
      eventId: media.eventId,
      uploadedBy: media.uploadedBy,
      storageKey: media.storageKey,
    })
    .from(media)
    .where(eq(media.id, mediaId))
    .limit(1);
  if (!row) throw new Error("Not found");

  // Resolve the trip that owns this event (for the "trip owner can delete" rule).
  const [trip] = await db
    .select({ id: trips.id, ownerId: trips.ownerId })
    .from(trips)
    .where(eq(trips.eventId, row.eventId))
    .limit(1);

  const isOwner = trip?.ownerId === viewer.id;
  const isUploader = row.uploadedBy === viewer.id;
  if (!isOwner && !isUploader) throw new Error("Forbidden");

  await deleteObject(row.storageKey); // best-effort; frees storage quota
  await db.delete(media).where(eq(media.id, mediaId));
  if (trip) revalidatePath(`/trips/${trip.id}`);
}

// ---- settings: crew, sharing, delete --------------------------------------

/** Load a trip the current user owns, or throw. Used by owner-only settings. */
async function requireOwnedTrip(tripId: string) {
  const user = await requireUser();
  const [trip] = await db
    .select()
    .from(trips)
    .where(eq(trips.id, tripId))
    .limit(1);
  if (!trip) throw new Error("Not found");
  if (trip.ownerId !== user.id) throw new Error("Forbidden");
  return trip;
}

/**
 * Remove a member from the trip (owner only). Also revokes their event
 * membership so they lose access to the shared gallery. The owner can't be
 * removed.
 */
export async function removeTripMember(
  tripId: string,
  tripMemberId: string,
): Promise<void> {
  const trip = await requireOwnedTrip(tripId);
  const [member] = await db
    .select()
    .from(tripMembers)
    .where(
      and(eq(tripMembers.id, tripMemberId), eq(tripMembers.tripId, tripId)),
    )
    .limit(1);
  if (!member) throw new Error("Not found");
  if (member.role === "owner") throw new Error("Can't remove the owner");

  if (member.userId && trip.eventId) {
    await db
      .delete(eventMembers)
      .where(
        and(
          eq(eventMembers.eventId, trip.eventId),
          eq(eventMembers.userId, member.userId),
        ),
      );
  }
  await db.delete(tripMembers).where(eq(tripMembers.id, tripMemberId));
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/settings`);
}

/** Set the backing event's visibility (owner only). */
export async function setTripVisibility(
  tripId: string,
  visibility: "public" | "private",
): Promise<void> {
  const trip = await requireOwnedTrip(tripId);
  if (!trip.eventId) throw new Error("This trip has no event.");
  await db
    .update(events)
    .set({ visibility })
    .where(eq(events.id, trip.eventId));
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/settings`);
}

/**
 * Delete a trip and everything under it (owner only): the S3 media folder
 * (events/<eventId>/…), then the trip and its event. Trip children (members,
 * itinerary, notes, …) cascade from the trip row; media/event members cascade
 * from the event.
 */
export async function deleteTrip(tripId: string): Promise<void> {
  const trip = await requireOwnedTrip(tripId);

  if (trip.eventId) {
    await deleteFolder(`events/${trip.eventId}/`); // best-effort S3 cleanup
  }
  // Delete the trip first (cascades trip_members, destinations, places,
  // itinerary, notes), then the event (cascades media, event_members).
  await db.delete(trips).where(eq(trips.id, tripId));
  if (trip.eventId) {
    await db.delete(events).where(eq(events.id, trip.eventId));
  }
  revalidatePath("/trips");
}

// ---- create ----------------------------------------------------------------

export type CreateTripInput = {
  title: string;
  destination: string;
  type?: TripRow["type"];
  startDate?: string;
  endDate?: string;
  summary?: string;
  travelers?: string[];
  places?: { name: string; day?: number | null }[];
  note?: string;
};

/**
 * Create a trip and its backing event (which enables members/media/sharing).
 * Destination + places are geocoded best-effort for the map view. Places with
 * a `day` become itinerary entries for the timeline.
 */
export async function createTrip(input: CreateTripInput): Promise<string> {
  const user = await requireUser();

  // 1. Backing event — powers invite/join + media sharing; also counts toward
  //    the plan's max_events (enforced by a DB trigger).
  const [event] = await db
    .insert(events)
    .values({ creatorId: user.id, name: input.title, visibility: "private" })
    .returning();

  // 2. The trip, linked to the event.
  const [trip] = await db
    .insert(trips)
    .values({
      ownerId: user.id,
      eventId: event.id,
      title: input.title,
      destination: input.destination,
      type: input.type ?? null,
      startDate: input.startDate || null,
      endDate: input.endDate || null,
      summary: input.summary?.trim() || null,
      status: "planning",
    })
    .returning();

  // 3. Members: owner + named travelers.
  await db.insert(tripMembers).values([
    {
      tripId: trip.id,
      userId: user.id,
      name: user.name || "You",
      role: "owner" as const,
    },
    ...(input.travelers ?? [])
      .map((n) => n.trim())
      .filter(Boolean)
      .map((name) => ({ tripId: trip.id, name, role: "member" as const })),
  ]);

  // 4. Main destination (geocoded for map centering).
  const destCoords = await geocode(input.destination);
  const [dest] = await db
    .insert(destinations)
    .values({
      tripId: trip.id,
      name: input.destination,
      latitude: destCoords?.lat,
      longitude: destCoords?.lng,
      orderIndex: 0,
    })
    .returning();

  // 5. Places (geocoded) + itinerary entries for any with a day assigned.
  let order = 0;
  for (const p of input.places ?? []) {
    const name = p.name.trim();
    if (!name) continue;
    const coords = await geocode(`${name}, ${input.destination}`);
    const [place] = await db
      .insert(places)
      .values({
        tripId: trip.id,
        destinationId: dest.id,
        name,
        latitude: coords?.lat,
        longitude: coords?.lng,
        orderIndex: order++,
      })
      .returning();
    if (p.day && input.startDate) {
      await db.insert(itinerary).values({
        tripId: trip.id,
        placeId: place.id,
        destinationId: dest.id,
        dayDate: addDays(input.startDate, p.day - 1),
        dayNumber: p.day,
        title: name,
        orderIndex: 0,
      });
    }
  }

  // 6. Optional note.
  if (input.note?.trim()) {
    await db
      .insert(notes)
      .values({ tripId: trip.id, authorId: user.id, body: input.note.trim() });
  }

  revalidatePath("/trips");
  return trip.id;
}
