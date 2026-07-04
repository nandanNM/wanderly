import "server-only";

import { desc, eq, type InferSelectModel } from "drizzle-orm";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { getCurrentUser } from "./auth";

type UploadRow = InferSelectModel<typeof uploads>;

export type UploadDTO = {
  id: string;
  key: string;
  url: string;
  contentType: string | null;
  createdAt: Date;
};

function toUploadDTO(row: UploadRow): UploadDTO {
  return {
    id: row.id,
    key: row.key,
    url: row.url,
    contentType: row.contentType,
    createdAt: row.createdAt,
  };
}

/** Save a reference to an object uploaded to S3, attributed to the session user. */
export async function saveUpload(input: {
  key: string;
  url: string;
  contentType?: string | null;
}): Promise<UploadDTO> {
  const user = await getCurrentUser();
  const [row] = await db
    .insert(uploads)
    .values({
      key: input.key,
      url: input.url,
      contentType: input.contentType ?? null,
      userId: user?.id ?? null,
    })
    .returning();
  return toUploadDTO(row);
}

/** Recent uploads — the current user's when signed in, otherwise the latest. */
export async function listUploads(limit = 20): Promise<UploadDTO[]> {
  const user = await getCurrentUser();
  const rows = user
    ? await db
        .select()
        .from(uploads)
        .where(eq(uploads.userId, user.id))
        .orderBy(desc(uploads.createdAt))
        .limit(limit)
    : await db
        .select()
        .from(uploads)
        .orderBy(desc(uploads.createdAt))
        .limit(limit);
  return rows.map(toUploadDTO);
}
