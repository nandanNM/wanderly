import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  char,
  integer,
  bigint,
  boolean,
  timestamp,
  check,
} from "drizzle-orm/pg-core";
import { mediaType } from "./enums";

// Subscription plans. A user has exactly one plan (users.planId -> plans.id).
// NULL for max_events / max_members_per_event means "unlimited".
export const plans = pgTable(
  "plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 30 }).notNull().unique(),
    name: varchar("name", { length: 60 }).notNull(),
    priceCents: integer("price_cents").notNull().default(0),
    currency: char("currency", { length: 3 }).notNull().default("USD"),
    maxEvents: integer("max_events"),
    maxMembersPerEvent: integer("max_members_per_event"),
    maxStoragePerEventBytes: bigint("max_storage_per_event_bytes", {
      mode: "number",
    }).notNull(),
    maxFileSizeBytes: bigint("max_file_size_bytes", {
      mode: "number",
    }).notNull(),
    allowedMediaTypes: mediaType("allowed_media_types")
      .array()
      .notNull()
      .default(sql`'{image}'`),
    allowDownloads: boolean("allow_downloads").notNull().default(false),
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
    check("plans_price_cents_check", sql`${t.priceCents} >= 0`),
    check(
      "plans_max_events_check",
      sql`${t.maxEvents} IS NULL OR ${t.maxEvents} >= 0`,
    ),
    check(
      "plans_max_members_check",
      sql`${t.maxMembersPerEvent} IS NULL OR ${t.maxMembersPerEvent} >= 0`,
    ),
    check("plans_max_storage_check", sql`${t.maxStoragePerEventBytes} >= 0`),
    check("plans_max_file_size_check", sql`${t.maxFileSizeBytes} >= 0`),
  ],
);
