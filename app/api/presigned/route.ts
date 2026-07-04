import { NextResponse, type NextRequest } from "next/server";
import { createPresignedUpload, isS3Configured } from "@/lib/s3";

// Generic presigned-upload endpoint used by the standalone /upload demo page.
// Real app features (avatars, trip media) use context-scoped, authenticated
// server actions instead — see data/profile.ts and data/trips.ts.
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

  return NextResponse.json(await createPresignedUpload(key, contentType));
}
