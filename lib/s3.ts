import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

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

/** Public virtual-hosted-style URL for an object key in the bucket. */
export function publicObjectUrl(key: string): string {
  return `https://${s3BucketName}.s3.${s3Region}.amazonaws.com/${encodeURIComponent(
    key,
  )}`;
}
