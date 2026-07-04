"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Divider, Input } from "sketchbook-ui";
import { greenBadge } from "@/lib/site-content";
import { inviteAction } from "@/app/trips/actions";

export function TripInvite({
  tripId,
  pendingInvites,
}: {
  tripId: string;
  pendingInvites: { id: string; email: string; role: string }[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function invite() {
    if (!email.trim()) return;
    setBusy(true);
    setMsg(null);
    const res = await inviteAction(tripId, email.trim());
    setBusy(false);
    if (res.success) {
      setEmail("");
      setMsg(
        res.added
          ? "Added to the trip! 🎉"
          : res.emailSent
            ? "Invite emailed ✉️"
            : "Invite created — set RESEND_API_KEY to email it.",
      );
      router.refresh();
    } else {
      setMsg(res.error);
    }
  }

  return (
    <div>
      <Divider variant="dashed" />
      <p className="font-hand text-xl">Invite a friend</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="w-full">
          <Input
            label="Email"
            type="email"
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button size="sm" onClick={invite} disabled={busy}>
          {busy ? "Sending…" : "Invite"}
        </Button>
      </div>
      {msg && <p className="mt-2 text-sm text-[#5a7d2e]">{msg}</p>}

      {pendingInvites.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {pendingInvites.map((iv) => (
            <li
              key={iv.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-[#5a5a5a]">{iv.email}</span>
              <Badge size="sm" colors={greenBadge}>
                pending
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
