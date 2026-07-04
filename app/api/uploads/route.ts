import { NextResponse, type NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { auth } from "@/lib/auth";

// Save a reference to an object that was uploaded to S3.
export async function POST(request: NextRequest) {
  const { key, url, contentType } = await request.json();
  if (!key || !url) {
    return NextResponse.json(
      { error: "key and url are required" },
      { status: 400 },
    );
  }

  // Attribute the upload to the signed-in user if there is a session.
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user.id ?? null;

  try {
    const [row] = await db
      .insert(uploads)
      .values({ key, url, contentType, userId })
      .returning();
    return NextResponse.json({ upload: row });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

// List recent uploads (the current user's, or all when signed out).
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  try {
    const rows = session
      ? await db
          .select()
          .from(uploads)
          .where(eq(uploads.userId, session.user.id))
          .orderBy(desc(uploads.createdAt))
          .limit(20)
      : await db
          .select()
          .from(uploads)
          .orderBy(desc(uploads.createdAt))
          .limit(20);
    return NextResponse.json({ uploads: rows });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
