import {
  tripMediaUploadTargetAction,
  uploadTripMediaAction,
} from "@/app/trips/actions";

/**
 * Client helper: presign → PUT to S3 → record the media row. Optionally tags
 * the upload to a roadmap day. Shared by the gallery and the day modal.
 */
export async function uploadTripMedia(
  tripId: string,
  file: File,
  dayDate: string | null = null,
): Promise<void> {
  const target = await tripMediaUploadTargetAction(
    tripId,
    file.name,
    file.type,
  );
  if (!target.success) throw new Error(target.error);

  const put = await fetch(target.signedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!put.ok) throw new Error("Upload to S3 failed.");

  const res = await uploadTripMediaAction(tripId, {
    storageKey: target.key,
    fileName: file.name,
    contentType: file.type,
    fileSizeBytes: file.size,
    dayDate,
  });
  if (!res.success) throw new Error(res.error);
}
