ALTER TABLE "notes" ADD COLUMN "day_date" date;--> statement-breakpoint
CREATE INDEX "idx_notes_trip_day" ON "notes" ("trip_id","day_date");