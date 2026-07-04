import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/auth-schema";
import { plans } from "@/db/plans-schema";

// Only register Google when its credentials exist, so a missing env var can't
// break auth init. Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET to enable it.
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const socialProviders =
  googleClientId && googleClientSecret
    ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
    : undefined;

// BETTER_AUTH_SECRET and BETTER_AUTH_URL are read from the environment.
// Only set `secret` / `baseURL` here if those env vars are not defined.
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  // App-domain columns added to the `user` table (see db/auth-schema.ts).
  user: {
    additionalFields: {
      username: { type: "string", required: false, input: true },
      displayName: { type: "string", required: false, input: true },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
      planId: { type: "string", required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Assign the Free plan on sign-up (once the plans table is seeded).
        before: async (userData) => {
          try {
            const [free] = await db
              .select({ id: plans.id })
              .from(plans)
              .where(eq(plans.code, "free"))
              .limit(1);
            if (free) {
              return { data: { ...userData, planId: free.id } };
            }
          } catch {
            // plans table not migrated/seeded yet — leave planId null.
          }
          return { data: userData };
        },
      },
    },
  },
  socialProviders,
  // Admin plugin adds role + ban fields (role/banned/banReason/banExpires) to
  // the user and admin management APIs. Users with role "admin" are admins.
  plugins: [admin()],
});
