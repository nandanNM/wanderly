import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/data/auth";
import { SignInCard } from "@/components/auth/sign-in-card";

export const metadata: Metadata = {
  title: "Sign in · Wanderly",
};

export default async function SignInPage() {
  // Already signed in? Skip the sign-in page and go to the app.
  const user = await getCurrentUser();
  if (user) {
    redirect("/trips");
  }
  return <SignInCard />;
}
