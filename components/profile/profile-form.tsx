"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Cropper, type ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import Resizer from "react-image-file-resizer";
import { toast } from "sonner";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { AvatarUpload } from "@/components/ui/avatar-upload";
import {
  avatarUploadTargetAction,
  updateProfileAction,
} from "@/app/profile/actions";
import type { ProfileDTO } from "@/data/profile";
import type { PlanUsage } from "@/data/subscriptions";

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
      toast.success("Photo ready — hit Save to apply it ✎");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    const res = await updateProfileAction({ name, username, image });
    setSaving(false);
    if (res.success) {
      toast.success("Profile updated ✎");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="font-pixel text-4xl sm:text-5xl">Your profile</h1>
        <p className="mt-1 text-muted-foreground">
          Update how you show up on Wanderly.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar card */}
        <Card className="p-6 lg:col-span-1">
          <h2 className="font-head text-2xl font-bold">Avatar</h2>
          <div className="mt-4 flex flex-col items-center gap-4">
            <AvatarUpload value={image} onFileSelected={onAvatarFile} />
            <p className="font-head text-lg">or pick a look</p>
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
                      selected ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                    aria-label={`Avatar ${seed}`}
                  >
                    <Avatar className="size-12">
                      <AvatarImage src={url} alt="" />
                      <AvatarFallback>{seed[0]}</AvatarFallback>
                    </Avatar>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Account details card */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-head text-2xl font-bold">Account details</h2>
          <div className="mt-4 flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                placeholder="How your name appears"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="a unique handle"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile.email} disabled readOnly />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Your email is tied to your account and can&apos;t be changed.
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plan</span>
                <Badge>{plan?.planName ?? "Free"}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email verified</span>
                <Badge variant={profile.emailVerified ? "default" : "outline"}>
                  {profile.emailVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
              {plan && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Trips used</span>
                  <span className="font-medium">
                    {plan.tripsUsed}
                    {plan.maxTrips != null ? ` / ${plan.maxTrips}` : ""}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Member since</span>
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
      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crop your photo</DialogTitle>
          </DialogHeader>
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
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCropOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={applyCrop} disabled={uploading}>
              {uploading ? "Uploading…" : "Use photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
