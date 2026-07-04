// Re-export the Better Auth tables and add your application tables below.
export * from "./auth-schema";

// Example application table — extend or replace with your own domain models:
//
// import { pgTable, integer, varchar } from "drizzle-orm/pg-core";
//
// export const trips = pgTable("trips", {
//   id: integer().primaryKey().generatedAlwaysAsIdentity(),
//   title: varchar({ length: 255 }).notNull(),
//   destination: varchar({ length: 255 }).notNull(),
// });
