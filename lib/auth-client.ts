import { createAuthClient } from "better-auth/react";

// baseURL defaults to the current origin in the browser. Set
// NEXT_PUBLIC_BETTER_AUTH_URL if the auth server lives elsewhere.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
