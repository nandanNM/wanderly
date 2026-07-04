import { pgEnum } from "drizzle-orm/pg-core";

export const eventVisibility = pgEnum("event_visibility", [
  "public",
  "private",
]);

export const mediaType = pgEnum("media_type", [
  "image",
  "video",
  "audio",
  "document",
  "other",
]);

export const mediaVisibility = pgEnum("media_visibility", [
  "event",
  "restricted",
]);

export const memberRole = pgEnum("member_role", [
  "owner",
  "moderator",
  "member",
]);

export const memberStatus = pgEnum("member_status", [
  "pending",
  "approved",
  "blocked",
]);
