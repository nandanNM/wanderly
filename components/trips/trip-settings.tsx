"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  inviteAction,
  removeTripMemberAction,
  setTripVisibilityAction,
  deleteTripAction,
} from "@/app/trips/actions";
import { ShareDialog } from "./share-dialog";
import type { TripDetail } from "@/data/trips";

type Section = "crew" | "sharing" | "danger";

const NAV: { key: Section; label: string; icon: string }[] = [
  { key: "crew", label: "Crew", icon: "👥" },
  { key: "sharing", label: "Sharing", icon: "🔗" },
  { key: "danger", label: "Danger zone", icon: "⚠️" },
];

export function TripSettings({ trip }: { trip: TripDetail }) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("crew");

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link
          href={`/trips/${trip.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to {trip.title}
        </Link>
        <h1 className="font-pixel mt-1 text-4xl sm:text-5xl">Trip settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        {/* Left nav (GitHub-style) */}
        <nav className="flex flex-row flex-wrap gap-2 md:flex-col">
          {NAV.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSection(item.key)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                section === item.key
                  ? "border-border bg-muted font-semibold text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Panels */}
        <div>
          {section === "crew" && <CrewSection trip={trip} router={router} />}
          {section === "sharing" && (
            <SharingSection trip={trip} router={router} />
          )}
          {section === "danger" && (
            <DangerSection trip={trip} router={router} />
          )}
        </div>
      </div>
    </main>
  );
}

type SectionProps = {
  trip: TripDetail;
  router: ReturnType<typeof useRouter>;
};

function CrewSection({ trip, router }: SectionProps) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function invite() {
    if (!email.trim()) return;
    setBusy(true);
    const res = await inviteAction(trip.id, email.trim());
    setBusy(false);
    if (res.success) {
      setEmail("");
      toast.success(
        res.added
          ? "Added to the trip! 🎉"
          : res.emailSent
            ? "Invite emailed ✉️"
            : "Invite created — set RESEND_API_KEY to email it.",
      );
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function remove(id: string) {
    setRemovingId(id);
    const res = await removeTripMemberAction(trip.id, id);
    setRemovingId(null);
    if (res.success) {
      toast.success("Removed from the trip.");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="font-head text-2xl font-bold">Crew</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Everyone on this trip can view the roadmap and share photos.
      </p>

      <ul className="mt-4 flex flex-col gap-2">
        {trip.members.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
          >
            <span className="flex items-center gap-2">
              {m.name}
              <Badge>{m.role}</Badge>
            </span>
            {m.role !== "owner" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => remove(m.id)}
                disabled={removingId === m.id}
              >
                {removingId === m.id ? "Removing…" : "Remove"}
              </Button>
            )}
          </li>
        ))}
      </ul>

      <Separator className="my-4" />
      <p className="font-head text-xl">Invite a friend</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="grid w-full gap-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
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

      {trip.pendingInvites.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {trip.pendingInvites.map((iv) => (
            <li
              key={iv.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">{iv.email}</span>
              <Badge>pending</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function SharingSection({ trip, router }: SectionProps) {
  const [visibility, setVisibility] = useState(
    trip.event?.visibility ?? "private",
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function change(next: string) {
    const v = next as "public" | "private";
    setVisibility(v);
    setSaving(true);
    const res = await setTripVisibilityAction(trip.id, v);
    setSaving(false);
    if (res.success) {
      toast.success(
        v === "public" ? "Anyone with the link can view." : "Trip is private.",
      );
      router.refresh();
    } else {
      toast.error(res.error);
      setVisibility(trip.event?.visibility ?? "private"); // revert
    }
  }

  return (
    <Card className="p-6">
      <h2 className="font-head text-2xl font-bold">Sharing</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Control who can open this trip and hand out the link.
      </p>

      <div className="mt-4">
        <p className="mb-1 font-head text-xl">Visibility</p>
        <RadioGroup value={visibility} onValueChange={change}>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="private" id="vis-private" />
            <Label htmlFor="vis-private">Private — only crew can view</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="public" id="vis-public" />
            <Label htmlFor="vis-public">
              Public — anyone with the link can view
            </Label>
          </div>
        </RadioGroup>
        {saving && (
          <p className="mt-1 text-xs text-muted-foreground">Saving…</p>
        )}
      </div>

      <Separator className="my-4" />
      <p className="font-head text-xl">Share link & QR</p>
      <p className="text-sm text-muted-foreground">
        Copy a link, show a QR code, or email an invite.
      </p>
      <div className="mt-2">
        <Button size="sm" onClick={() => setShareOpen(true)}>
          Share this trip
        </Button>
      </div>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        tripId={trip.id}
        title={trip.title}
      />
    </Card>
  );
}

function DangerSection({ trip, router }: SectionProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function del() {
    setDeleting(true);
    const res = await deleteTripAction(trip.id);
    if (res.success) {
      toast.success("Trip deleted.");
      router.push("/trips");
    } else {
      setDeleting(false);
      toast.error(res.error);
    }
  }

  return (
    <Card className="border-destructive p-6">
      <h2 className="font-head text-2xl font-bold text-destructive">
        Danger zone
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Deleting a trip removes its roadmap, crew, memories and{" "}
        <strong>all uploaded photos &amp; videos</strong>. This can&apos;t be
        undone.
      </p>
      <div className="mt-3">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmOpen(true)}
        >
          Delete this trip
        </Button>
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => {
          if (!o && !deleting) setConfirmOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this trip?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This permanently deletes <strong>{trip.title}</strong>, its crew,
            memories and every uploaded photo/video (including the storage
            folder).
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Type <strong>{trip.title}</strong> to confirm:
          </p>
          <div className="mt-1">
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={trip.title}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={del}
              disabled={deleting || typed.trim() !== trip.title}
            >
              {deleting ? "Deleting…" : "Delete forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
