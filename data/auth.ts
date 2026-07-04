import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Cached per request (React `cache`) so repeated calls in a single render/
// action share one session lookup instead of re-reading cookies each time.
// This discourages threading the session object between components, which
// minimizes the risk of leaking it to a Client Component.
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  return session?.user ?? null;
});

/** Throws "Unauthorized" if there is no signed-in user; otherwise returns it. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
