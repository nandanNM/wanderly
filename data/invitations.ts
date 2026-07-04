import "server-only";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  invitations,
  trips,
  tripMembers,
  eventMembers,
  user,
} from "@/db/schema";
import { requireUser } from "./auth";
import { sendInviteEmail } from "@/lib/email";

type Role = "owner" | "moderator" | "member";

function baseUrl(): string {
  return process.env.BETTER_AUTH_URL || "http://localhost:3000";
}

// Add someone to the trip roster + (if a userId) the event so they see media.
async function addTripMember(
  tripId: string,
  name: string,
  role: Role,
  userId: string | null,
) {
  if (userId) {
    const [existing] = await db
      .select({ id: tripMembers.id })
      .from(tripMembers)
      .where(
        and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId)),
      )
      .limit(1);
    if (existing) return;
  }
  await db.insert(tripMembers).values({ tripId, userId, name, role });
}

/**
 * Invite an email to a trip. If they already have an account, add them straight
 * to the event + trip. Otherwise create a pending invitation and email a link.
 */
export async function inviteToTrip(
  tripId: string,
  rawEmail: string,
  role: Role = "member",
): Promise<{ added: boolean; emailSent: boolean; url: string | null }> {
  const currentUser = await requireUser();
  const [trip] = await db
    .select()
    .from(trips)
    .where(eq(trips.id, tripId))
    .limit(1);
  if (!trip) throw new Error("Not found");
  if (trip.ownerId !== currentUser.id) throw new Error("Forbidden");

  const email = rawEmail.trim().toLowerCase();
  if (!email) throw new Error("Email is required");

  // Registered already → add directly (auto-join the event's gallery).
  const [existing] = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (existing) {
    if (trip.eventId) {
      await db
        .insert(eventMembers)
        .values({
          eventId: trip.eventId,
          userId: existing.id,
          role,
          status: "approved",
        })
        .onConflictDoNothing();
    }
    await addTripMember(trip.id, existing.name || email, role, existing.id);
    revalidatePath(`/trips/${tripId}`);
    return { added: true, emailSent: false, url: null };
  }

  // Otherwise: pending invitation + emailed link.
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(
    /-/g,
    "",
  );
  const expiresAt = new Date(Date.now() + 14 * 86_400_000);
  await db.insert(invitations).values({
    tripId: trip.id,
    eventId: trip.eventId,
    email,
    token,
    role,
    invitedBy: currentUser.id,
    status: "pending",
    expiresAt,
  });
  const url = `${baseUrl()}/invite/${token}`;
  const { sent } = await sendInviteEmail(email, {
    inviterName: currentUser.name || "A friend",
    tripTitle: trip.title,
    acceptUrl: url,
  });
  revalidatePath(`/trips/${tripId}`);
  return { added: false, emailSent: sent, url };
}

/** Accept an invite: join the event + trip, mark the invite accepted. */
export async function acceptInvitation(token: string): Promise<string> {
  const currentUser = await requireUser();
  const [inv] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token))
    .limit(1);
  if (!inv) throw new Error("This invite link is invalid.");
  if (inv.status !== "pending")
    throw new Error("This invite is no longer valid.");
  if (inv.expiresAt && inv.expiresAt.getTime() < Date.now()) {
    await db
      .update(invitations)
      .set({ status: "expired" })
      .where(eq(invitations.id, inv.id));
    throw new Error("This invite has expired.");
  }

  if (inv.eventId) {
    await db
      .insert(eventMembers)
      .values({
        eventId: inv.eventId,
        userId: currentUser.id,
        role: inv.role,
        status: "approved",
      })
      .onConflictDoNothing();
  }
  if (inv.tripId) {
    await addTripMember(
      inv.tripId,
      currentUser.name || inv.email,
      inv.role,
      currentUser.id,
    );
  }
  await db
    .update(invitations)
    .set({ status: "accepted", acceptedAt: new Date() })
    .where(eq(invitations.id, inv.id));

  if (inv.tripId) revalidatePath(`/trips/${inv.tripId}`);
  if (!inv.tripId) throw new Error("This invite is missing its trip.");
  return inv.tripId;
}
