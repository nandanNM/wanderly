ALTER TABLE "media" ADD COLUMN "day_date" date;--> statement-breakpoint
CREATE INDEX "idx_media_event_day" ON "media" ("event_id","day_date");