"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "sketchbook-ui";
import {
  deleteTripMediaAction,
  tripMediaUploadTargetAction,
  uploadTripMediaAction,
} from "@/app/trips/actions";
import type { TripMediaItem } from "@/data/trips";

export function TripGallery({
  tripId,
  media,
}: {
  tripId: string;
  media: TripMediaItem[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus("Uploading…");
    try {
      // 1. Ask the server for a presigned target (key lives under events/<eventId>/).
      const target = await tripMediaUploadTargetAction(
        tripId,
        file.name,
        file.type,
      );
      if (!target.success) throw new Error(target.error);
      // 2. Upload the bytes straight to S3.
      const put = await fetch(target.signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!put.ok) throw new Error("Upload to S3 failed.");
      // 3. Record the object as trip media.
      const res = await uploadTripMediaAction(tripId, {
        storageKey: target.key,
        fileName: file.name,
        contentType: file.type,
        fileSizeBytes: file.size,
      });
      if (!res.success) throw new Error(res.error);
      setStatus("Added!");
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await deleteTripMediaAction(id);
      if (!res.success) throw new Error(res.error);
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not delete.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          {busy ? "Uploading…" : "+ Add photo / video"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={onFile}
        />
        {status && <span className="text-sm text-[#7a7a7a]">{status}</span>}
      </div>

      {media.length === 0 ? (
        <p className="text-[#7a7a7a]">
          No photos yet — be the first to add one from the trip.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((m) => (
            <div
              key={m.id}
              className="group relative overflow-hidden rounded-xl border border-black/10 bg-white"
            >
              <a
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                {m.mediaType === "video" ? (
                  <video src={m.url} className="h-32 w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url}
                    alt={m.fileName}
                    className="h-32 w-full object-cover"
                  />
                )}
              </a>
              {m.canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(m.id)}
                  disabled={deletingId === m.id}
                  aria-label="Delete"
                  className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full border border-black/10 bg-white/90 text-[#5a5a5a] opacity-0 shadow-sm transition-opacity hover:text-red-600 group-hover:opacity-100 disabled:opacity-50"
                >
                  {deletingId === m.id ? "…" : "✕"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
