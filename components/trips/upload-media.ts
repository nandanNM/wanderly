import {
  tripMediaUploadTargetAction,
  uploadTripMediaAction,
} from "@/app/trips/actions";

/** PUT a file to a presigned S3 URL, reporting 0–100 upload progress. */
function putWithProgress(
  url: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error("Upload to S3 failed."));
    xhr.onerror = () => reject(new Error("Upload to S3 failed."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.send(file);
  });
}

/**
 * Client helper: presign → PUT to S3 (with progress) → record the media row.
 * Optionally tags the upload to a roadmap day. Shared by the gallery and the
 * day modal.
 */
export async function uploadTripMedia(
  tripId: string,
  file: File,
  dayDate: string | null = null,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const target = await tripMediaUploadTargetAction(
    tripId,
    file.name,
    file.type,
  );
  if (!target.success) throw new Error(target.error);

  await putWithProgress(target.signedUrl, file, onProgress);

  const res = await uploadTripMediaAction(tripId, {
    storageKey: target.key,
    fileName: file.name,
    contentType: file.type,
    fileSizeBytes: file.size,
    dayDate,
  });
  if (!res.success) throw new Error(res.error);
}
