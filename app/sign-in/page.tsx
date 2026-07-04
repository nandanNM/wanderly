import type { Metadata } from "next";
import { SignInCard } from "./sign-in-card";

export const metadata: Metadata = {
  title: "Sign in · Wanderly",
};

export default function SignInPage() {
  return <SignInCard />;
}
