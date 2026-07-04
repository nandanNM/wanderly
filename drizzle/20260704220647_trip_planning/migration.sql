CREATE TYPE "place_category" AS ENUM('sightseeing', 'food', 'lodging', 'activity', 'transport', 'other');--> statement-breakpoint
CREATE TYPE "trip_status" AS ENUM('planning', 'upcoming', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TABLE "destinations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"trip_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"country" varchar(120),
	"latitude" double precision,
	"longitude" double precision,
	"arrival_date" date,
	"departure_date" date,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itinerary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"trip_id" uuid NOT NULL,
	"destination_id" uuid,
	"place_id" uuid,
	"day_date" date,
	"day_number" integer,
	"title" varchar(200) NOT NULL,
	"start_time" time,
	"end_time" time,
	"order_index" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"trip_id" uuid NOT NULL,
	"place_id" uuid,
	"author_id" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"trip_id" uuid NOT NULL,
	"destination_id" uuid,
	"name" varchar(150) NOT NULL,
	"category" "place_category" DEFAULT 'sightseeing'::"place_category" NOT NULL,
	"address" text,
	"latitude" double precision,
	"longitude" double precision,
	"notes" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"trip_id" uuid NOT NULL,
	"user_id" text,
	"name" varchar(120) NOT NULL,
	"email" varchar(255),
	"role" "member_role" DEFAULT 'member'::"member_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"owner_id" text NOT NULL,
	"event_id" uuid UNIQUE,
	"title" varchar(150) NOT NULL,
	"destination" varchar(150),
	"start_date" date,
	"end_date" date,
	"summary" text,
	"cover_image" text,
	"status" "trip_status" DEFAULT 'planning'::"trip_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_destinations_trip" ON "destinations" ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_itinerary_trip_day" ON "itinerary" ("trip_id","day_date");--> statement-breakpoint
CREATE INDEX "idx_itinerary_place" ON "itinerary" ("place_id");--> statement-breakpoint
CREATE INDEX "idx_notes_trip" ON "notes" ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_places_trip" ON "places" ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_places_destination" ON "places" ("destination_id");--> statement-breakpoint
CREATE INDEX "idx_trip_members_trip" ON "trip_members" ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_trip_members_user" ON "trip_members" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_trips_owner" ON "trips" ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_trips_event" ON "trips" ("event_id");--> statement-breakpoint
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_trip_id_trips_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "itinerary" ADD CONSTRAINT "itinerary_trip_id_trips_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "itinerary" ADD CONSTRAINT "itinerary_destination_id_destinations_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "itinerary" ADD CONSTRAINT "itinerary_place_id_places_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_trip_id_trips_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_place_id_places_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_author_id_user_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_trip_id_trips_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_destination_id_destinations_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_trip_id_trips_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_owner_id_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL;