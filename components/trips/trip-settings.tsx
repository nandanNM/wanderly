"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  Divider,
  Input,
  Modal,
  RadioGroup,
  ToastContainer,
  useToast,
} from "sketchbook-ui";
import { greenBadge } from "@/lib/site-content";
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
  const { toasts, showToast, dismissToast } = useToast();
  const [section, setSection] = useState<Section>("crew");

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link
          href={`/trips/${trip.id}`}
          className="text-sm text-[#5a7d2e] hover:underline"
        >
          ← Back to {trip.title}
        </Link>
        <h1 className="font-hand mt-1 text-4xl font-bold sm:text-5xl">
          Trip settings
        </h1>
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
                  ? "border-black/20 bg-[#eef3e3] font-semibold text-[#2a2a2a]"
                  : "border-transparent text-[#5a5a5a] hover:bg-black/[0.04]"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Panels */}
        <div>
          {section === "crew" && (
            <CrewSection trip={trip} showToast={showToast} router={router} />
          )}
          {section === "sharing" && (
            <SharingSection trip={trip} showToast={showToast} router={router} />
          )}
          {section === "danger" && (
            <DangerSection trip={trip} showToast={showToast} router={router} />
          )}
        </div>
      </div>

      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        position="bottom-right"
      />
    </main>
  );
}

type SectionProps = {
  trip: TripDetail;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  router: ReturnType<typeof useRouter>;
};

function CrewSection({ trip, showToast, router }: SectionProps) {
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
      showToast(
        res.added
          ? "Added to the trip! 🎉"
          : res.emailSent
            ? "Invite emailed ✉️"
            : "Invite created — set RESEND_API_KEY to email it.",
        "success",
      );
      router.refresh();
    } else {
      showToast(res.error, "error");
    }
  }

  async function remove(id: string) {
    setRemovingId(id);
    const res = await removeTripMemberAction(trip.id, id);
    setRemovingId(null);
    if (res.success) {
      showToast("Removed from the trip.", "success");
      router.refresh();
    } else {
      showToast(res.error, "error");
    }
  }

  return (
    <Card variant="paper">
      <h2 className="font-hand text-2xl font-bold">Crew</h2>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        Everyone on this trip can view the roadmap and share photos.
      </p>

      <ul className="mt-4 flex flex-col gap-2">
        {trip.members.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-3 py-2"
          >
            <span className="flex items-center gap-2">
              {m.name}
              <Badge size="sm" colors={greenBadge}>
                {m.role}
              </Badge>
            </span>
            {m.role !== "owner" && (
              <Button
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

      {trip.pendingInvites.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {trip.pendingInvites.map((iv) => (
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
    </Card>
  );
}

function SharingSection({ trip, showToast, router }: SectionProps) {
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
      showToast(
        v === "public" ? "Anyone with the link can view." : "Trip is private.",
        "success",
      );
      router.refresh();
    } else {
      showToast(res.error, "error");
      setVisibility(trip.event?.visibility ?? "private"); // revert
    }
  }

  return (
    <Card variant="paper">
      <h2 className="font-hand text-2xl font-bold">Sharing</h2>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        Control who can open this trip and hand out the link.
      </p>

      <div className="mt-4">
        <p className="mb-1 font-hand text-xl">Visibility</p>
        <RadioGroup
          name="visibility"
          value={visibility}
          onChange={change}
          options={[
            { value: "private", label: "Private — only crew can view" },
            {
              value: "public",
              label: "Public — anyone with the link can view",
            },
          ]}
        />
        {saving && <p className="mt-1 text-xs text-[#9a9a9a]">Saving…</p>}
      </div>

      <Divider variant="dashed" />
      <p className="font-hand text-xl">Share link & QR</p>
      <p className="text-sm text-[#7a7a7a]">
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

function DangerSection({ trip, showToast, router }: SectionProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function del() {
    setDeleting(true);
    const res = await deleteTripAction(trip.id);
    if (res.success) {
      showToast("Trip deleted.", "success");
      router.push("/trips");
    } else {
      setDeleting(false);
      showToast(res.error, "error");
    }
  }

  return (
    <Card variant="paper" className="border-red-300">
      <h2 className="font-hand text-2xl font-bold text-red-700">Danger zone</h2>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        Deleting a trip removes its roadmap, crew, memories and{" "}
        <strong>all uploaded photos &amp; videos</strong>. This can&apos;t be
        undone.
      </p>
      <div className="mt-3">
        <Button
          size="sm"
          colors={{ bg: "#fee2e2", text: "#b91c1c", stroke: "#f1a3a3" }}
          onClick={() => setConfirmOpen(true)}
        >
          Delete this trip
        </Button>
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        title="Delete this trip?"
        variant="paper"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              colors={{ bg: "#fee2e2", text: "#b91c1c", stroke: "#f1a3a3" }}
              onClick={del}
              disabled={deleting || typed.trim() !== trip.title}
            >
              {deleting ? "Deleting…" : "Delete forever"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[#5a5a5a]">
          This permanently deletes <strong>{trip.title}</strong>, its crew,
          memories and every uploaded photo/video (including the storage
          folder).
        </p>
        <p className="mt-3 text-sm text-[#5a5a5a]">
          Type <strong>{trip.title}</strong> to confirm:
        </p>
        <div className="mt-1">
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={trip.title}
          />
        </div>
      </Modal>
    </Card>
  );
}
