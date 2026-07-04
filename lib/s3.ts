import "server-only";

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Required AWS configuration, read once at module load.
export const s3BucketName = process.env.AWS_S3_BUCKET_NAME;
export const s3Region = process.env.AWS_REGION;

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

/**
 * Returns true when every env var needed to talk to S3 is present.
 * API routes use this to fail fast with a 500 instead of a cryptic AWS error.
 */
export function isS3Configured(): boolean {
  return Boolean(accessKeyId && secretAccessKey && s3BucketName && s3Region);
}

let client: S3Client | null = null;

/** Lazily-constructed, shared S3 client. */
export function getS3Client(): S3Client {
  if (!isS3Configured()) {
    throw new Error(
      "S3 is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME and AWS_REGION.",
    );
  }
  if (!client) {
    client = new S3Client({
      region: s3Region,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });
  }
  return client;
}

/**
 * Public virtual-hosted-style URL for an object key in the bucket. Each path
 * segment is encoded individually so folder separators ("/") survive — keys
 * like `avatars/<userId>/<uuid>.jpg` must stay nested, not collapse to %2F.
 */
export function publicObjectUrl(key: string): string {
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `https://${s3BucketName}.s3.${s3Region}.amazonaws.com/${encoded}`;
}

/**
 * Recover the object key from one of our public URLs, or null if the URL isn't
 * an object in our bucket (e.g. a DiceBear preset). Used before deleting an old
 * upload so we only ever remove files we actually own.
 */
export function keyFromPublicUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname !== `${s3BucketName}.s3.${s3Region}.amazonaws.com`) {
      return null;
    }
    const key = decodeURIComponent(u.pathname.replace(/^\/+/, ""));
    return key || null;
  } catch {
    return null;
  }
}

/**
 * Mint a short-lived presigned PUT URL for `key`. The browser uploads straight
 * to S3 with it; `url` is where the object will be publicly readable afterward.
 * Keys are always built server-side by the DAL so uploads land in the right
 * folder (`avatars/…`, `events/<eventId>/…`) and can't be spoofed by clients.
 */
export async function createPresignedUpload(
  key: string,
  contentType: string,
): Promise<{ signedUrl: string; key: string; url: string }> {
  const command = new PutObjectCommand({
    Bucket: s3BucketName,
    Key: key,
    ContentType: contentType,
  });
  const signedUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: 3600,
  });
  return { signedUrl, key, url: publicObjectUrl(key) };
}

/**
 * Delete an object by key. Best-effort: orphan cleanup should never break the
 * user-facing flow that triggered it, so failures are logged, not thrown.
 */
export async function deleteObject(key: string): Promise<void> {
  if (!isS3Configured()) return;
  try {
    await getS3Client().send(
      new DeleteObjectCommand({ Bucket: s3BucketName, Key: key }),
    );
  } catch (err) {
    console.warn(`Failed to delete S3 object "${key}":`, err);
  }
}

/** Delete an object given its public URL (no-op if the URL isn't ours). */
export async function deleteObjectByUrl(
  url: string | null | undefined,
): Promise<void> {
  const key = keyFromPublicUrl(url);
  if (key) await deleteObject(key);
}

/** Map a MIME type to a file extension for building tidy object keys. */
export function extForContentType(contentType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  };
  return map[contentType] ?? "bin";
}
