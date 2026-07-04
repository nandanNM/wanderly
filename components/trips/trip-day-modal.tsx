"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal, Textarea } from "sketchbook-ui";
import { addTripDayNoteAction } from "@/app/trips/actions";
import { uploadTripMedia } from "./upload-media";
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
}: {
  open: boolean;
  onClose: () => void;
  tripId: string;
  day: TripDay | null;
  photos: TripMediaItem[];
  notes: DayNote[];
  canContribute: boolean;
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
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`Day ${day.number} · ${day.label}`}
      variant="paper"
    >
      <div className="flex flex-col gap-5">
        {/* Photos */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-hand text-xl font-bold">Photos</h3>
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
            <p className="text-sm text-[#9a9a9a]">
              No photos tagged to this day yet.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((m) => (
                <a
                  key={m.id}
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-lg border border-black/10 bg-white"
                >
                  {m.mediaType === "video" ? (
                    <video src={m.url} className="h-24 w-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.url}
                      alt={m.fileName}
                      className="h-24 w-full object-cover"
                    />
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Memories */}
        <div>
          <h3 className="mb-2 font-hand text-xl font-bold">Memories</h3>
          {notes.length === 0 ? (
            <p className="text-sm text-[#9a9a9a]">No memories yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {notes.map((n) => (
                <li
                  key={n.id}
                  className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[#4a4a4a]"
                >
                  ✏️ {n.body}
                </li>
              ))}
            </ul>
          )}
          {canContribute && (
            <div className="mt-3 flex flex-col gap-2">
              <Textarea
                label="Add a memory"
                placeholder="What happened on this day?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
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
    </Modal>
  );
}
