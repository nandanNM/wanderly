"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Cropper, type ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import Resizer from "react-image-file-resizer";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Input,
  Modal,
  ToastContainer,
  useToast,
} from "sketchbook-ui";
import { format } from "date-fns";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { greenBadge } from "@/lib/site-content";
import {
  avatarUploadTargetAction,
  updateProfileAction,
} from "@/app/profile/actions";
import type { ProfileDTO } from "@/data/profile";
import type { PlanUsage } from "@/data/subscriptions";

const mutedBadge = { bg: "#f0ede6", text: "#7a7a7a", stroke: "#c9c4b8" };

function fmtDate(d: Date): string {
  return format(new Date(d), "MMM d, yyyy");
}

// Open Peeps hand-drawn avatars via DiceBear's open-peeps style.
const PEEP_SEEDS = [
  "Wanderer",
  "Explorer",
  "Nomad",
  "Voyager",
  "Drifter",
  "Rover",
  "Nova",
  "Scout",
];
const peep = (seed: string) =>
  `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(seed)}`;

// Upload a cropped+resized avatar to S3 (key: avatars/<userId>/…) and return
// its public URL. The presigned target is minted server-side by the DAL.
async function uploadAvatar(file: File): Promise<string> {
  const target = await avatarUploadTargetAction(file.type);
  if (!target.success) throw new Error(target.error);
  const put = await fetch(target.signedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!put.ok) throw new Error("Upload to S3 failed.");
  return target.url;
}

export function ProfileForm({
  profile,
  plan,
}: {
  profile: ProfileDTO;
  plan: PlanUsage | null;
}) {
  const router = useRouter();
  const { toasts, showToast, dismissToast } = useToast();

  const [name, setName] = useState(profile.name ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [image, setImage] = useState(profile.image ?? peep(profile.id));
  const [saving, setSaving] = useState(false);

  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const cropperRef = useRef<ReactCropperElement>(null);

  // Picked from AvatarUpload (drag/click) → open the crop modal.
  function onAvatarFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  }

  async function applyCrop() {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    setUploading(true);
    try {
      const canvas = cropper.getCroppedCanvas({ width: 512, height: 512 });
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Could not crop image."))),
          "image/jpeg",
          0.9,
        ),
      );
      const cropped = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      // Compress/normalize to 256px with react-image-file-resizer.
      const resized = await new Promise<File>((resolve) =>
        Resizer.imageFileResizer(
          cropped,
          256,
          256,
          "JPEG",
          82,
          0,
          (uri) => resolve(uri as File),
          "file",
        ),
      );
      const url = await uploadAvatar(resized);
      setImage(url);
      setCropOpen(false);
      showToast("Photo ready — hit Save to apply it ✎", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    const res = await updateProfileAction({ name, username, image });
    setSaving(false);
    if (res.success) {
      showToast("Profile updated ✎", "success");
      router.refresh();
    } else {
      showToast(res.error, "error");
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="font-hand text-4xl font-bold sm:text-5xl">
          Your profile
        </h1>
        <p className="mt-1 text-[#5a5a5a]">
          Update how you show up on Wanderly.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar card */}
        <Card variant="paper" className="lg:col-span-1">
          <h2 className="font-hand text-2xl font-bold">Avatar</h2>
          <div className="mt-4 flex flex-col items-center gap-4">
            <AvatarUpload value={image} onFileSelected={onAvatarFile} />
            <p className="font-hand text-lg">or pick a look</p>
            <div className="flex flex-wrap justify-center gap-3">
              {PEEP_SEEDS.map((seed) => {
                const url = peep(seed);
                const selected = image === url;
                return (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => setImage(url)}
                    className={`rounded-full transition-transform hover:-translate-y-0.5 ${
                      selected ? "ring-2 ring-[#2f7d7a] ring-offset-2" : ""
                    }`}
                    aria-label={`Avatar ${seed}`}
                  >
                    <Avatar src={url} size="sm" />
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Account details card */}
        <Card variant="paper" className="lg:col-span-2">
          <h2 className="font-hand text-2xl font-bold">Account details</h2>
          <div className="mt-4 flex flex-col gap-5">
            <Input
              label="Display name"
              placeholder="How your name appears"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Username"
              placeholder="a unique handle"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <div>
              <Input label="Email" value={profile.email} disabled readOnly />
              <p className="mt-1 text-xs text-[#9a9a9a]">
                Your email is tied to your account and can&apos;t be changed.
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white/60 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#5a5a5a]">Plan</span>
                <Badge size="sm" colors={greenBadge}>
                  {plan?.planName ?? "Free"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5a5a5a]">Email verified</span>
                <Badge
                  size="sm"
                  colors={profile.emailVerified ? greenBadge : mutedBadge}
                >
                  {profile.emailVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
              {plan && (
                <div className="flex items-center justify-between">
                  <span className="text-[#5a5a5a]">Trips used</span>
                  <span className="font-medium">
                    {plan.tripsUsed}
                    {plan.maxTrips != null ? ` / ${plan.maxTrips}` : ""}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[#5a5a5a]">Member since</span>
                <span className="font-medium">
                  {fmtDate(profile.createdAt)}
                </span>
              </div>
            </div>
            <div>
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Crop modal */}
      <Modal
        isOpen={cropOpen}
        onClose={() => setCropOpen(false)}
        title="Crop your photo"
        variant="paper"
        footer={
          <div className="flex justify-end gap-3">
            <Button size="sm" onClick={() => setCropOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={applyCrop} disabled={uploading}>
              {uploading ? "Uploading…" : "Use photo"}
            </Button>
          </div>
        }
      >
        {cropSrc && (
          <Cropper
            src={cropSrc}
            style={{ height: 300, width: "100%" }}
            aspectRatio={1}
            viewMode={1}
            guides
            background={false}
            responsive
            autoCropArea={1}
            ref={cropperRef}
          />
        )}
      </Modal>

      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        position="bottom-right"
      />
    </main>
  );
}
