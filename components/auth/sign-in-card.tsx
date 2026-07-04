"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, Card } from "sketchbook-ui";
import { Logo } from "@/components/ui/logo";
import { GoogleIcon } from "@/components/ui/google-icon";
import { authClient } from "@/lib/auth-client";

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
      {/* Illustration panel (desktop) — same paper background */}
      <div className="hidden items-center justify-center p-12 md:flex">
        <Image
          src="/vacation.png"
          alt="Need a vacation — hand-drawn travel sketch"
          width={800}
          height={821}
          priority
          className="h-auto w-full max-w-sm"
        />
      </div>

      {/* Sign-in panel */}
      <div className="flex items-center justify-center px-4 py-12 md:border-l md:border-black/10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Logo priority />
          </div>

          {/* Compact illustration (mobile only) */}
          <Image
            src="/vacation.png"
            alt="Need a vacation — hand-drawn travel sketch"
            width={400}
            height={410}
            priority
            className="mx-auto mb-6 h-auto w-36 md:hidden"
          />

          <Card variant="paper">
            <div className="flex flex-col items-center gap-5 text-center">
              <div>
                <h1 className="font-hand text-4xl font-bold">Welcome back</h1>
                <p className="mt-1 text-[#5a5a5a]">
                  Your trips and memories are waiting. Let&apos;s pick up where
                  you left off. ✎
                </p>
              </div>

              <div className="flex justify-center">
                <Button onClick={signInWithGoogle} disabled={loading}>
                  <span className="flex items-center justify-center gap-2.5">
                    <GoogleIcon />
                    {loading ? "Redirecting…" : "Continue with Google"}
                  </span>
                </Button>
              </div>

              <p className="text-sm text-[#5a5a5a]">
                No password needed — new here? We&apos;ll set up your account
                automatically.
              </p>

              <p className="text-xs leading-relaxed text-[#9a9a9a]">
                By continuing you agree to our Terms &amp; Privacy Policy.
              </p>
            </div>
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
