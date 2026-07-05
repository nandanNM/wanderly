import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  date,
  time,
  doublePrecision,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { events } from "./event-schema";
import { memberRole } from "./enums";

// ---------------------------------------------------------------------------
// Trip planning domain. Users(=Better Auth `user`) own Trips; each trip has
// Trip Members (travelers), Destinations, Places, an Itinerary (day-by-day),
// and Notes. Kept intentionally normalized + FK'd to `trips` so features like
// expenses / bookings / shared planning can be added as sibling tables later.
// ---------------------------------------------------------------------------

export const tripStatus = pgEnum("trip_status", [
  "planning",
  "upcoming",
  "active",
  "completed",
  "archived",
]);
export const tripType = pgEnum("trip_type", [
  "adventure",
  "beach",
  "city",
  "roadtrip",
  "nature",
  "family",
  "cruise",
  "other",
]);
export const placeCategory = pgEnum("place_category", [
  "sightseeing",
  "food",
  "lodging",
  "activity",
  "transport",
  "other",
]);

export const trips = pgTable(
  "trips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Each trip is backed by one Event — reuse its members (invite/join friends)
    // and media (share photos/videos). Visibility & sharing live on the event.
    eventId: uuid("event_id")
      .references(() => events.id, { onDelete: "set null" })
      .unique(),
    title: varchar("title", { length: 150 }).notNull(),
    // Primary destination summary (e.g. "Japan"); per-stop detail in destinations.
    destination: varchar("destination", { length: 150 }),
    type: tripType("type"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    summary: text("summary"),
    coverImage: text("cover_image"),
    status: tripStatus("status").notNull().default("planning"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_trips_owner").on(t.ownerId),
    index("idx_trips_event").on(t.eventId),
  ],
);

// Travelers on a trip. `userId` is nullable so name-only companions (not
// registered users) are supported; `role` powers shared-planning permissions.
export const tripMembers = pgTable(
  "trip_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }),
    role: memberRole("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_trip_members_trip").on(t.tripId),
    index("idx_trip_members_user").on(t.userId),
  ],
);

// A stop within a trip (multi-city). Lat/lng power the map view.
export const destinations = pgTable(
  "destinations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    country: varchar("country", { length: 120 }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    arrivalDate: date("arrival_date"),
    departureDate: date("departure_date"),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_destinations_trip").on(t.tripId)],
);

// Places to visit (POIs). Belong to a trip, optionally to a destination.
export const places = pgTable(
  "places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    destinationId: uuid("destination_id").references(() => destinations.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 150 }).notNull(),
    category: placeCategory("category").notNull().default("sightseeing"),
    address: text("address"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    notes: text("notes"),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_places_trip").on(t.tripId),
    index("idx_places_destination").on(t.destinationId),
  ],
);

// Day-by-day plan — powers the roadmap/timeline (group by day_date) and the
// map (each entry links to a place with coordinates).
export const itinerary = pgTable(
  "itinerary",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    destinationId: uuid("destination_id").references(() => destinations.id, {
      onDelete: "set null",
    }),
    placeId: uuid("place_id").references(() => places.id, {
      onDelete: "set null",
    }),
    dayDate: date("day_date"),
    dayNumber: integer("day_number"),
    title: varchar("title", { length: 200 }).notNull(),
    startTime: time("start_time"),
    endTime: time("end_time"),
    orderIndex: integer("order_index").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_itinerary_trip_day").on(t.tripId, t.dayDate),
    index("idx_itinerary_place").on(t.placeId),
  ],
);

// Free-form notes, attachable to a trip (and optionally a place or a day).
// `dayDate` lets a note be a "memory" pinned to a specific roadmap day.
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    placeId: uuid("place_id").references(() => places.id, {
      onDelete: "cascade",
    }),
    dayDate: date("day_date"),
    authorId: text("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_notes_trip").on(t.tripId),
    index("idx_notes_trip_day").on(t.tripId, t.dayDate),
  ],
);
