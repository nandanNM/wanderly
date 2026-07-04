import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  varchar,
  bigint,
  boolean,
  timestamp,
  index,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { eventVisibility, memberRole, memberStatus } from "./enums";

// Events created by a user; public (anyone can view) or private (members only).
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    logoUrl: text("logo_url"),
    bannerUrl: text("banner_url"),
    visibility: eventVisibility("visibility").notNull().default("private"),
    shareToken: uuid("share_token").notNull().unique().defaultRandom(),
    // NULL = inherit the creator's plan.allow_downloads; true/false overrides.
    allowDownloads: boolean("allow_downloads"),
    // Maintained by the sync_event_storage trigger (see the SQL migration).
    storageUsedBytes: bigint("storage_used_bytes", { mode: "number" })
      .notNull()
      .default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_events_creator_id").on(t.creatorId),
    index("idx_events_visibility_created").on(t.visibility, t.createdAt),
    check("events_storage_used_check", sql`${t.storageUsedBytes} >= 0`),
  ],
);

// Many-to-many users <-> events. The creator is auto-added as an 'owner'
// member by a trigger; the plan's member cap is enforced by another trigger.
export const eventMembers = pgTable(
  "event_members",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: memberRole("role").notNull().default("member"),
    status: memberStatus("status").notNull().default("approved"),
    invitedBy: text("invited_by").references(() => user.id, {
      onDelete: "set null",
    }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.eventId, t.userId] }),
    index("idx_event_members_user").on(t.userId),
    index("idx_event_members_status").on(t.eventId, t.status),
  ],
);
