"use server";

import { avatarUploadTarget, updateProfile } from "@/data/profile";

// Mint a presigned URL for a new avatar. The key (avatars/<userId>/…) is built
// server-side, so the client can't choose where the file lands.
export async function avatarUploadTargetAction(
  contentType: string,
): Promise<
  | { success: true; signedUrl: string; url: string }
  | { success: false; error: string }
> {
  try {
    const { signedUrl, url } = await avatarUploadTarget(contentType);
    return { success: true, signedUrl, url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/not configured/i.test(msg)) {
      return {
        success: false,
        error: "Photo upload needs S3 configured — try a preset for now.",
      };
    }
    if (/unauthorized/i.test(msg)) {
      return { success: false, error: "Please sign in again." };
    }
    return { success: false, error: "Could not start the upload." };
  }
}

// Thin action → DAL. Auth is enforced inside updateProfile (requireUser); email
// and role are never part of the update.
export async function updateProfileAction(input: {
  name?: string;
  username?: string;
  displayName?: string;
  image?: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await updateProfile(input);
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/unique|duplicate|23505/i.test(msg)) {
      return { success: false, error: "That username is already taken." };
    }
    if (/unauthorized/i.test(msg)) {
      return { success: false, error: "Please sign in again." };
    }
    return { success: false, error: "Could not save changes." };
  }
}
