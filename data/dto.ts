import "server-only";

// Data Transfer Objects: the safe, minimal shapes the DAL returns to callers
// (Server Components, Server Actions). Never return raw database rows — they
// may carry columns the client should never see. Map to a DTO instead.

import type { InferSelectModel } from "drizzle-orm";
import type { user } from "@/db/auth-schema";

type UserRow = InferSelectModel<typeof user>;

export type PublicUser = {
  id: string;
  name: string;
  image: string | null;
  username: string | null;
};

/** Public projection of a user — no email, plan, or status fields. */
export function toPublicUser(row: Pick<UserRow, keyof PublicUser>): PublicUser {
  return {
    id: row.id,
    name: row.name,
    image: row.image,
    username: row.username,
  };
}
