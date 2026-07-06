"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { acceptInvitationAction } from "@/app/trips/actions";

export function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setBusy(true);
    setError(null);
    const res = await acceptInvitationAction(token);
    if (res.success) {
      router.push(`/trips/${res.tripId}`);
    } else {
      setBusy(false);
      setError(res.error);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-16">
      <Card className="p-6">
        <h1 className="font-head text-4xl font-bold">
          You&apos;re invited! 🧳
        </h1>
        <p className="mt-2 text-muted-foreground">
          Join this trip to help plan the days and share photos &amp; videos
          with the crew.
        </p>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-5">
          <Button onClick={accept} disabled={busy}>
            {busy ? "Joining…" : "Accept invite"}
          </Button>
        </div>
      </Card>
    </main>
  );
}
