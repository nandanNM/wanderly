"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, Card, Divider } from "sketchbook-ui";
import { authClient } from "@/lib/auth-client";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function SignInCard() {
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/upload",
      });
    } catch {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      {/* Illustration panel (desktop) */}
      <div className="hidden items-center justify-center bg-[#eaf1fb] p-10 md:flex">
        <Image
          src="/3562.jpg"
          alt="Need a vacation — hand-drawn travel sketch"
          width={800}
          height={821}
          priority
          className="h-auto w-full max-w-md mix-blend-multiply"
        />
      </div>

      {/* Sign-in panel */}
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md border border-black/15 bg-white text-lg">
              ✎
            </span>
            <span className="font-hand border-b-[3px] border-[#6f97d8] pb-0.5 text-3xl font-bold">
              Wanderly
            </span>
          </div>

          {/* Compact illustration (mobile only) */}
          <Image
            src="/3562.jpg"
            alt="Need a vacation — hand-drawn travel sketch"
            width={400}
            height={410}
            priority
            className="mx-auto mb-4 h-auto w-40 mix-blend-multiply md:hidden"
          />

          <Card variant="paper">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="font-hand text-4xl font-bold">Welcome back</h1>
              <p className="text-[#5a5a5a]">
                Sign in to plan trips and gather every memory in one place.
              </p>
            </div>

            <div className="my-6">
              <Divider variant="dashed" />
            </div>

            <div className="flex justify-center">
              <Button onClick={signInWithGoogle} disabled={loading}>
                <span className="flex items-center justify-center gap-2">
                  <GoogleIcon />
                  {loading ? "Redirecting…" : "Continue with Google"}
                </span>
              </Button>
            </div>

            <p className="mt-6 text-center text-sm text-[#7a7a7a]">
              By continuing you agree to our Terms & Privacy Policy.
            </p>
          </Card>

          <p className="mt-6 text-center text-sm text-[#7a7a7a]">
            <Link href="/" className="underline hover:text-[#2a2a2a]">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
