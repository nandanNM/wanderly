CREATE TYPE "trip_type" AS ENUM('adventure', 'beach', 'city', 'roadtrip', 'nature', 'family', 'cruise', 'other');--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "type" "trip_type";