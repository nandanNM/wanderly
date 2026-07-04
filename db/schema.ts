import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

// Enums, plans, Better Auth tables (incl. the extended `user`), and the
// event-sharing domain tables. Import table objects from here for queries.
export * from "./enums";
export * from "./plans-schema";
export * from "./auth-schema";
export * from "./event-schema";
export * from "./media-schema";

// References to files uploaded to S3 (see app/api/uploads). `userId` is
// nullable so uploads work for anonymous visitors too; when a Better Auth
// session exists the upload is attributed to that user.
export const uploads = pgTable("uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull(),
  url: text("url").notNull(),
  contentType: text("content_type"),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
