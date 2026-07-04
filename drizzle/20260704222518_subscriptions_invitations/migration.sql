CREATE TYPE "subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled', 'incomplete');--> statement-breakpoint
CREATE TYPE "invitation_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL UNIQUE,
	"plan_id" uuid NOT NULL,
	"status" "subscription_status" DEFAULT 'active'::"subscription_status" NOT NULL,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"provider" varchar(40),
	"provider_subscription_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"trip_id" uuid,
	"event_id" uuid,
	"email" varchar(255) NOT NULL,
	"token" varchar(64) NOT NULL UNIQUE,
	"role" "member_role" DEFAULT 'member'::"member_role" NOT NULL,
	"invited_by" text,
	"status" "invitation_status" DEFAULT 'pending'::"invitation_status" NOT NULL,
	"expires_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_subscriptions_plan" ON "subscriptions" ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_invitations_trip" ON "invitations" ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_invitations_email" ON "invitations" ("email");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_trip_id_trips_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_user_id_fkey" FOREIGN KEY ("invited_by") REFERENCES "user"("id") ON DELETE SET NULL;