"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteTripMediaAction } from "@/app/trips/actions";
import { uploadTripMedia } from "./upload-media";
import { downloadMedia } from "./download-media";
import { formatBytes } from "@/hooks/use-file-upload";
import type { TripMediaItem, TripStorage } from "@/data/trips";
import type { TripDay } from "@/lib/trip-days";

const WHOLE_TRIP = "";
// Radix Select rejects an empty-string item value, so the "whole trip" option
// uses this sentinel in the Select and maps back to WHOLE_TRIP ("") in state.
const WHOLE_TRIP_OPTION = "__whole_trip__";
// How many photos to reveal per infinite-scroll step.
const PAGE = 12;

type Job = {
  id: string;
  name: string;
  percent: number;
  status: "uploading" | "done" | "error";
  error?: string;
};

// Whether a file's MIME type is allowed by the plan's media types.
function fileAllowed(file: File, allowed: string[]): boolean {
  return allowed.some((t) => {
    if (t === "image") return file.type.startsWith("image/");
    if (t === "video") return file.type.startsWith("video/");
    if (t === "audio") return file.type.startsWith("audio/");
    if (t === "document")
      return file.type === "application/pdf" || file.type.includes("document");
    return false;
  });
}

const ACCEPT_FOR: Record<string, string> = {
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
  document: "application/pdf",
};

