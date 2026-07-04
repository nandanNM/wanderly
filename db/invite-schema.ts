import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { events } from "./event-schema";
import { trips } from "./trip-schema";
import { memberRole } from "./enums";

// Invite a friend to a trip by email/link. Accepting adds them to the trip's
// event (so they can view/share media) and to the trip roster.
export const invitationStatus = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "expired",
  "revoked",
]);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").references(() => events.id, {
      onDelete: "cascade",
    }),
    email: varchar("email", { length: 255 }).notNull(),
    token: varchar("token", { length: 64 }).notNull().unique(),
    role: memberRole("role").notNull().default("member"),
    invitedBy: text("invited_by").references(() => user.id, {
      onDelete: "set null",
    }),
    status: invitationStatus("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_invitations_trip").on(t.tripId),
    index("idx_invitations_email").on(t.email),
  ],
);
