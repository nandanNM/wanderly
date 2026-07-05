import { mediaDownloadUrlAction } from "@/app/trips/actions";

/**
 * Trigger a browser download for a media item. The server returns a URL that
 * forces download (Content-Disposition: attachment) for real S3 files; demo/
 * external URLs open in a new tab. Throws if the plan disallows downloads.
 */
export async function downloadMedia(
  mediaId: string,
  fileName: string,
): Promise<void> {
  const res = await mediaDownloadUrlAction(mediaId);
  if (!res.success) throw new Error(res.error);
  const a = document.createElement("a");
  a.href = res.url;
  a.download = fileName;
  a.target = "_blank";
  a.rel = "noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