export function TripGallery({
  tripId,
  media,
  days,
  storage,
  canContribute,
}: {
  tripId: string;
  media: TripMediaItem[];
  days: TripDay[];
  storage: TripStorage | null;
  canContribute: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  // Which day the next upload is tagged to ("" = whole trip / untagged).
  const [dayDate, setDayDate] = useState<string>(WHOLE_TRIP);
  // Infinite scroll: only mount `visibleCount` photos, grow as the user scrolls.
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Upload lives in its own dialog.
  const [uploadOpen, setUploadOpen] = useState(false);

  const allowDownloads = storage?.allowDownloads ?? false;
  const allowedTypes = useMemo(
    () => storage?.allowedTypes ?? ["image"],
    [storage],
  );
  const accept = useMemo(
    () =>
      allowedTypes
        .map((t) => ACCEPT_FOR[t])
        .filter(Boolean)
        .join(","),
    [allowedTypes],
  );

  const dayOptions = useMemo(
    () => [
      { value: WHOLE_TRIP, label: "Whole trip" },
      ...days.map((d) => ({
        value: d.date,
        label: `Day ${d.number} · ${d.label}`,
      })),
    ],
    [days],
  );

  const dayLabel = useMemo(() => {
    const map = new Map<string, string>();
    days.forEach((d) => map.set(d.date, `Day ${d.number}`));
    return map;
  }, [days]);

  const usedPct =
    storage && storage.limitBytes > 0
      ? Math.min(
          100,
          Math.round((storage.usedBytes / storage.limitBytes) * 100),
        )
      : 0;

  // Reveal more photos when the sentinel scrolls into view. Re-observing on
  // visibleCount lets it keep filling until the viewport is covered.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE, media.length));
        }
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [media.length, visibleCount]);

  const shownMedia = media.slice(0, visibleCount);

  function setJob(id: string, patch: Partial<Job>) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    // Validate against plan type + per-file size + remaining space (running).
    const problems: string[] = [];
    const accepted: File[] = [];
    let remaining = storage?.remainingBytes ?? Infinity;
    const maxFile = storage?.maxFileBytes ?? Infinity;

    for (const file of files) {
      if (storage && !fileAllowed(file, allowedTypes)) {
        problems.push(`${file.name}: only ${allowedTypes.join(", ")} allowed.`);
        continue;
      }
      if (file.size > maxFile) {
        problems.push(
          `${file.name} is ${formatBytes(file.size)} — over the ${formatBytes(maxFile)} per-file limit.`,
        );
        continue;
      }
      if (file.size > remaining) {
        problems.push(
          `${file.name} won't fit — only ${formatBytes(remaining)} left in this trip.`,
        );
        continue;
      }
      remaining -= file.size;
      accepted.push(file);
    }
    setErrors(problems);
    if (accepted.length === 0) return;

    setBusy(true);
    // Seed a job per accepted file so the user sees progress rows immediately.
    const seeded: Job[] = accepted.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      percent: 0,
      status: "uploading",
    }));
    setJobs(seeded);

    // Upload sequentially so quota math and progress stay predictable.
    for (let i = 0; i < accepted.length; i++) {
      const job = seeded[i];
      try {
        await uploadTripMedia(tripId, accepted[i], dayDate || null, (p) =>
          setJob(job.id, { percent: p }),
        );
        setJob(job.id, { percent: 100, status: "done" });
      } catch (err) {
        setJob(job.id, {
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed.",
        });
      }
    }

    setBusy(false);
    router.refresh();
    // Clear finished jobs shortly after so the grid takes over.
    setJobs((prev) => prev.filter((j) => j.status === "error"));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (!canContribute || busy) return;
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }

  async function onDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await deleteTripMediaAction(id);
      if (!res.success) throw new Error(res.error);
      router.refresh();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Could not delete."]);
    } finally {
      setDeletingId(null);
    }
  }

  async function onDownload(id: string, fileName: string) {
    setDownloadingId(id);
    try {
      await downloadMedia(id, fileName);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Could not download."]);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div>
      {/* Header: compact storage summary + open the upload dialog */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {storage ? (
          <span className="text-sm text-muted-foreground">
            {formatBytes(storage.usedBytes)} of{" "}
            {formatBytes(storage.limitBytes)} used ·{" "}
            <span className="font-medium text-[#5a7d2e]">
              {formatBytes(storage.remainingBytes)} free
            </span>
          </span>
        ) : (
          <span />
        )}
        {canContribute && (
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            + Add photos
          </Button>
        )}
      </div>

      {/* Upload dialog */}
      {canContribute && (
        <Dialog
          open={uploadOpen}
          onOpenChange={(o) => {
            if (!o && !busy) setUploadOpen(false);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add photos &amp; videos</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              {storage && (
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatBytes(storage.usedBytes)} of{" "}
                      {formatBytes(storage.limitBytes)} used
                    </span>
                    <span className="font-medium text-[#5a7d2e]">
                      {formatBytes(storage.remainingBytes)} free
                    </span>
                  </div>
                  <Progress value={usedPct} />
                </div>
              )}

              <div
                onClick={() => !busy && fileRef.current?.click()}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
                  isDragging
                    ? "border-[#5a7d2e] bg-[#5a7d2e]/5"
                    : "border-black/20 hover:border-black/40"
                }`}
              >
                <span className="text-2xl">📸</span>
                <p className="font-head text-xl font-bold">
                  Drop photos here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  {allowedTypes.join(", ")}
                  {storage
                    ? ` · up to ${formatBytes(storage.maxFileBytes)} each`
                    : ""}
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept={accept}
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
                  if (fileRef.current) fileRef.current.value = "";
                }}
              />

              {days.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Tag next uploads to
                  </span>
                  <Select
                    value={dayDate === WHOLE_TRIP ? WHOLE_TRIP_OPTION : dayDate}
                    onValueChange={(v) =>
                      setDayDate(v === WHOLE_TRIP_OPTION ? WHOLE_TRIP : v)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOptions.map((o) => (
                        <SelectItem
                          key={o.value}
                          value={
                            o.value === WHOLE_TRIP ? WHOLE_TRIP_OPTION : o.value
                          }
                        >
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {jobs.length > 0 && (
                <div className="flex flex-col gap-2">
                  {jobs.map((j) => (
                    <div key={j.id} className="text-sm">
                      <div className="mb-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-muted-foreground">
                          {j.name}
                        </span>
                        <span
                          className={
                            j.status === "error"
                              ? "text-red-600"
                              : "text-muted-foreground"
                          }
                        >
                          {j.status === "error"
                            ? j.error
                            : j.status === "done"
                              ? "Done"
                              : `${j.percent}%`}
                        </span>
                      </div>
                      {j.status !== "error" && <Progress value={j.percent} />}
                    </div>
                  ))}
                </div>
              )}

              {errors.length > 0 && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-2 text-sm text-red-700">
                  {errors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Grid */}
      <div className="mt-5">
        {media.length === 0 ? (
          <p className="text-muted-foreground">
            No photos yet — be the first to add one from the trip.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {shownMedia.map((m) => (
                <div
                  key={m.id}
                  className="group relative aspect-4/3 overflow-hidden rounded-xl border border-black/10 bg-[#eceae3]"
                >
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block h-full w-full"
                  >
                    {m.mediaType === "video" ? (
                      <video
                        src={m.url}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={m.url}
                        alt={m.fileName}
                        fill
                        loading="lazy"
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover"
                      />
                    )}
                  </a>
                  {m.dayDate && dayLabel.has(m.dayDate) && (
                    <span className="absolute left-1.5 top-1.5">
                      <Badge className="text-xs">
                        {dayLabel.get(m.dayDate)}
                      </Badge>
                    </span>
                  )}
                  <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {allowDownloads && (
                      <button
                        type="button"
                        onClick={() => onDownload(m.id, m.fileName)}
                        disabled={downloadingId === m.id}
                        aria-label="Download"
                        title="Download"
                        className="grid h-7 w-7 place-items-center rounded-full border border-black/10 bg-white/90 text-muted-foreground shadow-sm hover:text-[#5a7d2e] disabled:opacity-50"
                      >
                        {downloadingId === m.id ? "…" : "⬇"}
                      </button>
                    )}
                    {m.canDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(m.id)}
                        disabled={deletingId === m.id}
                        aria-label="Delete"
                        title="Delete"
                        className="grid h-7 w-7 place-items-center rounded-full border border-black/10 bg-white/90 text-muted-foreground shadow-sm hover:text-red-600 disabled:opacity-50"
                      >
                        {deletingId === m.id ? "…" : "✕"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {visibleCount < media.length && (
              <div
                ref={sentinelRef}
                className="mt-4 flex justify-center py-4 text-sm text-muted-foreground"
              >
                Loading more…
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
