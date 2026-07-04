import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/auth-schema";
import { plans } from "@/db/plans-schema";

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
  // Add social providers here, e.g.:
  // socialProviders: {
  //   google: {
  //     clientId: process.env.GOOGLE_CLIENT_ID!,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  //   },
  // },
});
