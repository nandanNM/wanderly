import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  varchar,
  bigint,
  date,
  timestamp,
  index,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { events } from "./event-schema";
import { mediaType, mediaVisibility } from "./enums";

// Files inside an event (image/video/... + optional caption). Visible to all
// members ('event') or restricted to specific users via media_access.
export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mediaType: mediaType("media_type").notNull(),
    storageKey: text("storage_key").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 150 }).notNull(),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
    caption: text("caption"),
    // Optional: the trip roadmap day this media belongs to (photos of "Day 2").
    dayDate: date("day_date"),
    visibility: mediaVisibility("visibility").notNull().default("event"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_media_event_created").on(t.eventId, t.createdAt),
    index("idx_media_event_day").on(t.eventId, t.dayDate),
    index("idx_media_uploaded_by").on(t.uploadedBy),
    index("idx_media_visibility").on(t.eventId, t.visibility),
    check("media_file_size_check", sql`${t.fileSizeBytes} > 0`),
  ],
);

// Per-user grants for 'restricted' media (no public access for that item).
export const mediaAccess = pgTable(
  "media_access",
  {
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    grantedBy: text("granted_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.mediaId, t.userId] }),
    index("idx_media_access_user").on(t.userId),
  ],
);
