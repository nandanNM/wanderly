import "server-only";

import { revalidatePath } from "next/cache";
import { and, desc, eq, type InferSelectModel } from "drizzle-orm";
import { db } from "@/db";
import {
  trips,
  tripMembers,
  destinations,
  places,
  itinerary,
  notes,
  events,
  media,
  invitations,
} from "@/db/schema";
import { getCurrentUser, requireUser } from "./auth";
import { assertEventMember, assertEventViewable } from "./events";
import { createPresignedUpload, deleteObject, publicObjectUrl } from "@/lib/s3";

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
  startDate: string | null;
  endDate: string | null;
  durationDays: number | null;
  status: TripRow["status"];
};

export type TripDetail = TripSummary & {
  summary: string | null;
  isOwner: boolean;
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
  notes: { id: string; body: string }[];
  event: { id: string; shareToken: string | null } | null;
  pendingInvites: { id: string; email: string; role: string }[];
};

function toSummary(t: TripRow): TripSummary {
  return {
    id: t.id,
    title: t.title,
    destination: t.destination,
    startDate: t.startDate,
    endDate: t.endDate,
    durationDays: durationDays(t.startDate, t.endDate),
    status: t.status,
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
  return rows.map(toSummary);
}

export async function getTrip(id: string): Promise<TripDetail> {
  const user = await getCurrentUser();
  const [trip] = await db.select().from(trips).where(eq(trips.id, id)).limit(1);
  if (!trip) throw new Error("Not found");

  // Authorization: owner, a trip member, or (via the linked event) public.
  let allowed = user?.id === trip.ownerId;
  const isOwner = allowed;
  if (!allowed && user) {
    const [m] = await db
      .select({ id: tripMembers.id })
      .from(tripMembers)
      .where(and(eq(tripMembers.tripId, id), eq(tripMembers.userId, user.id)))
      .limit(1);
    allowed = Boolean(m);
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
    notes: noteRows.map((n: NoteRow) => ({ id: n.id, body: n.body })),
    event:
      trip.eventId && eventRow
        ? { id: eventRow.id, shareToken: isOwner ? eventRow.shareToken : null }
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
  createdAt: Date;
  canDelete: boolean;
};

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
  return rows.map((m) => ({
    id: m.id,
    mediaType: m.mediaType,
    fileName: m.fileName,
    url: publicObjectUrl(m.storageKey),
    createdAt: m.createdAt,
    // The uploader or the trip owner can remove an item.
    canDelete: Boolean(
      viewer && (m.uploadedBy === viewer.id || viewer.id === trip.ownerId),
    ),
  }));
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

// ---- create ----------------------------------------------------------------

export type CreateTripInput = {
  title: string;
  destination: string;
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
