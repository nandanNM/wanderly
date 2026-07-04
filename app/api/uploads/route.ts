import { NextResponse, type NextRequest } from "next/server";
import { listUploads, saveUpload } from "@/data/uploads";

// Thin route handlers — all auth/authz/DB logic lives in the DAL (data/uploads).

export async function POST(request: NextRequest) {
  const { key, url, contentType } = await request.json();
  if (!key || !url) {
    return NextResponse.json(
      { error: "key and url are required" },
      { status: 400 },
    );
  }
  try {
    const upload = await saveUpload({ key, url, contentType });
    return NextResponse.json({ upload });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const uploads = await listUploads();
    return NextResponse.json({ uploads });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
