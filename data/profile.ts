import "server-only";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import {
  createPresignedUpload,
  deleteObjectByUrl,
  extForContentType,
  isS3Configured,
} from "@/lib/s3";
import { requireUser } from "./auth";

// The current user's own profile. Email/role are included because the owner is
// authorized to see them — but updateProfile never lets them be changed.
export type ProfileDTO = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  displayName: string | null;
  image: string | null;
  emailVerified: boolean;
  createdAt: Date;
};

export async function getMyProfile(): Promise<ProfileDTO> {
  const current = await requireUser();
  const [row] = await db
    .select()
    .from(user)
    .where(eq(user.id, current.id))
    .limit(1);
  if (!row) {
    throw new Error("User not found");
  }
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    username: row.username,
    displayName: row.displayName,
    image: row.image,
    emailVerified: row.emailVerified,
    createdAt: row.createdAt,
  };
}

/**
 * A presigned target for uploading a new avatar. The key is namespaced under
 * `avatars/<userId>/` so every user's avatars live together and are easy to
 * find/audit; a fresh UUID per upload means old files are never overwritten
 * (the previous one is deleted explicitly in updateProfile).
 */
export async function avatarUploadTarget(
  contentType: string,
): Promise<{ signedUrl: string; key: string; url: string }> {
  const current = await requireUser();
  if (!isS3Configured()) {
    throw new Error("S3 is not configured");
  }
  const key = `avatars/${current.id}/${crypto.randomUUID()}.${extForContentType(
    contentType,
  )}`;
  return createPresignedUpload(key, contentType);
}

/**
 * Update the current user's editable profile fields. Only name / username /
 * displayName / image can change here — email, role, planId are intentionally
 * never touched, so they can't be modified through this path.
 *
 * When the avatar changes, the previous uploaded image is deleted from S3 so
 * we don't leak orphaned objects (preset URLs aren't ours, so they're skipped).
 */
export async function updateProfile(input: {
  name?: string;
  username?: string;
  displayName?: string;
  image?: string;
}): Promise<void> {
  const current = await requireUser();

  const patch: Partial<{
    name: string;
    username: string | null;
    displayName: string | null;
    image: string;
  }> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.username !== undefined)
    patch.username = input.username.trim() || null;
  if (input.displayName !== undefined)
    patch.displayName = input.displayName.trim() || null;
  if (input.image !== undefined) patch.image = input.image;

  if (Object.keys(patch).length === 0) return;

  // Grab the current image first so we can clean it up if it's being replaced.
  let previousImage: string | null = null;
  if (patch.image !== undefined) {
    const [row] = await db
      .select({ image: user.image })
      .from(user)
      .where(eq(user.id, current.id))
      .limit(1);
    previousImage = row?.image ?? null;
  }

  await db.update(user).set(patch).where(eq(user.id, current.id));

  // Best-effort: remove the old avatar object once the new one is saved.
  if (
    patch.image !== undefined &&
    previousImage &&
    previousImage !== patch.image
  ) {
    await deleteObjectByUrl(previousImage);
  }

  revalidatePath("/profile");
}
