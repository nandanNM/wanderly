"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Select } from "sketchbook-ui";
import { deleteTripMediaAction } from "@/app/trips/actions";
import { uploadTripMedia } from "./upload-media";
import type { TripMediaItem } from "@/data/trips";
import type { TripDay } from "@/lib/trip-days";

const WHOLE_TRIP = "";

export function TripGallery({
  tripId,
  media,
  days,
}: {
  tripId: string;
  media: TripMediaItem[];
  days: TripDay[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Which day the next upload is tagged to ("" = whole trip / untagged).
  const [dayDate, setDayDate] = useState<string>(WHOLE_TRIP);

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

  // Quick lookup: dayDate -> "Day N" for the per-photo badge.
  const dayLabel = useMemo(() => {
    const map = new Map<string, string>();
    days.forEach((d) => map.set(d.date, `Day ${d.number}`));
    return map;
  }, [days]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus("Uploading…");
    try {
      await uploadTripMedia(tripId, file, dayDate || null);
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
        {days.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#7a7a7a]">Tag to</span>
            <Select
              defaultValue={dayDate}
              onChange={(v: string) => setDayDate(v)}
              options={dayOptions}
            />
          </div>
        )}
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
              {m.dayDate && dayLabel.has(m.dayDate) && (
                <span className="absolute left-1.5 top-1.5">
                  <Badge size="sm">{dayLabel.get(m.dayDate)}</Badge>
                </span>
              )}
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
