"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addTripDayNoteAction } from "@/app/trips/actions";
import { uploadTripMedia } from "./upload-media";
import { downloadMedia } from "./download-media";
import type { TripMediaItem } from "@/data/trips";
import type { TripDay } from "@/lib/trip-days";

type DayNote = { id: string; body: string };

export function TripDayModal({
  open,
  onClose,
  tripId,
  day,
  photos,
  notes,
  canContribute,
  canDownload,
}: {
  open: boolean;
  onClose: () => void;
  tripId: string;
  day: TripDay | null;
  photos: TripMediaItem[];
  notes: DayNote[];
  canContribute: boolean;
  canDownload: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!day) return null;

  async function saveNote() {
    if (!day || !note.trim()) return;
    setSavingNote(true);
    setError(null);
    const res = await addTripDayNoteAction(tripId, day.date, note);
    setSavingNote(false);
    if (res.success) {
      setNote("");
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !day) return;
    setUploading(true);
    setError(null);
    try {
      await uploadTripMedia(tripId, file, day.date);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`Day ${day.number} · ${day.label}`}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          {/* Photos */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-head text-xl font-bold">Photos</h3>
              {canContribute && (
                <>
                  <Button
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading…" : "+ Add photo"}
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={onFile}
                  />
                </>
              )}
            </div>
            {photos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No photos tagged to this day yet.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((m) => (
                  <div
                    key={m.id}
                    className="group/photo relative aspect-square overflow-hidden rounded-lg border border-black/10 bg-[#eceae3]"
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
                          sizes="(max-width: 640px) 33vw, 160px"
                          className="object-cover"
                        />
                      )}
                    </a>
                    {canDownload && (
                      <button
                        type="button"
                        onClick={() => downloadMedia(m.id, m.fileName)}
                        aria-label="Download"
                        title="Download"
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full border border-black/10 bg-white/90 text-xs text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-[#5a7d2e] group-hover/photo:opacity-100"
                      >
                        ⬇
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Memories */}
          <div>
            <h3 className="mb-2 font-head text-xl font-bold">Memories</h3>
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No memories yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {notes.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-lg border border-black/10 bg-white px-3 py-2 text-muted-foreground"
                  >
                    ✏️ {n.body}
                  </li>
                ))}
              </ul>
            )}
            {canContribute && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="day-memory">Add a memory</Label>
                  <Textarea
                    id="day-memory"
                    placeholder="What happened on this day?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                  />
                </div>
                <div>
                  <Button
                    size="sm"
                    onClick={saveNote}
                    disabled={savingNote || !note.trim()}
                  >
                    {savingNote ? "Saving…" : "Save memory"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
