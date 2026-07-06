"use server";

import {
  createTrip,
  addTripMedia,
  addTripDayNote,
  deleteTripMedia,
  getMediaDownloadUrl,
  tripMediaUploadTarget,
  removeTripMember,
  setTripVisibility,
  deleteTrip,
  type CreateTripInput,
} from "@/data/trips";
import { inviteToTrip, acceptInvitation } from "@/data/invitations";

const OK = { success: true } as const;

function fail(e: unknown, fallback: string) {
  const msg = e instanceof Error ? e.message : String(e);
  if (/forbidden/i.test(msg))
    return {
      success: false as const,
      error: "Only the organizer can do that.",
    };
  if (/not found/i.test(msg))
    return { success: false as const, error: "That trip no longer exists." };
  return { success: false as const, error: fallback };
}

export async function removeTripMemberAction(
  tripId: string,
  memberId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await removeTripMember(tripId, memberId);
    return OK;
  } catch (e) {
    return fail(e, "Could not remove that member.");
  }
}

export async function setTripVisibilityAction(
  tripId: string,
  visibility: "public" | "private",
): Promise<{ success: true } | { success: false; error: string }> {
  if (visibility !== "public" && visibility !== "private") {
    return { success: false, error: "Invalid visibility." };
  }
  try {
    await setTripVisibility(tripId, visibility);
    return OK;
  } catch (e) {
    return fail(e, "Could not update sharing.");
  }
}

export async function deleteTripAction(
  tripId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await deleteTrip(tripId);
    return OK;
  } catch (e) {
    return fail(e, "Could not delete the trip.");
  }
}

const TRIP_TYPES = [
  "adventure",
  "beach",
  "city",
  "roadtrip",
  "nature",
  "family",
  "cruise",
  "other",
] as const;
type TripType = (typeof TRIP_TYPES)[number];

// Thin action → DAL. Auth is enforced inside createTrip (requireUser).
export async function createTripAction(
  input: CreateTripInput,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  if (!input.title?.trim() || !input.destination?.trim()) {
    return { success: false, error: "Title and destination are required." };
  }
  // Only accept a known trip type; ignore anything else.
  const type = TRIP_TYPES.includes(input.type as TripType)
    ? (input.type as TripType)
    : undefined;
  try {
    const id = await createTrip({ ...input, type });
    return { success: true, id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/event limit reached/i.test(msg)) {
      return {
        success: false,
        error: "You've hit your plan's trip limit — upgrade to create more.",
      };
    }
    if (/unauthorized/i.test(msg)) {
      return { success: false, error: "Please sign in to create a trip." };
    }
    return { success: false, error: "Could not create the trip." };
  }
}

export async function inviteAction(
  tripId: string,
  email: string,
  role: "member" | "moderator" = "member",
): Promise<
  | { success: true; added: boolean; emailSent: boolean }
  | { success: false; error: string }
> {
  try {
    const r = await inviteToTrip(tripId, email, role);
    return { success: true, added: r.added, emailSent: r.emailSent };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/member cap/i.test(msg)) {
      return { success: false, error: "This trip has hit its member limit." };
    }
    if (/forbidden/i.test(msg)) {
      return { success: false, error: "Only the organizer can invite people." };
    }
    return { success: false, error: "Could not send the invite." };
  }
}

export async function acceptInvitationAction(
  token: string,
): Promise<
  { success: true; tripId: string } | { success: false; error: string }
> {
  try {
    const tripId = await acceptInvitation(token);
    return { success: true, tripId };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not accept the invite.",
    };
  }
}

// Presigned URL for a gallery upload; the key (events/<eventId>/…) and member
// check are handled in the DAL.
export async function tripMediaUploadTargetAction(
  tripId: string,
  fileName: string,
  contentType: string,
): Promise<
  | { success: true; signedUrl: string; key: string; url: string }
  | { success: false; error: string }
> {
  try {
    const target = await tripMediaUploadTarget(tripId, fileName, contentType);
    return { success: true, ...target };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/not configured/i.test(msg)) {
      return { success: false, error: "Uploads need S3 configured." };
    }
    if (/forbidden|unauthorized/i.test(msg)) {
      return { success: false, error: "Only trip members can add photos." };
    }
    return { success: false, error: "Could not start the upload." };
  }
}

export async function deleteTripMediaAction(
  mediaId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await deleteTripMedia(mediaId);
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/forbidden/i.test(msg)) {
      return {
        success: false,
        error: "You can only delete photos you added.",
      };
    }
    return { success: false, error: "Could not delete that item." };
  }
}

export async function mediaDownloadUrlAction(
  mediaId: string,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const url = await getMediaDownloadUrl(mediaId);
    return { success: true, url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/not allowed on plan/i.test(msg)) {
      return {
        success: false,
        error: "Downloads aren't enabled on this plan.",
      };
    }
    return { success: false, error: "Could not prepare the download." };
  }
}

export async function addTripDayNoteAction(
  tripId: string,
  dayDate: string,
  body: string,
): Promise<{ success: true } | { success: false; error: string }> {
  if (!body?.trim()) {
    return { success: false, error: "Write a memory first." };
  }
  try {
    await addTripDayNote(tripId, dayDate, body);
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/forbidden|unauthorized/i.test(msg)) {
      return { success: false, error: "Only trip members can add memories." };
    }
    return { success: false, error: "Could not save the memory." };
  }
}

export async function uploadTripMediaAction(
  tripId: string,
  input: {
    storageKey: string;
    fileName: string;
    contentType: string;
    fileSizeBytes: number;
    dayDate?: string | null;
  },
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await addTripMedia(tripId, input);
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/not allowed on plan/i.test(msg)) {
      return {
        success: false,
        error: "That file type isn't allowed on your plan.",
      };
    }
    if (/exceeds|max file size/i.test(msg)) {
      return {
        success: false,
        error: "That file is over your plan's size limit.",
      };
    }
    if (/storage cap/i.test(msg)) {
      return { success: false, error: "This trip has hit its storage limit." };
    }
    if (/forbidden|unauthorized/i.test(msg)) {
      return { success: false, error: "Only trip members can add photos." };
    }
    return { success: false, error: "Upload failed." };
  }
}
