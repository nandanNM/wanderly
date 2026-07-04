import { NextResponse, type NextRequest } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import {
  getS3Client,
  isS3Configured,
  publicObjectUrl,
  s3BucketName,
} from "@/lib/s3";

export async function GET(request: NextRequest) {
  if (!isS3Configured()) {
    return NextResponse.json({ error: "S3 not configured" }, { status: 500 });
  }

  const { searchParams } = request.nextUrl;
  const fileName = searchParams.get("fileName");
  const contentType = searchParams.get("contentType");
  if (!fileName || !contentType) {
    return NextResponse.json(
      { error: "fileName and contentType are required" },
      { status: 400 },
    );
  }

  // Unique key so uploads with the same name don't overwrite each other.
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `uploads/${crypto.randomUUID()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: s3BucketName,
    Key: key,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: 3600,
  });

  return NextResponse.json({
    signedUrl,
    key,
    url: publicObjectUrl(key),
  });
}
