CREATE TYPE "event_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "media_type" AS ENUM('image', 'video', 'audio', 'document', 'other');--> statement-breakpoint
CREATE TYPE "media_visibility" AS ENUM('event', 'restricted');--> statement-breakpoint
CREATE TYPE "member_role" AS ENUM('owner', 'moderator', 'member');--> statement-breakpoint
CREATE TYPE "member_status" AS ENUM('pending', 'approved', 'blocked');--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(30) NOT NULL UNIQUE,
	"name" varchar(60) NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"currency" char(3) DEFAULT 'USD' NOT NULL,
	"max_events" integer,
	"max_members_per_event" integer,
	"max_storage_per_event_bytes" bigint NOT NULL,
	"max_file_size_bytes" bigint NOT NULL,
	"allowed_media_types" "media_type"[] DEFAULT '{image}'::"media_type"[] NOT NULL,
	"allow_downloads" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_price_cents_check" CHECK ("price_cents" >= 0),
	CONSTRAINT "plans_max_events_check" CHECK ("max_events" IS NULL OR "max_events" >= 0),
	CONSTRAINT "plans_max_members_check" CHECK ("max_members_per_event" IS NULL OR "max_members_per_event" >= 0),
	CONSTRAINT "plans_max_storage_check" CHECK ("max_storage_per_event_bytes" >= 0),
	CONSTRAINT "plans_max_file_size_check" CHECK ("max_file_size_bytes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "event_members" (
	"event_id" uuid,
	"user_id" text,
	"role" "member_role" DEFAULT 'member'::"member_role" NOT NULL,
	"status" "member_status" DEFAULT 'approved'::"member_status" NOT NULL,
	"invited_by" text,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_members_pkey" PRIMARY KEY("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"creator_id" text NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"logo_url" text,
	"banner_url" text,
	"visibility" "event_visibility" DEFAULT 'private'::"event_visibility" NOT NULL,
	"share_token" uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
	"allow_downloads" boolean,
	"storage_used_bytes" bigint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_storage_used_check" CHECK ("storage_used_bytes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"uploaded_by" text NOT NULL,
	"media_type" "media_type" NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(150) NOT NULL,
	"file_size_bytes" bigint NOT NULL,
	"caption" text,
	"visibility" "media_visibility" DEFAULT 'event'::"media_visibility" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_file_size_check" CHECK ("file_size_bytes" > 0)
);
--> statement-breakpoint
CREATE TABLE "media_access" (
	"media_id" uuid,
	"user_id" text,
	"granted_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_access_pkey" PRIMARY KEY("media_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "plan_id" uuid;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_key" UNIQUE("username");--> statement-breakpoint
CREATE INDEX "idx_event_members_user" ON "event_members" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_event_members_status" ON "event_members" ("event_id","status");--> statement-breakpoint
CREATE INDEX "idx_events_creator_id" ON "events" ("creator_id");--> statement-breakpoint
CREATE INDEX "idx_events_visibility_created" ON "events" ("visibility","created_at");--> statement-breakpoint
CREATE INDEX "idx_media_event_created" ON "media" ("event_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_media_uploaded_by" ON "media" ("uploaded_by");--> statement-breakpoint
CREATE INDEX "idx_media_visibility" ON "media" ("event_id","visibility");--> statement-breakpoint
CREATE INDEX "idx_media_access_user" ON "media_access" ("user_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_plan_id_plans_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "event_members" ADD CONSTRAINT "event_members_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_members" ADD CONSTRAINT "event_members_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_members" ADD CONSTRAINT "event_members_invited_by_user_id_fkey" FOREIGN KEY ("invited_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_creator_id_user_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "media_access" ADD CONSTRAINT "media_access_media_id_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "media_access" ADD CONSTRAINT "media_access_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "media_access" ADD CONSTRAINT "media_access_granted_by_user_id_fkey" FOREIGN KEY ("granted_by") REFERENCES "user"("id") ON DELETE SET NULL;